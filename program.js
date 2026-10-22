// Program Builder tab — weeks, days and exercises you can edit, with per-player individualization.
// Saved in the browser; "Download program" makes a file you can upload to data/program.json to share.
(function () {
  "use strict";
  const KEY = "etsu-program-v1";
  const CATS = ["Squat", "Hinge", "Jump", "Single-leg", "Upper", "Core", "Mobility", "Conditioning", "Other"];
  const UNITS = ["", "%", "% BW", "RPE", "lb", "kg", "sec"];
  const ADJ_SKIP = new Set(["Core", "Mobility", "Conditioning"]);
  const LIB = [
    ["Back squat", "Squat", 4, "3", "82–87", "%"], ["Front squat", "Squat", 3, "4", "75–80", "%"], ["Speed box squat", "Squat", 6, "2", "50–60", "%"], ["Box squat", "Squat", 4, "5", "", ""], ["Goblet squat", "Squat", 4, "8", "", ""], ["Belt squat", "Squat", 3, "6", "", ""],
    ["Trap bar deadlift", "Hinge", 4, "3", "80–85", "%"], ["Romanian deadlift", "Hinge", 3, "6", "7", "RPE"], ["Hang power clean", "Hinge", 4, "3", "", ""], ["Hang clean pull", "Hinge", 4, "3", "", ""], ["Kettlebell swing", "Hinge", 3, "8", "", ""], ["Barbell hip thrust", "Hinge", 3, "8", "", ""], ["Nordic hamstring curl", "Hinge", 3, "4", "", ""], ["Good morning", "Hinge", 3, "8", "", ""],
    ["Trap bar jump", "Jump", 4, "3", "20", "%"], ["Jump squat (light)", "Jump", 4, "4", "10–20", "% BW"], ["Box jump (step down)", "Jump", 3, "4", "", ""], ["Pogo hops", "Jump", 3, "10", "", ""], ["Single-leg landing from low box", "Jump", 3, "5 each", "", ""], ["Lateral bound and stick", "Jump", 3, "4 each", "", ""], ["Depth jump", "Jump", 3, "4", "", ""],
    ["Rear-foot elevated split squat", "Single-leg", 3, "6 each", "", ""], ["Step-up (slow lowering)", "Single-leg", 3, "6 each", "", ""], ["Single-leg RDL", "Single-leg", 3, "6 each", "", ""], ["B-stance hip thrust", "Single-leg", 3, "8 each", "", ""], ["Split squat", "Single-leg", 3, "8 each", "", ""], ["Lateral lunge", "Single-leg", 3, "6 each", "", ""],
    ["DB bench press", "Upper", 4, "6", "", ""], ["Bench press", "Upper", 4, "5", "75", "%"], ["Chest-supported row", "Upper", 4, "8", "", ""], ["Single-arm DB row", "Upper", 3, "10 each", "", ""], ["Half-kneeling landmine press", "Upper", 3, "8 each", "", ""], ["Pull-up", "Upper", 3, "max", "", ""], ["Push-up", "Upper", 3, "12", "", ""], ["Face pull", "Upper", 3, "15", "", ""],
    ["Pallof press", "Core", 3, "10 each", "", ""], ["Dead bug", "Core", 3, "8 each", "", ""], ["Copenhagen plank", "Core", 3, "20", "", "sec"], ["Suitcase carry", "Core", 3, "30 m each", "", ""], ["Side plank", "Core", 3, "30", "", "sec"],
    ["Hip mobility flow", "Mobility", 1, "10 min", "", ""], ["Ankle mobility", "Mobility", 2, "10 each", "", ""], ["Bike intervals", "Conditioning", 6, "30 s on / 30 s off", "", ""]
  ];

  let P = null, ctx = null, root = null, me = "", sub = "build", cal = "", calMode = "week", sheet = -1, target = null, cat = "All", q = "", saveT = 0, savedAt = "", bound = false, loaded = null;
  const uid = () => Math.random().toString(36).slice(2, 9);
  const esc = (x) => String(x ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const mk = (name, catg, sets, reps, load, unit, note) => ({ id: uid(), name, cat: catg, sets, reps: String(reps), load: String(load ?? ""), unit: unit || "", note: note || "" });
  const fromLib = (l) => mk(l[0], l[1], l[2], l[3], l[4], l[5]);
  const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const DOWL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const parseYmd = (x) => { const m = String(x || "").match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const mondayOf = (d) => ymd(addDays(d, -((d.getDay() + 6) % 7)));
  const guessDow = (title, i) => { const t = String(title || "").toLowerCase(), j = DOWL.findIndex((n) => t.startsWith(n.toLowerCase()) || t.startsWith(n.slice(0, 3).toLowerCase() + " ") || t.startsWith(n.slice(0, 3).toLowerCase() + "·")); return j >= 0 ? j : [0, 1, 3, 4, 2, 5, 6][i % 7]; };

  // ---------- starter program (replace with your own) ----------
  function seed() {
    const d = (title, focus, dow, items) => ({ id: uid(), title, focus, dow, items });
    const days = [
      d("Monday · Lower A", "Strength + power", 0, [
        mk("Trap bar jump", "Jump", 4, 3, "20", "%"), mk("Back squat", "Squat", 4, 3, "80", "%"),
        mk("Rear-foot elevated split squat", "Single-leg", 3, "5 each", "7", "RPE"), mk("Romanian deadlift", "Hinge", 3, 6, "7", "RPE"),
        mk("Pallof press", "Core", 3, "10 each", "", "")]),
      d("Tuesday · Upper A", "Push / pull strength", 1, [
        mk("DB bench press", "Upper", 4, 6, "8", "RPE"), mk("Chest-supported row", "Upper", 4, 8, "", ""), mk("Half-kneeling landmine press", "Upper", 3, "8 each", "", ""), mk("Pull-up", "Upper", 3, "max", "", ""), mk("Dead bug", "Core", 3, "8 each", "", "")]),
      d("Thursday · Lower B", "Speed + single leg", 3, [
        mk("Hang power clean", "Hinge", 4, 3, "", ""), mk("Front squat", "Squat", 3, 4, "75", "%"),
        mk("Single-leg RDL", "Single-leg", 3, "6 each", "7", "RPE"), mk("Nordic hamstring curl", "Hinge", 3, 4, "", ""), mk("Pogo hops", "Jump", 3, 10, "", "")]),
      d("Friday · Upper B", "Volume + durability", 4, [
        mk("Push-up", "Upper", 3, 12, "", ""), mk("Single-arm DB row", "Upper", 3, "10 each", "", ""), mk("Face pull", "Upper", 3, 15, "", ""), mk("Copenhagen plank", "Core", 3, "20", "", "sec"), mk("Hip mobility flow", "Mobility", 1, "10 min", "", "")])
    ];
    return { v: 2, name: "Fall in-season block", wk: 0, start: mondayOf(new Date()), weeks: [{ id: uid(), label: "Week 1", days }], adjust: true, weakLeg: true, overrides: {}, extras: {} };
  }

  // ---------- storage ----------
  function save(now) {
    clearTimeout(saveT);
    const go = () => { try { localStorage.setItem(KEY, JSON.stringify(P)); savedAt = "Saved in this browser · " + new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); } catch (e) { savedAt = "This browser can't save — download the program before closing."; } const s = root && root.querySelector("#pbSaved"); if (s) s.textContent = savedAt; };
    if (now) { saveT = 0; go(); } else saveT = setTimeout(() => { saveT = 0; go(); }, 400);
  }
  function valid(o) { return o && Array.isArray(o.weeks) && o.weeks.length && o.weeks.every((w) => Array.isArray(w.days)); }
  function normalize(o) {
    // One program for everyone: jumper-type variations are gone; player changes live in overrides.
    o.weeks.forEach((w) => w.days.forEach((d, i) => { if (d.dow == null || d.dow === "") d.dow = guessDow(d.title, i); d.dow = Math.min(6, Math.max(0, +d.dow || 0)); (d.items || []).forEach((it) => delete it.swap); }));
    if (!parseYmd(o.start)) o.start = mondayOf(new Date());
    o.overrides = o.overrides || {}; o.extras = o.extras || {}; o.wk = Math.min(Math.max(0, o.wk | 0), o.weeks.length - 1); if (o.adjust == null) o.adjust = true; if (o.weakLeg == null) o.weakLeg = true; return o; }
  async function load() {
    try { const s = JSON.parse(localStorage.getItem(KEY) || "null"); if (valid(s)) { P = normalize(s); savedAt = "Saved in this browser"; return; } } catch (e) { /* ignore */ }
    try { const r = await fetch("data/program.json", { cache: "no-store" }); if (r.ok) { const s = await r.json(); if (valid(s)) { P = normalize(s); savedAt = "Loaded the shared program (data/program.json)"; return; } } } catch (e) { /* none */ }
    P = seed(); savedAt = "Starter program — edit it and it saves in this browser";
  }

  // ---------- lookups ----------
  const week = () => P.weeks[P.wk];
  const player = () => (me && ctx.players.find((p) => p.name === me)) || null;
  function findDay(id) { return week().days.find((d) => d.id === id); }
  function findItem(dayId, id, src) {
    if (src === "x") return ((P.extras[me] || {})[dayId] || []).find((i) => i.id === id);
    const d = findDay(dayId); return d && d.items.find((i) => i.id === id);
  }
  const num = (x) => { const n = parseFloat(x); return isFinite(n) ? n : null; };
  const shift = (load, delta) => String(load).replace(/\d+(\.\d+)?/g, (m) => String(Math.max(0, Math.round((parseFloat(m) + delta) * 2) / 2)));
  const capNum = (load, cap) => String(load).replace(/\d+(\.\d+)?/g, (m) => String(Math.min(parseFloat(m), cap)));

  // The player's version of one exercise: team → weaker leg → readiness → his own changes.
  function effective(it, p) {
    const e = { name: it.name, sets: it.sets, reps: it.reps, load: it.load, unit: it.unit, note: it.note, cat: it.cat, tags: [] };
    if (!p) return e;
    if (P.weakLeg && it.cat === "Single-leg" && p.weak) { e.sets = (num(e.sets) || 0) + 1; e.note = ("Start on the " + p.weak + " leg; extra set on the " + p.weak + ". " + (e.note || "")).trim(); e.tags.push({ t: "+1 set " + p.weak + " leg", c: "w" }); }
    if (P.adjust && !ADJ_SKIP.has(e.cat)) {
      if (p.band === "fat") {
        e.sets = Math.max(1, (num(e.sets) || 1) - 1);
        if (e.unit === "%" && e.load) e.load = shift(e.load, -10); else if (e.unit === "RPE" && e.load) e.load = capNum(e.load, 7);
        e.tags.push({ t: "Fatigued: −1 set" + (e.unit === "%" && e.load ? ", −10%" : e.unit === "RPE" ? ", RPE ≤7" : ""), c: "fat" });
      } else if (p.band === "mon" && (e.unit === "%" || e.unit === "RPE")) {
        if (e.unit === "RPE" && e.load) e.load = capNum(e.load, 8);
        e.tags.push({ t: "Monitor: top sets ≤ RPE 8", c: "mon" });
      }
    }
    const o = (P.overrides[p.name] || {})[it.id];
    if (o) { ["name", "sets", "reps", "load", "unit", "note"].forEach((k) => { if (o[k] != null) e[k] = o[k]; }); e.skip = !!o.skip; e.own = o; }
    return e;
  }
  // Block labels: an exercise with join=true runs in the same block as the one above it (superset / circuit).
  // Solo blocks are "1", "2"; grouped blocks are "2A", "2B", "2C". Block shape lives on positions, so reordering keeps it.
  function labels(items) {
    const blk = []; let b = 0;
    items.forEach((it, i) => { if (i === 0 || !it.join) b++; blk.push(b); });
    const size = {}; blk.forEach((x) => (size[x] = (size[x] || 0) + 1));
    let prev = 0, pos = 0;
    return blk.map((x, i) => {
      pos = x === prev ? pos + 1 : 0; prev = x;
      const n = size[x], last = i === blk.length - 1 || blk[i + 1] !== x;
      return { lab: n > 1 ? x + String.fromCharCode(65 + (pos % 26)) : String(x), n, first: pos === 0, last, kind: n > 2 ? "Circuit" : n === 2 ? "Superset" : "" };
    });
  }
  const dayLabels = (day, p) => labels(day.items.concat(p ? ((P.extras[p.name] || {})[day.id] || []) : []));
  const fmt = (e) => `${e.sets ?? ""} × ${e.reps ?? ""}` + (e.load || e.unit ? ` @ ${e.unit === "RPE" ? "RPE " + e.load : e.load + (e.unit === "%" ? "%" : e.unit ? " " + e.unit : "")}` : "");

  // ---------- render ----------
  function unitSel(val, k, extra) { return `<select data-f="unit" data-k="${k}" aria-label="Load unit" ${extra || ""}>${UNITS.map((u) => `<option value="${esc(u)}"${u === (val || "") ? " selected" : ""}>${u ? esc(u) : "—"}</option>`).join("")}</select>`; }
  function catSel(val, k) { return `<select data-f="cat" data-k="${k}" aria-label="Pattern" class="pb-cat">${CATS.map((c) => `<option${c === val ? " selected" : ""}>${c}</option>`).join("")}</select>`; }

  function itemHTML(day, it, i, n, src, p, L) {
    const k = `${day.id}.${it.id}`, pm = !!p && src !== "x";
    const e = pm ? effective(it, p) : it, own = pm && e.own ? e.own : {};
    const oc = (f) => (pm && own[f] != null ? " pb-own" : "");
    const tags = pm ? e.tags.map((t) => `<span class="pb-tag t-${t.c}">${esc(t.t)}</span>`).join("") : "";
    L = L || { lab: String(i + 1), n: 1, first: true, last: true, kind: "" };
    const gcls = L.n > 1 ? " pb-g" + (L.first ? "" : " pb-gj") + (L.last ? "" : " pb-gm") : "";
    let html = `<li class="pb-item${gcls}${pm && e.skip ? " pb-skip" : ""}${src === "x" ? " pb-extra" : ""}" data-day="${day.id}" data-item="${it.id}" data-src="${src}">
      ${L.n > 1 && L.first ? `<div class="pb-gcap">${L.kind} · ${L.n} exercises</div>` : ""}
      <div class="pb-r1"><span class="pb-n">${esc(L.lab)}</span>
        <input class="pb-name${oc("name")}" data-f="name" data-k="${k}.name" value="${esc(e.name)}" list="pbLib" aria-label="Exercise name" placeholder="Exercise">
        ${pm ? `<label class="pb-skipl"><input type="checkbox" data-a="skip"${e.skip ? " checked" : ""}> Skip</label>` : ""}</div>
      <div class="pb-r2">
        <input class="pb-sets${oc("sets")}" data-f="sets" data-k="${k}.sets" value="${esc(e.sets)}" inputmode="numeric" aria-label="Sets"><span class="pb-x">×</span>
        <input class="pb-reps${oc("reps")}" data-f="reps" data-k="${k}.reps" value="${esc(e.reps)}" aria-label="Reps"><span class="pb-x">@</span>
        <input class="pb-load${oc("load")}" data-f="load" data-k="${k}.load" value="${esc(e.load)}" aria-label="Load or intensity" placeholder="load">
        ${unitSel(e.unit, k + ".unit", oc("unit") ? 'class="pb-own"' : "")}
      </div>
      <input class="pb-note${oc("note")}" data-f="note" data-k="${k}.note" value="${esc(e.note)}" aria-label="Coaching note" placeholder="Note or cue">`;
    if (pm) html += (tags || Object.keys(own).length ? `<div class="pb-tags">${tags}${Object.keys(own).length ? `<button type="button" class="pb-link" data-a="resetItem">Undo his changes</button>` : ""}</div>` : "");
    else {
      html += `<div class="pb-r4">${catSel(it.cat, k + ".cat")}${i > 0 ? `<label class="pb-swapl" title="Run this in the same block as the exercise above (superset / circuit)"><input type="checkbox" data-a="join"${it.join ? " checked" : ""}> Group with above</label>` : ""}
        <span class="pb-acts"><button type="button" data-a="up" aria-label="Move up"${i === 0 || (src === "x" && false) ? " disabled" : ""}>↑</button><button type="button" data-a="down" aria-label="Move down"${i === n - 1 ? " disabled" : ""}>↓</button>
        <button type="button" data-a="dupItem" aria-label="Duplicate">⧉</button><button type="button" data-a="delItem" aria-label="Delete exercise" class="pb-del">✕</button></span></div>`;
    }
    return html + "</li>";
  }

  function dayHTML(day, di, n, p) {
    const sel = target === day.id, extras = p ? ((P.extras[p.name] || {})[day.id] || []) : [];
    const L = dayLabels(day, p), nt = day.items.length;
    const items = day.items.map((it, i) => itemHTML(day, it, i, nt, "t", p, L[i])).join("") + extras.map((it, i) => itemHTML(day, it, nt + i, nt + extras.length, "x", p, L[nt + i])).join("");
    return `<article class="pb-day${sel ? " pb-target" : ""}" data-day="${day.id}">
      <div class="pb-dh">
        <input class="pb-title" data-f="title" data-k="${day.id}.title" value="${esc(day.title)}" aria-label="Day name"${p ? " readonly" : ""}>
        <div class="pb-dt">${p ? `<span class="pb-dowt">${DOW[day.dow]}</span>` : `<select class="pb-dow" data-f="dow" data-k="${day.id}.dow" aria-label="Day of the week">${DOW.map((n, i) => `<option value="${i}"${i === day.dow ? " selected" : ""}>${n}</option>`).join("")}</select>`}<input class="pb-focus" data-f="focus" data-k="${day.id}.focus" value="${esc(day.focus)}" aria-label="Day focus" placeholder="Focus"${p ? " readonly" : ""}>
        ${p ? "" : `<div class="pb-acts"><button type="button" data-a="dayL" aria-label="Move day earlier"${di === 0 ? " disabled" : ""}>←</button><button type="button" data-a="dayR" aria-label="Move day later"${di === n - 1 ? " disabled" : ""}>→</button><button type="button" data-a="dupDay" aria-label="Duplicate day">⧉</button><button type="button" data-a="delDay" aria-label="Delete day" class="pb-del">✕</button></div>`}</div>
      </div>
      <ol class="pb-items">${items || `<li class="muted pb-emptyday">No exercises yet.</li>`}</ol>
      <div class="pb-df">
        <button type="button" class="btn" data-a="addBlank">＋ ${p ? "Add for " + esc(p.name.split(" ")[0]) + " only" : "Add exercise"}</button>
        <button type="button" class="pb-link" data-a="target" aria-pressed="${sel}">${sel ? "Library adds here" : "Add from library here"}</button>
      </div>
    </article>`;
  }

  // ---------- shared helpers for calendar + weeks views ----------
  const weekStart = (wi) => addDays(parseYmd(P.start), 7 * wi);
  const dateOf = (wi, dow) => addDays(weekStart(wi), dow);
  const sd = (d, o) => d.toLocaleDateString([], o || { month: "short", day: "numeric" });
  const loadTxt = (e) => (e.load || e.unit ? (e.unit === "RPE" ? "RPE " + e.load : e.load + (e.unit === "%" ? "%" : e.unit ? " " + e.unit : "")) : "");
  const shortTitle = (t) => { const x = String(t || "").split("·"); return (x.length > 1 ? x.slice(1).join("·") : x[0]).trim() || "Lift"; };
  const byDow = (days) => days.map((d, i) => ({ d, i })).sort((a, b) => a.d.dow - b.d.dow || a.i - b.i).map((x) => x.d);
  function rowsFor(day, p) {
    const L = dayLabels(day, p), nt = day.items.length;
    const rows = day.items.map((it, i) => ({ e: p ? effective(it, p) : it, L: L[i] }));
    if (p) ((P.extras[p.name] || {})[day.id] || []).forEach((it, i) => rows.push({ e: it, L: L[nt + i], x: true }));
    return rows.filter((r) => !r.e.skip);
  }
  function sessionsOn(date) {
    const wi = Math.floor((date - parseYmd(P.start)) / 864e5 / 7), dow = (date.getDay() + 6) % 7;
    if (wi < 0 || wi >= P.weeks.length) return [];
    return P.weeks[wi].days.filter((d) => d.dow === dow).map((d) => ({ wi, d }));
  }
  const weekOfDate = (date) => Math.floor((date - parseYmd(P.start)) / 864e5 / 7);
  function whoPicker(p) {
    return `<label class="pb-fld">Showing<select data-a="player" aria-label="Whose program"><option value="">Team program</option>${ctx.players.map((x) => `<option${x.name === me ? " selected" : ""}>${esc(x.name)}</option>`).join("")}</select></label>
      ${p ? `<span class="muted pc-note">${esc(p.name)}'s version — his own changes and readiness adjustments included.</span>` : ""}`;
  }

  // ---------- Calendar view ----------
  function calendarHTML(p) {
    const today = new Date(), t0 = ymd(today);
    if (!parseYmd(cal)) { const wi = weekOfDate(today); cal = wi >= 0 && wi < P.weeks.length ? t0 : P.start; }
    const at = parseYmd(cal);
    const nav = (title) => `<div class="pc-nav"><div class="pb-row"><button class="btn" type="button" data-a="calPrev" aria-label="Previous">‹</button><button class="btn" type="button" data-a="calToday">Today</button><button class="btn" type="button" data-a="calNext" aria-label="Next">›</button><h3 class="pc-title">${title}</h3></div>
      <div class="seg" role="group" aria-label="Calendar view"><button type="button" data-a="calMode" data-v="week" aria-pressed="${calMode === "week"}">Week</button><button type="button" data-a="calMode" data-v="month" aria-pressed="${calMode === "month"}">Month</button></div></div>`;
    const sess = (x) => `<div class="pc-sess"><button type="button" class="pc-sh" data-a="openDay" data-wk="${x.wi}" data-v="${x.d.id}" title="Open ${esc(x.d.title)} in the builder"><b>${esc(shortTitle(x.d.title))}</b>${x.d.focus ? `<span>${esc(x.d.focus)}</span>` : ""}</button>
      <ol>${rowsFor(x.d, p).map((r) => `<li class="${r.L.n > 1 ? "pc-g" + (r.L.first ? " pc-gf" : "") : ""}${r.x ? " pc-x" : ""}"><span class="pc-l">${esc(r.L.lab)}</span><span class="pc-ex">${esc(r.e.name || "—")}</span><span class="pc-d">${esc(fmt(r.e))}</span></li>`).join("") || `<li class="muted">No exercises</li>`}</ol></div>`;
    if (calMode === "week") {
      const mon = parseYmd(mondayOf(at)), wi = weekOfDate(mon), wl = wi >= 0 && wi < P.weeks.length ? P.weeks[wi].label : "Outside the program";
      const cols = DOW.map((n, i) => { const d = addDays(mon, i), list = sessionsOn(d);
        return `<div class="pc-col${ymd(d) === t0 ? " pc-today" : ""}${list.length ? "" : " pc-rest"}"><div class="pc-ch"><span>${n}</span><b>${d.getDate()}</b></div>${list.map(sess).join("") || `<div class="pc-off">Off</div>`}</div>`; }).join("");
      return nav(`${sd(mon)} – ${sd(addDays(mon, 6), { month: mon.getMonth() === addDays(mon, 6).getMonth() ? undefined : "short", day: "numeric" })}, ${addDays(mon, 6).getFullYear()} <span class="muted">· ${esc(wl)}</span>`) + `<div class="pc-week">${cols}</div>`;
    }
    const first = new Date(at.getFullYear(), at.getMonth(), 1), g0 = parseYmd(mondayOf(first));
    let cells = "";
    for (let r = 0; r < 6; r++) {
      const rowMon = addDays(g0, 7 * r); if (r > 3 && rowMon.getMonth() !== at.getMonth()) break;
      const wi = weekOfDate(rowMon);
      cells += `<div class="pc-wk">${wi >= 0 && wi < P.weeks.length ? esc(P.weeks[wi].label.replace(/^Week\s*/i, "Wk ")) : ""}</div>`;
      for (let c = 0; c < 7; c++) {
        const d = addDays(rowMon, c), list = sessionsOn(d);
        cells += `<div class="pc-cell${d.getMonth() !== at.getMonth() ? " pc-out" : ""}${ymd(d) === t0 ? " pc-today" : ""}"><button type="button" class="pc-dn" data-a="calGo" data-v="${ymd(d)}" aria-label="Open week of ${sd(d)}">${d.getDate()}</button>${list.map((x) => `<button type="button" class="pc-chip" data-a="calGo" data-v="${ymd(d)}" title="${esc(x.d.title)}">${esc(shortTitle(x.d.title))}</button>`).join("")}</div>`;
      }
    }
    return nav(sd(at, { month: "long", year: "numeric" })) + `<div class="pc-month"><div></div>${DOW.map((n) => `<div class="pc-mh">${n}</div>`).join("")}${cells}</div>`;
  }

  // ---------- Weeks (sheet) view ----------
  function weeksHTML(p) {
    if (sheet !== "all" && !(sheet >= 0 && sheet < P.weeks.length)) sheet = P.wk;
    const tabs = `<div class="pw-tabs" role="tablist" aria-label="Weeks">${P.weeks.map((w, i) => `<button type="button" role="tab" data-a="sheet" data-v="${i}" aria-selected="${sheet === i}">${esc(w.label)}<small>${sd(weekStart(i))}</small></button>`).join("")}<button type="button" role="tab" class="pw-all" data-a="sheet" data-v="all" aria-selected="${sheet === "all"}">All weeks<small>side by side</small></button></div>`;
    if (sheet !== "all") {
      const w = P.weeks[sheet];
      const days = byDow(w.days).map((d) => `<section class="pw-day"><h3>${esc(d.title)} <span>· ${sd(dateOf(sheet, d.dow), { weekday: "short", month: "short", day: "numeric" })}${d.focus ? " · " + esc(d.focus) : ""}</span></h3>
        <div class="pw-scroll"><table class="pw-t"><thead><tr><th>#</th><th>Exercise</th><th>Sets</th><th>Reps</th><th>Load</th><th>Note</th></tr></thead><tbody>${rowsFor(d, p).map((r) => `<tr class="${r.L.n > 1 ? "pw-g" + (r.L.first ? "" : " pw-gj") : ""}${r.x ? " pw-x" : ""}"><td class="pw-l">${esc(r.L.lab)}</td><td><b>${esc(r.e.name)}</b>${r.L.n > 1 && r.L.first ? ` <span class="pw-kind">${r.L.kind}</span>` : ""}</td><td>${esc(r.e.sets)}</td><td>${esc(r.e.reps)}</td><td>${esc(loadTxt(r.e))}</td><td class="pw-note">${esc(r.e.note)}</td></tr>`).join("") || `<tr><td colspan="6" class="muted">No exercises</td></tr>`}</tbody></table></div></section>`).join("");
      return tabs + `<div class="pw-sheet"><div class="pw-bar"><b>${esc(w.label)}</b><span class="muted">${sd(weekStart(sheet))} – ${sd(addDays(weekStart(sheet), 6))} · ${w.days.length} lift${w.days.length === 1 ? "" : "s"}</span><button class="btn" type="button" data-a="openWeek" data-v="${sheet}">Edit in builder</button></div>${days || `<p class="muted">No lifts this week.</p>`}</div>`;
    }
    const nSlots = Math.max(...P.weeks.map((w) => w.days.length));
    let out = "";
    for (let j = 0; j < nSlots; j++) {
      const ref = (P.weeks.find((w) => w.days[j]) || {}).days[j];
      const R = P.weeks.map((w) => (w.days[j] ? rowsFor(w.days[j], p) : []));
      const nRows = Math.max(0, ...R.map((x) => x.length)), base = R.find((x) => x.length) || [];
      let body = "";
      for (let r = 0; r < nRows; r++) {
        const h = R.map((x) => x[r]).find(Boolean);
        body += `<tr class="${h && h.L.n > 1 ? "pw-g" + (h.L.first ? "" : " pw-gj") : ""}"><td class="pw-l">${esc(h ? h.L.lab : "")}</td><th class="pw-rh">${esc(h ? h.e.name : "")}</th>${R.map((x) => { const c = x[r]; if (!c) return `<td class="muted">—</td>`; return `<td>${c.e.name !== h.e.name ? `<b class="pw-chg">${esc(c.e.name)}</b>` : ""}${esc(fmt(c.e))}</td>`; }).join("")}</tr>`;
      }
      out += `<section class="pw-day"><h3>${esc(ref.title)}${ref.focus ? ` <span>· ${esc(ref.focus)}</span>` : ""}</h3><div class="pw-scroll"><table class="pw-t pw-grid"><thead><tr><th>#</th><th>Exercise</th>${P.weeks.map((w, i) => `<th>${esc(w.label)}<div class="pw-sub">${w.days[j] ? sd(dateOf(i, w.days[j].dow), { weekday: "short", month: "short", day: "numeric" }) : "—"}</div></th>`).join("")}</tr></thead><tbody>${body || `<tr><td colspan="${2 + P.weeks.length}" class="muted">No exercises</td></tr>`}</tbody></table></div></section>`;
    }
    return tabs + `<div class="pw-sheet"><div class="pw-bar"><b>All weeks</b><span class="muted">Same day and slot across every week — a gold name means the exercise changed that week.</span></div>${out}</div>`;
  }

  function render(container, c) {
    root = container; ctx = c;
    if (!P) { if (!loaded) loaded = load().then(() => render(root, ctx)); container.innerHTML = `<p class="muted">Loading program…</p>`; return; }
    if (!bound) bind();
    const focus = document.activeElement && root.contains(document.activeElement) ? { k: document.activeElement.dataset.k, s: document.activeElement.selectionStart, e: document.activeElement.selectionEnd } : null;
    if (me && !ctx.players.some((x) => x.name === me)) me = "";
    const p = player(), w = week();
    if (!target || !findDay(target)) target = w.days[0] ? w.days[0].id : null;
    const subs = [["build", "Builder"], ["cal", "Calendar"], ["weeks", "Weeks"]];
    const blurb = { build: "Build one program for the whole team — edit any set, rep or percentage. Switch to one player to change anything just for him.", cal: "Your lift schedule by week or month. Click a lift to open it in the builder.", weeks: "Flip between weeks like sheets in a workbook, or see every week side by side." }[sub];
    let body = "";
    if (sub === "build") {
      const lib = LIB.filter((l) => (cat === "All" || l[1] === cat) && (!q || l[0].toLowerCase().includes(q.toLowerCase())));
      const bandTxt = { ready: "Ready", mon: "Monitor", fat: "Fatigued", none: "No score" };
      const nOwn = p ? Object.keys(P.overrides[p.name] || {}).filter((id) => w.days.some((d) => d.items.some((i) => i.id === id))).length + w.days.reduce((a, d) => a + (((P.extras[p.name] || {})[d.id] || []).length), 0) : 0;
      body = `
    <div class="card pb-set">
      <label class="pb-fld pb-grow">Program name<input data-f="pname" data-k="pname" value="${esc(P.name)}"></label>
      <label class="pb-fld">Week 1 starts<input type="date" data-f="start" data-k="start" value="${esc(P.start)}"></label>
      <label class="pb-fld">Week<select data-a="week" data-k="week">${P.weeks.map((x, i) => `<option value="${i}"${i === P.wk ? " selected" : ""}>${esc(x.label)} · ${sd(weekStart(i))}</option>`).join("")}</select></label>
      <label class="pb-fld">Week name<input data-f="wlabel" data-k="wlabel" value="${esc(w.label)}"></label>
      <div class="pb-fld"><span>New week from this one</span><div class="pb-row"><select id="pbProg" aria-label="Progression"><option value="same">Same loads</option><option value="2.5">Add 2.5% to % loads</option><option value="5">Add 5% to % loads</option><option value="deload">Deload: −10% and −1 set</option></select><button class="btn" type="button" data-a="addWeek">＋ Add week</button>${P.weeks.length > 1 ? `<button class="btn" type="button" data-a="delWeek">Delete week</button>` : ""}</div></div>
      <div class="pb-checks">
        <label><input type="checkbox" data-a="adjust"${P.adjust ? " checked" : ""}> Adjust players' loads for readiness</label>
        <label><input type="checkbox" data-a="weakLeg"${P.weakLeg ? " checked" : ""}> Extra single-leg set on a weaker leg</label>
      </div>
    </div>

    <div class="card pb-who">
      <div class="pb-fld"><span>Editing</span><div class="pb-row">
        <div class="seg" role="group" aria-label="Editing"><button type="button" data-a="team" aria-pressed="${!p}">Team program</button><button type="button" data-a="pickPlayer" aria-pressed="${!!p}">One player</button></div>
        <select data-a="player" aria-label="Player"${p ? "" : ' class="pb-dim"'}><option value="">Choose a player…</option>${ctx.players.map((x) => `<option${x.name === me ? " selected" : ""}>${esc(x.name)}</option>`).join("")}</select>
      </div></div>
      ${p ? `<div class="pb-pinfo"><span class="qpill"><i style="background:${p.qColor}"></i>${esc(p.qName || "No test yet")}</span>
        <span class="pill ${{ ready: "p-ready", mon: "p-mon", fat: "p-fat", none: "p-none" }[p.band]}">Readiness ${p.score == null ? "—" : p.score + "/10"} · ${bandTxt[p.band]}</span>
        ${p.weak ? `<span class="pill p-fat">Weaker ${p.weak} leg</span>` : ""}
        <span class="muted">Gold boxes are changed for ${esc(p.name.split(" ")[0])} only — rename an exercise to swap it for him. ${nOwn ? `<button type="button" class="pb-link" data-a="resetPlayer">Undo all ${nOwn} of his changes this week</button>` : ""}</span></div>`
        : `<p class="muted" style="margin:0">Changes here apply to the whole team. Pick a player to see his version and change anything just for him.</p>`}
    </div>

    <div class="pb-main">
      <aside class="card pb-lib" aria-label="Exercise library">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline"><h3>Exercise library</h3><span class="muted" style="font-size:12px">Adds to ${esc((findDay(target) || {}).title || "—")}</span></div>
        <input type="search" class="pb-search" data-a="q" data-k="q" value="${esc(q)}" placeholder="Search exercises" aria-label="Search exercises">
        <div class="pb-chips" role="group" aria-label="Filter">${["All", ...CATS.slice(0, 8)].map((cc) => `<button type="button" data-a="cat" data-v="${cc}" aria-pressed="${cat === cc}">${cc}</button>`).join("")}</div>
        <div class="pb-liblist">${lib.map((l) => `<div class="pb-li"><div><b>${esc(l[0])}</b><div class="muted">${esc(l[1])} · ${esc(fmt({ sets: l[2], reps: l[3], load: l[4], unit: l[5] }))}</div></div><button type="button" data-a="addLib" data-v="${esc(l[0])}" aria-label="Add ${esc(l[0])}">＋</button></div>`).join("") || `<p class="muted">No matches. Use “Add exercise” on a day to type your own.</p>`}</div>
      </aside>
      <section class="pb-days" aria-label="Training week">
        ${w.days.map((d, i) => dayHTML(d, i, w.days.length, p)).join("")}
        ${p ? "" : `<button type="button" class="pb-addday" data-a="addDay">＋ Add day</button>`}
      </section>
    </div>
    <datalist id="pbLib">${LIB.map((l) => `<option value="${esc(l[0])}">`).join("")}</datalist>`;
    } else body = `<div class="card pb-who">${whoPicker(p)}</div><div class="card pc-wrap">${sub === "cal" ? calendarHTML(p) : weeksHTML(p)}</div>`;
    root.innerHTML = `
    <div class="pb-editor">
    <div class="pagehead"><div><h2>Program builder</h2><p>${blurb}</p></div>
      <div class="toolbar"><span class="muted" id="pbSaved" style="font-size:12.5px">${esc(savedAt)}</span>
        <button class="btn" type="button" data-a="download">⬇ Download program</button><label class="btn" for="pbFile" tabindex="0">⬆ Load program</label><input type="file" id="pbFile" accept=".json,application/json" hidden>
        ${sub === "build" ? `<button class="btn" type="button" data-a="printTeam">Print week</button><button class="btn btn-gold" type="button" data-a="printCards">Print ${p ? esc(p.name.split(" ")[0]) + "'s" : "player"} cards</button>` : ""}</div></div>
    <div class="pb-subs" role="tablist" aria-label="Program builder sections">${subs.map(([k, n]) => `<button type="button" role="tab" data-a="sub" data-v="${k}" aria-selected="${sub === k}">${n}</button>`).join("")}</div>
    ${body}
    </div>
    <div id="pbPrint" class="pb-print"></div>`;
    if (focus && focus.k) { const f = root.querySelector(`[data-k="${CSS.escape(focus.k)}"]`); if (f) { f.focus(); try { if (focus.s != null) f.setSelectionRange(focus.s, focus.e); } catch (e) { /* select */ } } }
  }
  const rerender = () => render(root, ctx);

  // ---------- editing ----------
  function setField(el, val) {
    const f = el.dataset.f;
    if (f === "pname") { P.name = val; return; }
    if (f === "wlabel") { week().label = val; return; }
    if (f === "start") { const d = parseYmd(val); if (d) P.start = mondayOf(d); return; }
    const li = el.closest("[data-item]"), dayEl = el.closest("[data-day]");
    if (!li) { const d = findDay(dayEl.dataset.day); if (d) d[f] = f === "dow" ? +val : val; return; }
    const it = findItem(li.dataset.day, li.dataset.item, li.dataset.src); if (!it) return;
    const sv = f === "sets" ? (num(val) ?? val) : val;
    const p = player();
    if (p && li.dataset.src !== "x") {
      const o = (P.overrides[p.name] = P.overrides[p.name] || {}), oi = (o[it.id] = o[it.id] || {});
      delete oi[f]; const auto = effective(it, p)[f];
      if (String(auto ?? "") !== String(sv)) oi[f] = sv;
      if (!Object.keys(oi).length) delete o[it.id];
      return;
    }
    it[f] = sv;
  }
  function moveIn(arr, i, d) { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; }
  function copyItem(it) { const c = clone(it); c.id = uid(); return c; }
  function addWeek(mode) {
    const src = week(), map = {}, dmap = {};
    const nw = { id: uid(), label: "Week " + (P.weeks.length + 1), days: src.days.map((d) => { const nd = { ...clone(d), id: uid() }; dmap[d.id] = nd.id; nd.items = d.items.map((it) => { const c = copyItem(it); map[it.id] = c.id; return c; }); return nd; }) };
    const prog = (o) => {
      if (mode === "same" || !o) return;
      if (o.unit === "%" && o.load) o.load = shift(o.load, mode === "deload" ? -10 : parseFloat(mode));
      if (mode === "deload" && !ADJ_SKIP.has(o.cat || "") && num(o.sets) > 1) o.sets = num(o.sets) - 1;
    };
    nw.days.forEach((d) => d.items.forEach(prog));
    Object.keys(P.overrides).forEach((pl) => Object.entries(P.overrides[pl]).forEach(([id, o]) => { if (map[id]) P.overrides[pl][map[id]] = clone(o); }));
    Object.keys(P.extras).forEach((pl) => Object.entries(P.extras[pl]).forEach(([did, list]) => { if (dmap[did]) P.extras[pl][dmap[did]] = list.map(copyItem); }));
    P.weeks.splice(P.wk + 1, 0, nw); P.wk += 1;
  }

  function action(a, el, ev) {
    const w = week(), li = el.closest("[data-item]"), dayEl = el.closest(".pb-day"), day = dayEl && findDay(dayEl.dataset.day), p = player();
    const list = li && (li.dataset.src === "x" ? (P.extras[me] || {})[li.dataset.day] : day.items);
    const idx = li && list ? list.findIndex((x) => x.id === li.dataset.item) : -1;
    switch (a) {
      case "up": case "down": {
        // Exercises swap slots; the block structure (1, 2A, 2B…) stays where it is.
        const j = idx + (a === "up" ? -1 : 1); if (j < 0 || j >= list.length) break;
        const ja = !!list[idx].join, jb = !!list[j].join; moveIn(list, idx, j - idx); list[idx].join = ja; list[j].join = jb; break;
      }
      case "dupItem": { const c = copyItem(list[idx]), inGrp = !!list[idx].join || !!(list[idx + 1] && list[idx + 1].join); c.join = inGrp; list.splice(idx + 1, 0, c); break; }
      case "delItem": if (p && li.dataset.src !== "x") return; if (!list[idx].join && list[idx + 1]) list[idx + 1].join = false; list.splice(idx, 1); break;
      case "join": list[idx].join = el.checked; break;
      case "skip": { const o = (P.overrides[me] = P.overrides[me] || {}), oi = (o[list[idx].id] = o[list[idx].id] || {}); if (el.checked) oi.skip = true; else delete oi.skip; if (!Object.keys(oi).length) delete o[list[idx].id]; break; }
      case "resetItem": if (P.overrides[me]) delete P.overrides[me][list[idx].id]; break;
      case "resetPlayer": if (!confirm(`Undo all of ${me}'s changes this week?`)) return; w.days.forEach((d) => { d.items.forEach((i) => P.overrides[me] && delete P.overrides[me][i.id]); if (P.extras[me]) delete P.extras[me][d.id]; }); break;
      case "dayL": case "dayR": { const i = w.days.indexOf(day); moveIn(w.days, i, a === "dayL" ? -1 : 1); break; }
      case "dupDay": { const i = w.days.indexOf(day), nd = { ...clone(day), id: uid(), title: day.title + " (copy)" }; nd.items = day.items.map(copyItem); w.days.splice(i + 1, 0, nd); break; }
      case "delDay": if (!confirm(`Delete ${day.title || "this day"} and its exercises?`)) return; w.days.splice(w.days.indexOf(day), 1); break;
      case "addDay": { const used = new Set(w.days.map((d) => d.dow)), dw = [0, 1, 3, 4, 2, 5, 6].find((x) => !used.has(x)) ?? 0; const nd = { id: uid(), title: DOWL[dw], focus: "", dow: dw, items: [] }; w.days.push(nd); target = nd.id; break; }
      case "addBlank": addTo(day.id, mk("", "Other", 3, "8", "", "")); target = day.id; break;
      case "target": target = day.id; break;
      case "addLib": { const l = LIB.find((x) => x[0] === el.dataset.v); if (!target) return; addTo(target, fromLib(l)); break; }
      case "cat": cat = el.dataset.v; break;
      case "team": me = ""; break;
      case "pickPlayer": if (!me && ctx.players[0]) me = ctx.players[0].name; break;
      case "adjust": P.adjust = el.checked; break;
      case "weakLeg": P.weakLeg = el.checked; break;
      case "addWeek": addWeek(root.querySelector("#pbProg").value); break;
      case "delWeek": if (!confirm(`Delete ${w.label}?`)) return; P.weeks.splice(P.wk, 1); P.wk = Math.max(0, P.wk - 1); break;
      case "sub": sub = el.dataset.v; window.scrollTo(0, 0); return rerender();
      case "calMode": calMode = el.dataset.v; return rerender();
      case "calToday": cal = ymd(new Date()); return rerender();
      case "calPrev": case "calNext": { const d = parseYmd(cal), k = a === "calPrev" ? -1 : 1; cal = ymd(calMode === "week" ? addDays(d, 7 * k) : new Date(d.getFullYear(), d.getMonth() + k, 1)); return rerender(); }
      case "calGo": cal = el.dataset.v; calMode = "week"; return rerender();
      case "openDay": P.wk = +el.dataset.wk; target = el.dataset.v; sub = "build"; save(true); rerender(); setTimeout(() => { const t = root.querySelector(`.pb-day[data-day="${CSS.escape(target)}"]`); if (t) t.scrollIntoView({ block: "start", behavior: "smooth" }); }, 0); return;
      case "openWeek": P.wk = +el.dataset.v; sub = "build"; save(true); window.scrollTo(0, 0); return rerender();
      case "sheet": sheet = el.dataset.v === "all" ? "all" : +el.dataset.v; return rerender();
      case "download": return download();
      case "printTeam": return printOut("team");
      case "printCards": return printOut("cards");
      default: return;
    }
    save(true); rerender();
  }
  function addTo(dayId, it) {
    if (me && player()) { const x = (P.extras[me] = P.extras[me] || {}); (x[dayId] = x[dayId] || []).push(it); }
    else findDay(dayId).items.push(it);
    setTimeout(() => { const f = root.querySelector(`[data-k="${CSS.escape(dayId + "." + it.id + ".name")}"]`); if (f && !it.name) f.focus(); else if (f) f.closest(".pb-item").scrollIntoView({ block: "nearest", behavior: "smooth" }); }, 0);
  }

  function bind() {
    bound = true;
    const flush = () => { if (saveT) save(true); };
    window.addEventListener("pagehide", flush); document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && flush());
    root.addEventListener("input", (ev) => {
      const el = ev.target;
      if (el.dataset.a === "q") { q = el.value; const k = el.selectionStart; rerender(); const f = root.querySelector(".pb-search"); f.focus(); f.setSelectionRange(k, k); return; }
      if (el.dataset.f && !el.readOnly) { setField(el, el.value); save(); }
    });
    root.addEventListener("change", (ev) => {
      const el = ev.target;
      if (el.id === "pbFile") return importFile(el);
      if (el.dataset.a === "week") { P.wk = +el.value; save(); return rerender(); }
      if (el.dataset.a === "player") { me = el.value; return rerender(); }
      if (el.type === "checkbox" && el.dataset.a) return action(el.dataset.a, el, ev);
      if (el.dataset.f && !el.readOnly) { setField(el, el.value); save(true); rerender(); }
    });
    root.addEventListener("click", (ev) => {
      const el = ev.target.closest("[data-a]"); if (!el || !root.contains(el) || el.type === "checkbox" || el.tagName === "SELECT" || el.tagName === "INPUT") return;
      action(el.dataset.a, el, ev);
    });
    root.addEventListener("keydown", (ev) => { if (ev.key === "Enter" && ev.target.tagName === "INPUT" && ev.target.type !== "checkbox") ev.target.blur(); });
  }

  // ---------- files ----------
  function download() {
    save(true);
    const blob = new Blob([JSON.stringify(P, null, 1)], { type: "application/json" }), a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "program.json"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    ctx.toast("Downloaded program.json. Upload it to the data folder on GitHub so every coach sees it.");
  }
  function importFile(input) {
    const f = input.files && input.files[0]; if (!f) return;
    f.text().then((t) => { const o = JSON.parse(t); if (!valid(o)) throw new Error("bad"); if (!confirm("Replace the program in this browser with " + f.name + "?")) return; P = normalize(o); me = ""; target = null; cal = ""; sheet = -1; save(true); rerender(); ctx.toast("Loaded " + (P.name || f.name)); })
      .catch(() => ctx.toast("That file isn't a program file from this dashboard.")).finally(() => (input.value = ""));
  }

  // ---------- print ----------
  function printOut(kind) {
    const w = week(), box = root.querySelector("#pbPrint"), p = player();
    const head = (title, sub) => `<div class="pp-head"><div><div class="pp-k">${esc(P.name)} · ${esc(w.label)}</div><h2>${esc(title)}</h2>${sub ? `<div class="pp-sub">${sub}</div>` : ""}</div><div class="pp-mark">ETSU</div></div>`;
    let html = "";
    if (kind === "team") {
      html = `<div class="pp-page">${head("Team program")}${w.days.map((d) => `<h3>${esc(d.title)}${d.focus ? ` <span>· ${esc(d.focus)}</span>` : ""}</h3>
        <table><thead><tr><th>#</th><th>Exercise</th><th>Sets × reps @ load</th><th>Note</th></tr></thead><tbody>${(() => { const L = labels(d.items); return d.items.map((it, i) => `<tr class="${L[i].n > 1 && !L[i].first ? "pp-gj" : ""}${L[i].n > 1 ? " pp-g" : ""}"><td class="pp-lab">${esc(L[i].lab)}${L[i].n > 1 && L[i].first ? `<div class="pp-kind">${L[i].kind}</div>` : ""}</td><td><b>${esc(it.name)}</b></td><td>${esc(fmt(it))}</td><td>${esc(it.note)}</td></tr>`).join(""); })()}</tbody></table>`).join("")}</div>`;
    } else {
      const who = p ? [p] : ctx.players;
      if (!who.length) return ctx.toast("No players yet — add a force plate test first.");
      html = who.map((pl) => {
        const bandTxt = { ready: "Ready", mon: "Monitor", fat: "Fatigued", none: "No score yet" }[pl.band];
        return `<div class="pp-page">${head(pl.name, `${esc(pl.qName || "")} · Readiness ${pl.score == null ? "—" : pl.score + "/10"} (${bandTxt})${pl.weak ? ` · Weaker ${pl.weak} leg` : ""}`)}${w.days.map((d) => {
          const L = dayLabels(d, pl), nt = d.items.length;
          const rows = d.items.map((it, i) => ({ e: effective(it, pl), L: L[i] })).filter((r) => !r.e.skip).concat(((P.extras[pl.name] || {})[d.id] || []).map((it, i) => ({ e: { ...it, tags: [{ t: "Just for you", c: "x" }] }, L: L[nt + i] })));
          return `<h3>${esc(d.title)}${d.focus ? ` <span>· ${esc(d.focus)}</span>` : ""}</h3><table><thead><tr><th>#</th><th>Exercise</th><th>Sets × reps @ load</th><th class="pp-w">Load used</th></tr></thead><tbody>${rows.map((r) => `<tr class="${r.L.n > 1 && !r.L.first ? "pp-gj" : ""}${r.L.n > 1 ? " pp-g" : ""}"><td class="pp-lab">${esc(r.L.lab)}${r.L.n > 1 && r.L.first ? `<div class="pp-kind">${r.L.kind}</div>` : ""}</td><td><b>${esc(r.e.name)}</b>${r.e.note ? `<div class="pp-sw">${esc(r.e.note)}</div>` : ""}</td><td>${esc(fmt(r.e))}</td><td class="pp-w"></td></tr>`).join("")}</tbody></table>`;
        }).join("")}</div>`;
      }).join("");
    }
    box.innerHTML = html;
    const v = document.getElementById("v-program"); v.classList.add("print", "pb-printing"); window.print();
    setTimeout(() => { v.classList.remove("print", "pb-printing"); box.innerHTML = ""; }, 600);
  }

  window.ProgramBuilder = { render };
})();
