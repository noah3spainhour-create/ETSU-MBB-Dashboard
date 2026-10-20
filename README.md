# ETSU CMJ Force Plate Dashboard

A one-page website for ETSU men's basketball ForceDecks countermovement jump (CMJ) testing. It reads the ForceDecks CSV export as-is — no reformatting.

## Adding a new week

**Option A — share it with everyone (recommended)**
1. On github.com, open this repository and go into the `data` folder.
2. Click **Add file → Upload files**, drag in the week's ForceDecks CSV, and click **Commit changes**.
3. Wait about a minute. A GitHub Action adds the file to `data/manifest.json` and the site redeploys. Refresh the dashboard.

**Option B — quick look in your own browser**
Drag the CSV onto the dashboard page (or click **Add weekly CSV**). It's saved in that browser only, so it won't show on other devices or for other staff until it's uploaded to the `data` folder.

Tests are matched by player name and date. If a later export repeats earlier weeks (ForceDecks often exports a date range), the duplicates replace each other instead of piling up.

## Tabs
- **Home** — team briefing, readiness and jump KPIs, full roster with readiness and jumper type, needs-attention list, team trends. Click any player for a profile panel.
- **Jumper profiles** — jump height vs RSI-mod quadrant, split at the team averages: Explosive Elite (high & fast), Power Loader (high, slow), Quick Spring (low, fast), Foundation Builder (low & slow).
- **Exercise plans** — for each player, 4 squat and 4 hinge variations matched to his jumper type, plus single-leg imbalance work aimed at his weaker side when his legs are more than 10% apart (15% for landing). Includes a weekly load note from readiness. Printable.
- **Readiness** — 1–10 score vs the player's own baseline (average of up to 4 earlier clean tests): 7 + 40 × (0.7 × RSI-mod % change + 0.3 × jump height % change), capped 1–10. 1–4 Fatigued, 5–7 Monitor, 8–10 Ready.
- **Coach report** — one-page PDF snapshot for coaches: quadrant chart, bodyweight (lb), jumper type and readiness score for every player. No recommendations.
- **Player reports** — one-page PDF per player (pick a player or download the whole team): jumper type, readiness, team rank, trend, left–right balance, strengths, what to work on, a plain-language summary and next test goal.
- **Extra hours** — Open Weight Room log: check players in by date, pick one or more treatments (Mobility, Stretch, Conditioning, Extra Lift, Prehab/Rehab), add notes. Saves in the browser; Download CSV to back up or share, and upload it to `data/extra-hours.csv` so it loads for everyone. Report bar makes a PDF for one date, the week or all dates, and Email report attaches it (share sheet on phones/Mac; otherwise downloads it and opens a pre-filled email).
- **Data & uploads** — saved tests, full results table, CSV download.

**Bodyweight check:** if a player's bodyweight on a test is more than 4 kg off the median of his other tests, that test is flagged and not used as a comparison point. If half the team is flagged on one date, that whole test is treated as suspect (usually a plate-zero or weigh-in issue).

## Required export columns
`Name`, `Date`, `Jump Height (Imp-Mom) [cm]`, `RSI-modified [m/s]`. Also used when present: `BW [KG]`, `Reps`, `Eccentric Peak Velocity`, `Countermovement Depth`, and the three `% (Asym)` columns for eccentric deceleration impulse, concentric impulse and peak landing force.

## One-time setup
1. Create a new repository on GitHub and upload everything in this folder (including the `.github` folder and the `.nojekyll` file).
2. **Settings → Pages →** Source: *Deploy from a branch*, Branch: `main`, folder `/ (root)`. Save.
3. **Settings → Actions → General →** Workflow permissions: *Read and write permissions*. Save.
4. The site will be at `https://<your-username>.github.io/<repo-name>/`.

Note: a public repository means the site and the CSV files in `data` are viewable by anyone with the link. GitHub Pages on a private repository needs a paid GitHub plan.
