import type { Recipe, RecipeIndexFile } from '../types/recipe'

function recipePath(id: string): string {
  const base = import.meta.env.BASE_URL
  return `${base}data/story-recipes/${encodeURIComponent(id)}.json`
}

function indexPath(): string {
  return `${import.meta.env.BASE_URL}data/story-recipes/_index.json`
}

export async function loadRecipes(): Promise<Recipe[]> {
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
