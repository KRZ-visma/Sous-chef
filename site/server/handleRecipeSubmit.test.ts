import { beforeEach, describe, expect, it, vi } from "vitest"
import { handleRecipeSubmitRequest } from "./handleRecipeSubmit"
import * as recipePr from "./recipePr"

vi.mock("./recipePr", async () => {
  const actual = await vi.importActual<typeof import("./recipePr")>("./recipePr")
  return {
    ...actual,
    validateRecipeForSubmit: vi.fn(),
    resolveGithubToken: vi.fn(),
    resolveGithubRepo: vi.fn(),
    createRecipePullRequest: vi.fn(),
  }
})

describe("handleRecipeSubmitRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 503 when token or repo is not configured", async () => {
    vi.mocked(recipePr.validateRecipeForSubmit).mockReturnValue({
      id: "test-id",
      name: "Test",
      days: 1,
      ingredients: [{ item: "salt" }],
    })
    vi.mocked(recipePr.resolveGithubToken).mockReturnValue(null)
    vi.mocked(recipePr.resolveGithubRepo).mockReturnValue({ owner: "acme", repo: "sous-chef" })

    const out = await handleRecipeSubmitRequest({ recipe: { any: "payload" } })

    expect(out.ok).toBe(false)
    expect(out.status).toBe(503)
    if (out.ok) throw new Error('Expected failed response')
    expect(out.json.error).toContain("not configured")
  })

  it("returns pull request metadata for successful submit", async () => {
    vi.mocked(recipePr.validateRecipeForSubmit).mockReturnValue({
      id: "test-id",
      name: "Test",
      days: 1,
      ingredients: [{ item: "salt" }],
    })
    vi.mocked(recipePr.resolveGithubToken).mockReturnValue("token")
    vi.mocked(recipePr.resolveGithubRepo).mockReturnValue({ owner: "acme", repo: "sous-chef" })
    vi.mocked(recipePr.createRecipePullRequest).mockResolvedValue({
      ok: true,
      pullRequestUrl: "https://github.com/acme/sous-chef/pull/123",
      branchName: "recipe/test-id-abc",
    })

    const out = await handleRecipeSubmitRequest({ recipe: { any: "payload" } })

    expect(out).toEqual({
      ok: true,
      status: 200,
      json: {
        pullRequestUrl: "https://github.com/acme/sous-chef/pull/123",
        branchName: "recipe/test-id-abc",
      },
    })
    expect(recipePr.createRecipePullRequest).toHaveBeenCalledWith(
      expect.objectContaining({ id: "test-id" }),
      { githubToken: "token", owner: "acme", repo: "sous-chef" },
    )
  })

  it("converts thrown validation errors to 400", async () => {
    vi.mocked(recipePr.validateRecipeForSubmit).mockImplementation(() => {
      throw new Error("bad payload")
    })

    const out = await handleRecipeSubmitRequest({ recipe: {} })

    expect(out).toEqual({
      ok: false,
      status: 400,
      json: { error: "bad payload" },
    })
  })
})
