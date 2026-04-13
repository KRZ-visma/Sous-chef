export function slugifyRecipeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

export function nextAvailableRecipeId(
  name: string,
  existingIds: Iterable<string>,
): string {
  const base = slugifyRecipeName(name)
  if (!base) return ''
  const taken = new Set(existingIds)
  if (!taken.has(base)) return base
  let i = 2
  while (taken.has(`${base}-${i}`)) i += 1
  return `${base}-${i}`
}
