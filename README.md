# Expense Manager — setup

Two parts: a Google Sheet that stores your data (through a small Apps Script), and `index.html` hosted on GitHub Pages.

## 1. Set up the Google Sheet

1. Create a new Google Sheet (for example “Expense Manager”).
2. Open **Extensions → Apps Script**. Delete what’s there and paste in all of `Code.gs`.
3. On the line `const SECRET_KEY = 'CHANGE-ME-to-a-long-random-phrase';` put your own long phrase. Anyone with your URL **and** this key can read your data, so make it hard to guess.
4. Click **Save**, choose `setup` in the function dropdown and click **Run**. Approve the permissions (choose your account → Advanced → Go to project → Allow). This creates the `Accounts` and `Transactions` tabs.
5. Click **Deploy → New deployment**. Gear icon → **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Click **Deploy** and copy the **Web app URL** (ends in `/exec`).

> If you change `Code.gs` later: **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**. The URL stays the same.

## 2. Put the page on GitHub Pages

1. Create a new repository on GitHub (it can be public; your data is not in it).
2. Upload `index.html` to the root of the repo.
3. **Settings → Pages → Build and deployment**: Source **Deploy from a branch**, branch **main**, folder **/(root)** → Save.
4. After a minute your page is at `https://<your-username>.github.io/<repo-name>/`.

## 3. Connect them

1. Open your page, scroll to **Google Sheets** in the right column.
2. Paste the Web app URL and your secret key → **Connect sheet**.
3. If the sheet is empty, whatever is on the page goes up to it. Clear the sample data first if you want a fresh start.

Do this once on each device (phone, laptop). The URL and key are stored only in that browser, never in the GitHub repo.

## How syncing works

- Every change is saved to the browser straight away and sent to the sheet about a second later. The status under the title shows “Saved to Google Sheets at …”.
- When the page opens it loads from the sheet, so the latest version from any device shows up. If a save failed last time (e.g. you were offline), the page sends its copy up first instead.
- Saving writes the whole data set, so the last device to save wins. Avoid editing on two devices at the same moment.
- You can look at or fix data directly in the sheet. Keep the column headers as they are, and reload the page afterwards (**Reload from sheet**).

## Troubleshooting

- **“Couldn’t reach your sheet”** — the deployment’s access isn’t set to *Anyone*, or the URL is the editor URL instead of the `/exec` one.
- **“Set SECRET_KEY in Code.gs”** — you didn’t change the key, or changed it but didn’t deploy a new version.
- **“Wrong secret key”** — the key typed into the page doesn’t match `Code.gs` exactly.
