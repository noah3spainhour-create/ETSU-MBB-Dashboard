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
- **Home** — team briefing, readiness and jump KPIs, full roster with readiness and jumper type, needs-attention list, team trends. Click any player for a profile panel, which includes a rotatable 3D **muscle map**.
- **Quadrant** — jump height vs RSI-mod quadrant, split at the team averages: Explosive Elite (high & fast), Power Loader (high, slow), Quick Spring (low, fast), Foundation Builder (low & slow). Click a player to open his profile, which includes his recommended exercises: 4 squat and 4 hinge variations matched to his jumper type, plus single-leg imbalance work when his legs are more than 10% apart (15% for landing).
- **Readiness** — 1–10 score vs the player's own baseline (average of up to 4 earlier clean tests): 7 + 40 × (0.7 × RSI-mod % change + 0.3 × jump height % change), capped 1–10. 1–4 Fatigued, 5–7 Monitor, 8–10 Ready.
- **Symmetry analysis** — a left–right balance card for every player on the selected test (stopping, pushing off, landing; same look as the player report), with the team average marked on each bar and the change since his last test. Plus team averages, a team trend and a player-vs-team trend. Under 10% is balanced, over 15% is a large gap.
- **Program builder** — build the lifting program week by week. Every exercise name, set, rep, load and unit (%, % BW, RPE, lb, kg, sec) and note is editable in place; add, duplicate, reorder or delete exercises and days; add weeks from the current one (same loads, +2.5%, +5%, or a deload of −10% and −1 set). Tick **Group with above** on an exercise to run it in the same block as the one above it — supersets and circuits are labeled automatically (1, 2A, 2B, 3A, 3B, 3C…) on screen and in the printouts. The team program is one-size-fits-all; to change an exercise for a player, switch **Editing** to him and rename or edit it on his card. Set **Week 1 starts** and pick a weekday on each day to place lifts on the calendar. Switch **Editing** to one player to see his version and change anything for him only (gold boxes), skip an exercise for him, or add exercises just for him. Players' versions also adjust automatically from their latest jump test (Fatigued: −1 set, −10% / RPE ≤7; Monitor: RPE ≤8) and add a single-leg set on a weaker leg — both can be switched off. **Print week** prints the team program; **Print player cards** prints one page per player with a "load used" column. The **Calendar** sub tab shows lifts by week or month (click one to open it in the builder); the **Weeks** sub tab flips between weeks like workbook sheets, or shows **All weeks** side by side to see progression. Saves in the browser; **Download program** and upload the file to `data/program.json` so every coach's browser can load it.
- **Reports** — one tab with a Player report / Coach report toggle (it remembers your last pick; old `#report` and `#player-report` links still work).
  - **Coach report** — one-page PDF snapshot for coaches: quadrant chart, bodyweight (lb), jumper type and readiness score for every player. No recommendations.
  - **Player report** — one-page PDF per player (pick a player or download the whole team): jumper type, readiness, team rank, trend, left–right balance, strengths, what to work on, a plain-language summary and next test goal.
- **Extra hours** — Open Weight Room log: check players in by date, pick one or more session focus areas (Mobility, Stretch, Conditioning, Extra Lift, Prehab/Rehab), add notes. Saves in the browser; Download CSV to back up or share, and upload it to `data/extra-hours.csv` so it loads for everyone. Report bar makes a PDF for one date, the week or all dates, and Email report attaches it (share sheet on phones/Mac; otherwise downloads it and opens a pre-filled email).
- **Data & uploads** — saved tests, full results table, CSV download.

**Bodyweight check:** if a player's bodyweight on a test is more than 4 kg off the median of his other tests, that test is flagged and not used as a comparison point. If half the team is flagged on one date, that whole test is treated as suspect (usually a plate-zero or weigh-in issue).

## Muscle map (player profile)
A realistic 3D muscle model in each player's profile. Drag to turn, pinch/scroll to zoom, tap a muscle for what the data says and exercises that train it.
- **Strengths** view: each lower-body muscle group is colored Strength / On par / Focus area by comparing the player with teammates on the selected test — glutes and adductors from jump height, calves from RSI-mod, quads and hamstrings from jump height plus braking speed (Eccentric Peak Velocity), hip stabilizers from landing balance. Core and shins aren't scored by a jump test and stay gray.
- A leg that is measurably weaker (braking or push-off asymmetry over 10%, landing over 15%) is marked down on that side only.
- **Braking / Push-off / Landing** views show which muscles drive that phase, with the weaker leg in red when that phase's asymmetry is over the threshold.
- Force plates measure forces, not muscles, so the muscle colors are an interpretation; left–right differences are measured directly.
- The model (`models/muscles-male.glb`) is from Z-Anatomy / BodyParts3D via the Fit Mit With anatomy atlas, CC BY-SA 4.0 — see `models/ATTRIBUTION.md`. It needs a browser with WebGL; if that's missing the profile still shows the muscle summary list.

## Required export columns
`Name`, `Date`, `Jump Height (Imp-Mom) [cm]`, `RSI-modified [m/s]`. Also used when present: `BW [KG]`, `Reps`, `Eccentric Peak Velocity`, `Countermovement Depth`, and the three `% (Asym)` columns for eccentric deceleration impulse, concentric impulse and peak landing force.

## One-time setup
1. Create a new repository on GitHub and upload everything in this folder (including the `.github` folder and the `.nojekyll` file).
2. **Settings → Pages →** Source: *Deploy from a branch*, Branch: `main`, folder `/ (root)`. Save.
3. **Settings → Actions → General →** Workflow permissions: *Read and write permissions*. Save.
4. The site will be at `https://<your-username>.github.io/<repo-name>/`.

Note: a public repository means the site and the CSV files in `data` are viewable by anyone with the link. GitHub Pages on a private repository needs a paid GitHub plan.
