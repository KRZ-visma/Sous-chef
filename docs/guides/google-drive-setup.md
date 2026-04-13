# Configure Google Drive for recipes and week plan

This app can load recipe JSON from a Google Drive folder and save your week plan to `week-plan.json` in that folder. That behavior is **only active** when both build-time environment variables are set:

| Variable | Meaning |
|----------|---------|
| `VITE_GOOGLE_DRIVE_CLIENT_ID` | OAuth 2.0 **Web application** client ID from Google Cloud |
| `VITE_GOOGLE_DRIVE_FOLDER_ID` | The Drive **folder** id (from the folder URL) that holds `_index.json`, recipe files, and `week-plan.json` |

If either variable is missing at build time, the app uses the bundled sample recipes under `site/public/data/recipes/` and keeps the week plan in the browser only (`localStorage`).

---

## 1. Create or pick a Google Cloud project

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Use the project picker (top bar) to **create a project** or select an existing one.
3. Stay in that project for the next steps.

---

## 2. Enable the Google Drive API

1. In the console, go to **APIs & Services → Library** (or search “Google Drive API”).
2. Open **Google Drive API** and click **Enable**.

---

## 3. Configure the OAuth consent screen

1. Go to **APIs & Services → OAuth consent screen**.
2. Choose **External** (unless you use Google Workspace and only need internal users).
3. Fill in the required app name, support email, and developer contact.
4. On **Scopes**, click **Add or remove scopes** and add at least:
   - `.../auth/drive.readonly` — list and download files (recipe JSON).
   - `.../auth/drive.file` — create and update `week-plan.json` for this app.
5. Save. If the app stays in **Testing**, add each Google account that should sign in under **Test users**.

---

## 4. Create an OAuth “Web application” client

1. Go to **APIs & Services → Credentials**.
2. Click **Create credentials → OAuth client ID**.
3. Application type: **Web application**.
4. **Name** it (for example `Sous-chef web`).
5. **Authorized JavaScript origins** — add every origin where the site runs (no path, no trailing slash issues beyond what Google accepts):

   | Environment | Example origin |
   |-------------|----------------|
   | Local Vite dev | `http://localhost:5173` |
   | GitHub Pages (this repo’s default base path) | `https://<your-username>.github.io` |

   The published app is a [GitHub Pages project site](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages#types-of-github-pages-sites), so it lives under a **repository path** (for example `/Sous-chef/`). The **origin** is still `https://<user>.github.io`; you do not put `/Sous-chef` in the origin field.

6. **Authorized redirect URIs** — not required for the Google Identity Services button used here; you can leave this empty unless you add other OAuth flows later.
7. Click **Create** and copy the **Client ID** — that value is `VITE_GOOGLE_DRIVE_CLIENT_ID`.

---

## 5. Prepare the Drive folder and files

1. In [Google Drive](https://drive.google.com/), create a folder (or use an existing one) for recipe data.
2. Copy the same layout as `site/public/data/recipes/`:
   - `_index.json` — lists recipe ids, for example `{ "recipes": ["my-recipe", "another-recipe"] }`.
   - One file per id: `my-recipe.json`, `another-recipe.json`, etc., matching the [recipe JSON shape](../../site/public/data/recipes/README.md).
3. **Share the folder** with every Google account that should use it (at minimum **Viewer** to read recipes; editors can change files). The account that signs in must be able to open this folder.
4. Open the folder in the browser. The URL looks like:

   `https://drive.google.com/drive/folders/<FOLDER_ID>`

   Copy `<FOLDER_ID>` — that is `VITE_GOOGLE_DRIVE_FOLDER_ID`.

---

## 6. Local development

1. In the `site/` directory, create a file named `.env.local` (gitignored by Vite conventions; do not commit secrets you care about, though these ids are also embedded in the public JS bundle).

   ```bash
   VITE_GOOGLE_DRIVE_CLIENT_ID=<paste Client ID>
   VITE_GOOGLE_DRIVE_FOLDER_ID=<paste Folder ID>
   ```

2. From `site/`, run `npm install` (once) and `npm run dev`.
3. Open the URL Vite prints (typically `http://localhost:5173/`). You should see **Sign in with Google** and **Use sample recipes (offline)**.

---

## 7. GitHub Pages / CI builds

Vite reads `VITE_*` variables **at build time**. For the workflow that runs `npm run build`, those variables must be present in the environment for that step.

1. In the GitHub repo: **Settings → Secrets and variables → Actions → Variables** (or **Secrets** if you prefer).
2. Add repository variables (recommended names):

   - `VITE_GOOGLE_DRIVE_CLIENT_ID`
   - `VITE_GOOGLE_DRIVE_FOLDER_ID`

3. Ensure the deploy workflow passes them into the build step (see `.github/workflows/pages-deploy.yml` in this repo).

After the next deploy to `main`, the live site will include the Google sign-in path.

---

## 8. First-time sign-in checklist

- [ ] Drive API enabled and OAuth client created for the correct origins.
- [ ] Test users added if the OAuth app is in **Testing** mode.
- [ ] Folder shared with the Google account you use to sign in.
- [ ] `_index.json` and all `{id}.json` files present and valid.
- [ ] After sign-in, the app requests Drive permission; approve it so recipes can load and `week-plan.json` can be created or updated.

---

## Troubleshooting

| Symptom | Things to check |
|---------|-------------------|
| “Sign in with Google” does not appear | Both `VITE_*` variables were missing at **build** time; rebuild with them set. |
| `redirect_uri_mismatch` or origin errors | Authorized JavaScript origins must match the page origin exactly (`http://localhost:5173` vs `https://…`). |
| `access_denied` / no Drive files | Folder not shared with the signed-in account, or wrong folder id. |
| Recipes load but week plan does not sync | Scopes and `drive.file` consent; check browser console and network errors. |

For product behavior and scope rationale, see **`docs/decisions/features/0002-google-drive-recipes-and-week-plan.md`**.
