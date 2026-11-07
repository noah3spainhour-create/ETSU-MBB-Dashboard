/* Reads the team's lifting workbook (.xlsx) into dated lift days.
   Each block starts at a "Day N" cell (or an Activation / Optional / Low-Minute title)
   with its date a few cells to the right. Inside a block:
     - section header rows (WUP, Prep, Movement Prep, Mobility, ...) followed by name / scheme pairs
     - numbered rows (1, 2, 3) start a group; the main lift is one or two columns right of the number,
       the scheme is three columns right ("3 x 8" or "WUP"), and set reps sit in every other column after it
     - rows with no number under a group are the rest of that superset (1B, 1C, ...)
     - "Finisher" / "Notes" lines and a "Force Plate" marker
   Works on the raw SheetJS workbook, so it runs in the browser and in Node. */
(function (root) {
  "use strict";
  const SKIP_SHEETS = /^(template|max|weight|body|nba|mile|friday)/i;
  const DAY_RE = /^\s*day\s*\d+\b/i;
  const TITLE_RE = /^\s*(activation|potentiation|optional|low.?minute|recovery day|flush)/i;
  const SCHEME_RE = /^(\d+(\.\d+)?\s*[x×]\s*.*|\d+(\.\d+)?\s*(ea|s|sec|secs|yds?|yards?|m|reps?|min|ea\.?)?\s*$|wup$|d\s*&\s*b$|amrap.*|\d+\s*[-–]\s*\d+.*)/i;

  function grid(XLSX, ws) {
    const ref = ws["!ref"]; if (!ref) return { cells: [], nr: 0, nc: 0 };
    const R = XLSX.utils.decode_range(ref), cells = [];
    for (let r = R.s.r; r <= R.e.r; r++) {
      const row = [];
      for (let c = R.s.c; c <= R.e.c; c++) {
        const cell = ws[XLSX.utils.encode_cell({ r, c })];
        let v = null;
        if (cell && cell.v != null && cell.v !== "") {
          if (cell.t === "n" && cell.z && XLSX.SSF.is_date(cell.z)) { const d = XLSX.SSF.parse_date_code(cell.v); v = { date: `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}` }; }
          else if (cell.t === "d") { const d = cell.v; v = { date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` }; }
          else if (cell.t === "n") v = cell.v;
          else { const s = String(cell.w != null && cell.t !== "s" ? cell.w : cell.v).replace(/\s+/g, " ").trim(); if (s) v = s; }
        }
        row.push(v);
      }
      cells.push(row);
    }
    return { cells, nr: cells.length, nc: cells.reduce((m, r) => Math.max(m, r.length), 0), r0: R.s.r, c0: R.s.c };
  }
  const isText = (v) => typeof v === "string";
  const isDate = (v) => v && typeof v === "object" && v.date;
  const isScheme = (v) => typeof v === "number" || (isText(v) && SCHEME_RE.test(v));
  const isForce = (v) => isText(v) && /^force\s*plate/i.test(v);

  function parseSheet(XLSX, ws, sheetName) {
    const G = grid(XLSX, ws), C = G.cells, at = (r, c) => (C[r] && C[r][c] != null ? C[r][c] : null);
    // 1) anchors
    const anchors = [];
    for (let r = 0; r < G.nr; r++) {
      const row = C[r] || [];
      const days = []; row.forEach((v, c) => { if (isText(v) && DAY_RE.test(v)) days.push(c); });
      let cols = days;
      if (!cols.length) { const t = row.findIndex((v) => isText(v) && TITLE_RE.test(v)); if (t >= 0) cols = [t]; }
      cols.forEach((c, i) => {
        const end = i + 1 < cols.length ? cols[i + 1] - 1 : G.nc - 1;
        let date = null; const notes = [];
        for (let k = c + 1; k <= end; k++) { const v = at(r, k); if (isDate(v) && !date) date = v.date; else if (isText(v)) notes.push(v); }
        anchors.push({ r, c, end, title: at(r, c), date, notes });
      });
    }
    // 2) each block runs to the next anchor row that starts at or left of its column
    return anchors.map((a) => {
      const next = anchors.filter((b) => b.r > a.r && b.c <= a.end && b.end >= a.c).map((b) => b.r);
      const r1 = next.length ? Math.min(...next) - 1 : G.nr - 1;
      return parseBlock(a, r1, at, sheetName);
    }).filter((b) => b.groups.length || b.sections.some((s) => s.items.length));
  }

  function parseBlock(a, r1, at, sheet) {
    const X = a.c, E = a.end;
    const block = { sheet, title: a.title, date: a.date, notes: a.notes.slice(), forcePlate: a.notes.some(isForce), sections: [], groups: [], extra: [] };
    block.notes = block.notes.filter((n) => !isForce(n));
    let heads = null, secMap = null, inMain = false, group = null;
    const rowCells = (r) => { const out = []; for (let c = X; c <= E; c++) { const v = at(r, c); if (v != null) out.push([c, v]); } return out; };
    const addSecItems = (r, cols) => {
      if (!heads) { heads = [{ c: X, label: "Warm-up" }]; secMap = new Map([[X, { label: "Warm-up", items: [] }]]); block.sections.push(secMap.get(X)); }
      heads.forEach((h, i) => {
        const hi = i + 1 < heads.length ? heads[i + 1].c - 1 : E;
        const cs = cols.filter(([c]) => c >= h.c && c <= hi);
        let item = null;
        cs.forEach(([, v]) => {
          if (isForce(v)) { block.forcePlate = true; return; }
          if (isDate(v)) return;
          if (!item && isText(v) && !isScheme(v)) { item = { name: v, scheme: "", note: "" }; return; }
          if (item && !item.scheme && isScheme(v)) { item.scheme = String(v); return; }
          if (item && isText(v)) { if (!item.scheme && isScheme(v)) item.scheme = v; else item.note = item.note ? item.note + " · " + v : v; return; }
          if (!item && isText(v)) item = { name: v, scheme: "", note: "" };
        });
        if (item) secMap.get(h.c).items.push(item);
      });
    };
    for (let r = a.r + 1; r <= r1; r++) {
      const cols = rowCells(r); if (!cols.length) continue;
      cols.forEach(([, v]) => { if (isForce(v)) block.forcePlate = true; });
      const clean = cols.filter(([, v]) => !isForce(v));
      if (!clean.length) continue;
      const num = at(r, X);
      // finisher / notes lines
      const first = clean[0][1];
      if (isText(first) && clean.length === 1 && (/^(finisher|notes?)\b/i.test(first) || first.length > 40)) { block.extra.push(first.replace(/^finisher\s*[-:–]\s*/i, "Finisher: ").replace(/^notes?\s*[-:–]\s*/i, "Notes: ")); continue; }
      // main lift rows
      if (typeof num === "number" || (inMain && clean.some(([c, v]) => c > X && c <= X + 2 && isText(v) && !isScheme(v)))) {
        if (typeof num === "number") { inMain = true; group = { n: num, ex: [] }; block.groups.push(group); }
        const name = [at(r, X + 1), at(r, X + 2)].find((v) => isText(v) && !isScheme(v));
        if (name && group) {
          const d = at(r, X + 3), sets = [], loads = [], notes = [];
          let k = X + 4;
          const dIsSets = d == null || (isText(d) && /^wup$/i.test(d));
          for (; k <= Math.min(E, X + 11); k += 2) {
            const v = at(r, k), w = at(r, k + 1);
            if (v != null) { if (dIsSets && (typeof v === "number" || isScheme(v))) sets.push(String(v)); else if (isText(v)) notes.push(v); }
            if (w != null && dIsSets && sets.length) loads.push(String(w)); else if (isText(w)) notes.push(w);
          }
          for (let c = X + 12; c <= Math.min(E, X + 12); c++) { const v = at(r, c); if (isText(v)) notes.push(v); }
          let scheme = "";
          if (sets.length) {
            const same = sets.every((s) => s === sets[0]);
            scheme = (same ? `${sets.length} × ${sets[0]}` : sets.join(", "));
            if (isText(d) && /^wup$/i.test(d)) scheme = "WUP + " + scheme;
          } else if (d != null) scheme = String(d);
          group.ex.push({ name, scheme, loads, note: notes.join(" · ") });
        }
        // anything far right of the lift (side sections like speed work) goes to its section
        const side = clean.filter(([c]) => c > X + 12);
        if (side.length && heads) addSecItems(r, side);
        continue;
      }
      // section header row: only plain labels, no schemes, and not a number row
      const texts = clean.filter(([, v]) => isText(v));
      const looksHead = texts.length === clean.length && clean.every(([, v]) => !isScheme(v) || /^wup$/i.test(v)) && !inMain && !(typeof num === "number");
      if (looksHead && rowCells(r + 1).some(([, v]) => isScheme(v))) {
        heads = clean.map(([c, v]) => ({ c, label: /^wup$/i.test(v) ? "Warm-up" : v })).sort((p, q) => p.c - q.c);
        secMap = new Map(); heads.forEach((h) => { const s = { label: h.label, items: [] }; secMap.set(h.c, s); block.sections.push(s); });
        continue;
      }
      if (inMain) { const side = clean.filter(([c]) => c > X + 12); if (side.length && heads) addSecItems(r, side); continue; }
      addSecItems(r, clean);
    }
    block.sections = block.sections.filter((s) => s.items.length);
    // letter the groups: 1A, 1B ...
    block.groups.forEach((g) => g.ex.forEach((e, i) => (e.label = g.ex.length > 1 ? `${g.n}${String.fromCharCode(65 + i)}` : String(g.n))));
    return block;
  }

  function parseWorkbook(XLSX, wb, sourceName) {
    const blocks = [];
    wb.SheetNames.forEach((name, si) => {
      if (SKIP_SHEETS.test(name.trim())) return;
      const ws = wb.Sheets[name]; if (!ws) return;
      try { parseSheet(XLSX, ws, name).forEach((b, bi) => { b.order = si * 100 + bi; blocks.push(b); }); } catch (e) { console.warn("Skipped sheet", name, e); }
    });
    // weeks: dated range of each sheet, so undated blocks (optional days) can sit in that week
    const range = {};
    blocks.forEach((b) => { if (!b.date) return; const r = range[b.sheet] || (range[b.sheet] = [b.date, b.date]); if (b.date < r[0]) r[0] = b.date; if (b.date > r[1]) r[1] = b.date; });
    blocks.forEach((b) => { b.week = range[b.sheet] || null; b.id = (b.sheet + "|" + b.title + "|" + (b.date || "") + "|" + b.order).toLowerCase(); });
    return { source: sourceName || "", updated: new Date().toISOString(), sheets: wb.SheetNames.filter((n) => range[n]), blocks: blocks.filter((b) => b.week) };
  }

  root.LiftParse = { parseWorkbook };
  if (typeof module !== "undefined") module.exports = root.LiftParse;
})(typeof window !== "undefined" ? window : globalThis);
