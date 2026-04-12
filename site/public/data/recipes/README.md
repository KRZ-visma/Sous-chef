# Recipes (static data)

One **JSON file per recipe**, copied to the published site root as `/data/recipes/` from **`site/public/data/recipes/`** at build time. No database: recipes are versioned in Git and loaded by the app with `fetch()` (same origin).

## File naming

- Use **kebab-case** matching the recipe `id`: `my-dish.json`.
- The `id` inside the file must match the basename (without `.json`).

## Shape

| Field | Type | Required | Notes |
|--------|------|----------|--------|
| `id` | string | yes | Stable slug; matches filename. |
| `name` | string | yes | Display name. |
| `days` | number | yes | How many days this batch covers (typically `1` or `2`). |
| `ingredients` | array | yes | Each entry describes one line item (see below). |

### Ingredients

Each element is an object:

| Field | Type | Required |
|--------|------|----------|
| `item` | string | yes |
| `amount` | string | no |
| `unit` | string | no |

Omit `amount` and `unit` when you only need a free-text line (for example “salt” or “olive oil”).

## Validation

Optional: validate files against [`_schema.json`](./_schema.json) in your editor or CI when tooling exists.

## Decisions

Rationale and trade-offs are recorded in **`docs/decisions/technical/0001-recipe-json-storage.md`**.
