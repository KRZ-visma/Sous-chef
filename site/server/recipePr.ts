import { Octokit } from '@octokit/rest'
import type { Recipe, RecipeIndexFile } from '../src/types/recipe'

const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

export type CreateRecipePrEnv = {
  githubToken: string
  owner: string
  repo: string
}

export type CreateRecipePrResult =
  | { ok: true; pullRequestUrl: string; branchName: string }
  | { ok: false; status: number; message: string }

function recipeJsonPath(id: string): string {
  return `site/public/data/story-recipes/${id}.json`
}

function indexJsonPath(): string {
  return 'site/public/data/story-recipes/_index.json'
}

export function validateRecipeForSubmit(input: unknown): Recipe {
  if (!input || typeof input !== 'object') {
    throw new Error('Recipe must be a JSON object.')
  }
  const o = input as Record<string, unknown>
  const id = o.id
  const name = o.name
  const days = o.days
  const ingredients = o.ingredients

  if (typeof id !== 'string' || !ID_PATTERN.test(id)) {
    throw new Error(
      'Recipe id must be kebab-case (lowercase letters, digits, and single hyphens between segments).',
    )
  }
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('Recipe name is required.')
  }
  if (typeof days !== 'number' || !Number.isFinite(days) || days < 1 || !Number.isInteger(days)) {
    throw new Error('Days must be a whole number at least 1.')
  }
  if (!Array.isArray(ingredients) || ingredients.length < 1) {
    throw new Error('Add at least one ingredient.')
  }

  const parsedIngredients: Recipe['ingredients'] = []
  for (const row of ingredients) {
    if (!row || typeof row !== 'object') {
      throw new Error('Each ingredient must be an object.')
    }
    const r = row as Record<string, unknown>
    if (typeof r.item !== 'string' || r.item.trim().length === 0) {
      throw new Error('Each ingredient needs a non-empty item name.')
    }
    const ing: Recipe['ingredients'][number] = { item: r.item.trim() }
    if (r.amount !== undefined) {
      if (typeof r.amount !== 'string') throw new Error('Ingredient amount must be text.')
      ing.amount = r.amount
    }
    if (r.unit !== undefined) {
      if (typeof r.unit !== 'string') throw new Error('Ingredient unit must be text.')
      ing.unit = r.unit
    }
    const extra = Object.keys(r).filter((k) => !['item', 'amount', 'unit'].includes(k))
    if (extra.length > 0) {
      throw new Error('Ingredients may only include item, amount, and unit.')
    }
    parsedIngredients.push(ing)
  }

  const extraTop = Object.keys(o).filter(
    (k) => !['id', 'name', 'days', 'ingredients'].includes(k),
  )
  if (extraTop.length > 0) {
    throw new Error('Unknown fields on recipe (only id, name, days, ingredients are allowed).')
  }

  return {
    id,
    name: name.trim(),
    days,
    ingredients: parsedIngredients,
  }
}

function formatRecipeJson(recipe: Recipe): string {
  return `${JSON.stringify(recipe, null, 2)}\n`
}

function formatIndexJson(index: RecipeIndexFile): string {
  return `${JSON.stringify(index, null, 2)}\n`
}

export async function createRecipePullRequest(
  recipe: Recipe,
  env: CreateRecipePrEnv,
): Promise<CreateRecipePrResult> {
  const { githubToken, owner, repo } = env
  const octokit = new Octokit({ auth: githubToken })
  const recipePath = recipeJsonPath(recipe.id)

  try {
    await octokit.repos.getContent({
      owner,
      repo,
      path: recipePath,
      ref: 'heads/main',
    })
    return {
      ok: false,
      status: 409,
      message: `A recipe file already exists for id "${recipe.id}". Pick a different id.`,
    }
  } catch (e: unknown) {
    const status = e && typeof e === 'object' && 'status' in e ? Number((e as { status: number }).status) : 0
    if (status !== 404) {
      return {
        ok: false,
        status: 502,
        message: 'Could not verify recipe id against the repository. Try again later.',
      }
    }
  }

  const branchSafe = recipe.id.replace(/[^a-z0-9-]/g, '-').slice(0, 40)
  const branchName = `recipe/${branchSafe}-${Date.now().toString(36)}`

  const { data: mainRef } = await octokit.git.getRef({
    owner,
    repo,
    ref: 'heads/main',
  })
  const mainSha = mainRef.object.sha

  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: mainSha,
  })

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: recipePath,
    message: `Add recipe: ${recipe.name}`,
    content: Buffer.from(formatRecipeJson(recipe), 'utf8').toString('base64'),
    branch: branchName,
  })

  const { data: indexRaw } = await octokit.repos.getContent({
    owner,
    repo,
    path: indexJsonPath(),
    ref: branchName,
  })
  if (!('content' in indexRaw) || Array.isArray(indexRaw)) {
    return {
      ok: false,
      status: 500,
      message: 'Recipe index could not be read.',
    }
  }

  const indexText = Buffer.from(indexRaw.content, 'base64').toString('utf8')
  let indexParsed: RecipeIndexFile
  try {
    indexParsed = JSON.parse(indexText) as RecipeIndexFile
  } catch {
    return { ok: false, status: 500, message: 'Recipe index JSON is invalid on the server.' }
  }
  if (!Array.isArray(indexParsed.recipes)) {
    return { ok: false, status: 500, message: 'Recipe index has unexpected shape.' }
  }
  if (indexParsed.recipes.includes(recipe.id)) {
    return {
      ok: false,
      status: 409,
      message: `The recipe id "${recipe.id}" is already listed in _index.json.`,
    }
  }

  const nextIndex: RecipeIndexFile = {
    recipes: [...indexParsed.recipes, recipe.id].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' }),
    ),
  }

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: indexJsonPath(),
    message: `Register recipe in index: ${recipe.id}`,
    content: Buffer.from(formatIndexJson(nextIndex), 'utf8').toString('base64'),
    sha: indexRaw.sha,
    branch: branchName,
  })

  const { data: pr } = await octokit.pulls.create({
    owner,
    repo,
    title: `Add recipe: ${recipe.name}`,
    head: branchName,
    base: 'main',
    body: `Adds [\`${recipe.id}.json\`](${recipePath}) and updates [\`_index.json\`](${indexJsonPath()}).\n\nSubmitted via the recipe form.`,
  })

  return {
    ok: true,
    pullRequestUrl: pr.html_url,
    branchName,
  }
}

export function resolveGithubRepo(): { owner: string; repo: string } | null {
  const raw = process.env.RECIPE_SUBMIT_REPO ?? process.env.GITHUB_REPOSITORY
  if (!raw || !raw.includes('/')) return null
  const [owner, repo] = raw.split('/', 2)
  if (!owner || !repo) return null
  return { owner, repo }
}

export function resolveGithubToken(): string | null {
  const t =
    process.env.RECIPE_SUBMIT_TOKEN ??
    process.env.GITHUB_TOKEN ??
    process.env.GH_TOKEN ??
    ''
  return t.trim() || null
}
