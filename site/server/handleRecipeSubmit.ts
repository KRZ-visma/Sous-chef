import {
  createRecipePullRequest,
  resolveGithubRepo,
  resolveGithubToken,
  validateRecipeForSubmit,
} from './recipePr'

export type SubmitRecipeSuccess = {
  pullRequestUrl: string
  branchName: string
}

export async function handleRecipeSubmitRequest(
  body: unknown,
): Promise<
  | { ok: true; status: 200; json: SubmitRecipeSuccess }
  | { ok: false; status: number; json: { error: string } }
> {
  try {
    const raw = body && typeof body === 'object' && 'recipe' in body ? (body as { recipe: unknown }).recipe : body
    const recipe = validateRecipeForSubmit(raw)
    const token = resolveGithubToken()
    const ghRepo = resolveGithubRepo()
    if (!token || !ghRepo) {
      return {
        ok: false,
        status: 503,
        json: {
          error:
            'Recipe submission is not configured. Set RECIPE_SUBMIT_TOKEN and RECIPE_SUBMIT_REPO (or GITHUB_TOKEN and GITHUB_REPOSITORY) for local dev.',
        },
      }
    }

    const result = await createRecipePullRequest(recipe, {
      githubToken: token,
      owner: ghRepo.owner,
      repo: ghRepo.repo,
    })

    if (result.ok) {
      return {
        ok: true,
        status: 200,
        json: {
          pullRequestUrl: result.pullRequestUrl,
          branchName: result.branchName,
        },
      }
    }
    return { ok: false, status: result.status, json: { error: result.message } }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Invalid request'
    return { ok: false, status: 400, json: { error: message } }
  }
}
