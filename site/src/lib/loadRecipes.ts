import type { Recipe, RecipeIndexFile } from '../types/recipe'
import { downloadDriveFileText, findFileIdInFolder } from './googleDrive'

function recipePath(id: string): string {
  const base = import.meta.env.BASE_URL
  return `${base}data/recipes/${encodeURIComponent(id)}.json`
}

function indexPath(): string {
  return `${import.meta.env.BASE_URL}data/recipes/_index.json`
}

export async function loadBundledRecipes(): Promise<Recipe[]> {
  const indexRes = await fetch(indexPath())
  if (!indexRes.ok) {
    throw new Error('Could not load recipe list.')
  }
  const index = (await indexRes.json()) as RecipeIndexFile
  const ids = index.recipes
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error('Recipe list is empty.')
  }

  const recipes: Recipe[] = []
  for (const id of ids) {
    const res = await fetch(recipePath(id))
    if (!res.ok) {
      throw new Error(`Missing recipe file for "${id}".`)
    }
    const recipe = (await res.json()) as Recipe
    if (!recipe || recipe.id !== id) {
      throw new Error(`Recipe id mismatch for "${id}".`)
    }
    recipes.push(recipe)
  }

  recipes.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  )

  return recipes
}

export async function loadRecipesFromDrive(
  accessToken: string,
): Promise<Recipe[]> {
  const indexId = await findFileIdInFolder(accessToken, '_index.json')
  if (!indexId) {
    throw new Error('Could not find "_index.json" in the configured Drive folder.')
  }
  const indexText = await downloadDriveFileText(accessToken, indexId)
  let index: RecipeIndexFile
  try {
    index = JSON.parse(indexText) as RecipeIndexFile
  } catch {
    throw new Error('Recipe index is not valid JSON.')
  }
  const ids = index.recipes
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error('Recipe list is empty.')
  }

  const recipes: Recipe[] = []
  for (const id of ids) {
    const fileId = await findFileIdInFolder(accessToken, `${id}.json`)
    if (!fileId) {
      throw new Error(`Missing recipe file for "${id}".`)
    }
    const text = await downloadDriveFileText(accessToken, fileId)
    let recipe: Recipe
    try {
      recipe = JSON.parse(text) as Recipe
    } catch {
      throw new Error(`Recipe file for "${id}" is not valid JSON.`)
    }
    if (!recipe || recipe.id !== id) {
      throw new Error(`Recipe id mismatch for "${id}".`)
    }
    recipes.push(recipe)
  }

  recipes.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  )

  return recipes
}
