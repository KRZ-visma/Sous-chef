export type RecipeIngredient = {
  item: string
  amount?: string
  unit?: string
}

export type Recipe = {
  id: string
  name: string
  days: number
  ingredients: RecipeIngredient[]
}

export type RecipeIndexFile = {
  recipes: string[]
}
