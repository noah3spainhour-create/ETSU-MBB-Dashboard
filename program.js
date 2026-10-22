// Program Builder tab — weeks, days and exercises you can edit, with per-player individualization.
// Saved in the browser; "Download program" makes a file you can upload to data/program.json to share.
(function () {
  "use strict";
  const KEY = "etsu-program-v1";
  const CATS = ["Squat", "Hinge", "Jump", "Single-leg", "Upper", "Core", "Mobility", "Conditioning", "Other"];
  const UNITS = ["", "%", "% BW", "RPE", "lb", "kg", "sec"];
  const QK = ["elite", "power", "quick", "found"];
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

  let P = null, ctx = null, root = null, me = "", target = null, cat = "All", q = "", saveT = 0, savedAt = "", bound = false, loaded = null;
  const uid = () => Math.random().toString(36).slice(2, 9);
  const esc = (x) => String(x ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const mk = (name, catg, sets, reps, load, unit, note) => ({ id: uid(), name, cat: catg, sets, reps: String(reps), load: String(load ?? ""), unit: unit || "", note: note || "", swap: null });
  const fromLib = (l) => mk(l[0], l[1], l[2], l[3], l[4], l[5]);
  const sw = (e, p, qk, f) => ({ elite: e, power: p, quick: qk, found: f });
  const v = (name, sets, reps, load, unit) => ({ name, sets, reps: String(reps), load: String(load ?? ""), unit: unit || "" });

  // ---------- starter program (replace with your own) ----------
  function seed() {
    const d = (title, focus, items) => ({ id: uid(), title, focus, items });
    const withSwap = (it, s) => ((it.swap = s), it);
    const days = [
      d("Monday · Lower A", "Strength + power", [
        withSwap(mk("Trap bar jump", "Jump", 4, 3, "20", "%"), sw(v("Trap bar jump", 4, 3, "20", "%"), v("Jump squat (light)", 4, 4, "10–20", "% BW"), v("Trap bar jump (heavier)", 4, 3, "30", "%"), v("Kettlebell swing", 3, 10, "", ""))),
        withSwap(mk("Back squat", "Squat", 4, 3, "80", "%"), sw(v("Back squat", 4, 3, "82–87", "%"), v("Speed box squat", 6, 2, "50–60", "%"), v("Back squat", 4, 5, "78–85", "%"), v("Goblet squat", 4, 8, "7", "RPE"))),
        mk("Rear-foot elevated split squat", "Single-leg", 3, "5 each", "7", "RPE"),
        withSwap(mk("Romanian deadlift", "Hinge", 3, 6, "7", "RPE"), sw(v("Romanian deadlift", 3, 6, "7", "RPE"), v("Kettlebell swing", 4, 6, "", ""), v("Barbell hip thrust", 3, 8, "8", "RPE"), v("Kettlebell or DB deadlift", 4, 8, "7", "RPE"))),
        mk("Pallof press", "Core", 3, "10 each", "", "")]),
      d("Tuesday · Upper A", "Push / pull strength", [
        mk("DB bench press", "Upper", 4, 6, "8", "RPE"), mk("Chest-supported row", "Upper", 4, 8, "", ""), mk("Half-kneeling landmine press", "Upper", 3, "8 each", "", ""), mk("Pull-up", "Upper", 3, "max", "", ""), mk("Dead bug", "Core", 3, "8 each", "", "")]),
      d("Thursday · Lower B", "Speed + single leg", [
        withSwap(mk("Hang power clean", "Hinge", 4, 3, "", ""), sw(v("Hang power clean", 4, 3, "", ""), v("Trap bar jump", 4, 3, "20", "%"), v("Hang power clean", 4, 3, "", ""), v("Box jump (step down)", 3, 4, "", ""))),
        withSwap(mk("Front squat", "Squat", 3, 4, "75", "%"), sw(v("Front squat", 3, 4, "75–80", "%"), v("Front squat", 3, 4, "70–75", "%"), v("Front squat", 4, 4, "75–80", "%"), v("Box squat", 4, 5, "7", "RPE"))),
        mk("Single-leg RDL", "Single-leg", 3, "6 each", "7", "RPE"), mk("Nordic hamstring curl", "Hinge", 3, 4, "", ""), mk("Pogo hops", "Jump", 3, 10, "", "")]),
      d("Friday · Upper B", "Volume + durability", [
        mk("Push-up", "Upper", 3, 12, "", ""), mk("Single-arm DB row", "Upper", 3, "10 each", "", ""), mk("Face pull", "Upper", 3, 15, "", ""), mk("Copenhagen plank", "Core", 3, "20", "", "sec"), mk("Hip mobility flow", "Mobility", 1, "10 min", "", "")])
    ];
    return { v: 1, name: "Fall in-season block", wk: 0, weeks: [{ id: uid(), label: "Week 1", days }], adjust: true, weakLeg: true, overrides: {}, extras: {} };
  }

  // ---------- storage ----------
  function save(now) {
    clearTimeout(saveT);
    const go = () => { try { localStorage.setItem(KEY, JSON.stringify(P)); savedAt = "Saved in this browser · " + new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); } catch (e) { savedAt = "This browser can't save — download the program before closing."; } const s = root && root.querySelector("#pbSaved"); if (s) s.textContent = savedAt; };
    if (now) { saveT = 0; go(); } else saveT = setTimeout(() => { saveT = 0; go(); }, 400);
  }
  function valid(o) { return o && Array.isArray(o.weeks) && o.weeks.length && o.weeks.every((w) => Array.isArray(w.days)); }
  function normalize(o) { o.overrides = o.overrides || {}; o.extras = o.extras || {}; o.wk = Math.min(Math.max(0, o.wk | 0), o.weeks.length - 1); if (o.adjust == null) o.adjust = true; if (o.weakLeg == null) o.weakLeg = true; return o; }
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

  // The player's version of one exercise: team → jumper-type swap → weaker leg → readiness → his own changes.
  function effective(it, p) {
    const e = { name: it.name, sets: it.sets, reps: it.reps, load: it.load, unit: it.unit, note: it.note, cat: it.cat, tags: [] };
    if (!p) return e;
    if (it.swap && p.q && it.swap[p.q]) { const s = it.swap[p.q]; ["name", "sets", "reps", "load", "unit"].forEach((k) => (e[k] = s[k])); e.tags.push({ t: p.qName + " version", c: "q" }); }
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
    const swapOn = !!it.swap;
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
      html += `<div class="pb-r4">${catSel(it.cat, k + ".cat")}${i > 0 ? `<label class="pb-swapl" title="Run this in the same block as the exercise above (superset / circuit)"><input type="checkbox" data-a="join"${it.join ? " checked" : ""}> Group with above</label>` : ""}${src !== "x" ? `<label class="pb-swapl"><input type="checkbox" data-a="swap"${swapOn ? " checked" : ""}> By jumper type</label>` : ""}
        <span class="pb-acts"><button type="button" data-a="up" aria-label="Move up"${i === 0 || (src === "x" && false) ? " disabled" : ""}>↑</button><button type="button" data-a="down" aria-label="Move down"${i === n - 1 ? " disabled" : ""}>↓</button>
        <button type="button" data-a="dupItem" aria-label="Duplicate">⧉</button><button type="button" data-a="delItem" aria-label="Delete exercise" class="pb-del">✕</button></span></div>`;
      if (swapOn && src !== "x") html += `<div class="pb-swaps">${QK.map((qq) => { const s = it.swap[qq] || v(it.name, it.sets, it.reps, it.load, it.unit), kk = `${k}.sw.${qq}`; return `<div class="pb-sw" data-q="${qq}"><span class="pb-qn"><i style="background:${ctx.Q[qq].colorVal}"></i>${esc(ctx.Q[qq].name)}</span>
        <input data-f="name" data-k="${kk}.name" value="${esc(s.name)}" list="pbLib" aria-label="${esc(ctx.Q[qq].name)} exercise">
        <span class="pb-r2"><input class="pb-sets" data-f="sets" data-k="${kk}.sets" value="${esc(s.sets)}" aria-label="Sets"><span class="pb-x">×</span><input class="pb-reps" data-f="reps" data-k="${kk}.reps" value="${esc(s.reps)}" aria-label="Reps"><span class="pb-x">@</span><input class="pb-load" data-f="load" data-k="${kk}.load" value="${esc(s.load)}" aria-label="Load">${unitSel(s.unit, kk + ".unit")}</span></div>`; }).join("")}</div>`;
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
        <div class="pb-dt"><input class="pb-focus" data-f="focus" data-k="${day.id}.focus" value="${esc(day.focus)}" aria-label="Day focus" placeholder="Focus"${p ? " readonly" : ""}>
        ${p ? "" : `<div class="pb-acts"><button type="button" data-a="dayL" aria-label="Move day earlier"${di === 0 ? " disabled" : ""}>←</button><button type="button" data-a="dayR" aria-label="Move day later"${di === n - 1 ? " disabled" : ""}>→</button><button type="button" data-a="dupDay" aria-label="Duplicate day">⧉</button><button type="button" data-a="delDay" aria-label="Delete day" class="pb-del">✕</button></div>`}</div>
      </div>
      <ol class="pb-items">${items || `<li class="muted pb-emptyday">No exercises yet.</li>`}</ol>
      <div class="pb-df">
        <button type="button" class="btn" data-a="addBlank">＋ ${p ? "Add for " + esc(p.name.split(" ")[0]) + " only" : "Add exercise"}</button>
        <button type="button" class="pb-link" data-a="target" aria-pressed="${sel}">${sel ? "Library adds here" : "Add from library here"}</button>
      </div>
    </article>`;
  }

  function render(container, c) {
    root = container; ctx = c;
    if (!P) { if (!loaded) loaded = load().then(() => render(root, ctx)); container.innerHTML = `<p class="muted">Loading program…</p>`; return; }
    if (!bound) bind();
    const focus = document.activeElement && root.contains(document.activeElement) ? { k: document.activeElement.dataset.k, s: document.activeElement.selectionStart, e: document.activeElement.selectionEnd } : null;
    if (me && !ctx.players.some((x) => x.name === me)) me = "";
    const p = player(), w = week();
    if (!target || !findDay(target)) target = w.days[0] ? w.days[0].id : null;
    const lib = LIB.filter((l) => (cat === "All" || l[1] === cat) && (!q || l[0].toLowerCase().includes(q.toLowerCase())));
    const bandTxt = { ready: "Ready", mon: "Monitor", fat: "Fatigued", none: "No score" };
    const nOwn = p ? Object.keys(P.overrides[p.name] || {}).filter((id) => w.days.some((d) => d.items.some((i) => i.id === id))).length + w.days.reduce((a, d) => a + (((P.extras[p.name] || {})[d.id] || []).length), 0) : 0;
    root.innerHTML = `
    <div class="pb-editor">
    <div class="pagehead"><div><h2>Program builder</h2><p>Build the week, edit any set, rep or percentage, then fine-tune it for individual players. Their versions adjust from their latest jump test.</p></div>
      <div class="toolbar"><span class="muted" id="pbSaved" style="font-size:12.5px">${esc(savedAt)}</span>
        <button class="btn" type="button" data-a="download">⬇ Download program</button><label class="btn" for="pbFile" tabindex="0">⬆ Load program</label><input type="file" id="pbFile" accept=".json,application/json" hidden>
        <button class="btn" type="button" data-a="printTeam">Print week</button><button class="btn btn-gold" type="button" data-a="printCards">Print ${p ? esc(p.name.split(" ")[0]) + "'s" : "player"} cards</button></div></div>

    <div class="card pb-set">
      <label class="pb-fld pb-grow">Program name<input data-f="pname" data-k="pname" value="${esc(P.name)}"></label>
      <label class="pb-fld">Week<select data-a="week" data-k="week">${P.weeks.map((x, i) => `<option value="${i}"${i === P.wk ? " selected" : ""}>${esc(x.label)}</option>`).join("")}</select></label>
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
        <span class="muted">Gold boxes are changed for ${esc(p.name.split(" ")[0])} only. ${nOwn ? `<button type="button" class="pb-link" data-a="resetPlayer">Undo all ${nOwn} of his changes this week</button>` : ""}</span></div>`
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
    <datalist id="pbLib">${LIB.map((l) => `<option value="${esc(l[0])}">`).join("")}</datalist>
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
    const li = el.closest("[data-item]"), dayEl = el.closest("[data-day]");
    if (!li) { const d = findDay(dayEl.dataset.day); if (d) d[f] = val; return; }
    const it = findItem(li.dataset.day, li.dataset.item, li.dataset.src); if (!it) return;
    const sv = f === "sets" ? (num(val) ?? val) : val;
    const swq = el.closest("[data-q]");
    if (swq) { it.swap[swq.dataset.q][f] = sv; return; }
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
    nw.days.forEach((d) => d.items.forEach((it) => {
      prog(it);
      if (it.swap) QK.forEach((qq) => { if (it.swap[qq]) { const t = { ...it.swap[qq], cat: it.cat }; prog(t); delete t.cat; it.swap[qq] = t; } });
    }));
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
      case "swap": { const it = list[idx]; if (el.checked) { it.swap = {}; QK.forEach((qq) => (it.swap[qq] = defaultSwap(it, qq))); } else it.swap = null; break; }
      case "skip": { const o = (P.overrides[me] = P.overrides[me] || {}), oi = (o[list[idx].id] = o[list[idx].id] || {}); if (el.checked) oi.skip = true; else delete oi.skip; if (!Object.keys(oi).length) delete o[list[idx].id]; break; }
      case "resetItem": if (P.overrides[me]) delete P.overrides[me][list[idx].id]; break;
      case "resetPlayer": if (!confirm(`Undo all of ${me}'s changes this week?`)) return; w.days.forEach((d) => { d.items.forEach((i) => P.overrides[me] && delete P.overrides[me][i.id]); if (P.extras[me]) delete P.extras[me][d.id]; }); break;
      case "dayL": case "dayR": { const i = w.days.indexOf(day); moveIn(w.days, i, a === "dayL" ? -1 : 1); break; }
      case "dupDay": { const i = w.days.indexOf(day), nd = { ...clone(day), id: uid(), title: day.title + " (copy)" }; nd.items = day.items.map(copyItem); w.days.splice(i + 1, 0, nd); break; }
      case "delDay": if (!confirm(`Delete ${day.title || "this day"} and its exercises?`)) return; w.days.splice(w.days.indexOf(day), 1); break;
      case "addDay": { const nd = { id: uid(), title: "Day " + (w.days.length + 1), focus: "", items: [] }; w.days.push(nd); target = nd.id; break; }
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
  function defaultSwap(it, qq) {
    const Q = ctx.Q[qq], src = it.cat === "Squat" ? Q.squat : it.cat === "Hinge" ? Q.hinge : null;
    if (src && src[0]) return parseDose(src[0][0], src[0][1]);
    return v(it.name, it.sets, it.reps, it.load, it.unit);
  }
  function parseDose(name, dose) {
    const m = String(dose).match(/^(\d+)\s*×\s*([^@]+?)\s*(?:@\s*(.+))?$/); if (!m) return v(name, 3, dose, "", "");
    let load = "", unit = ""; const L = (m[3] || "").trim();
    let mm;
    if ((mm = L.match(/^RPE\s*([\d.–-]+)/i))) { load = mm[1]; unit = "RPE"; }
    else if ((mm = L.match(/^([\d.–-]+)\s*%\s*BW/i))) { load = mm[1]; unit = "% BW"; }
    else if ((mm = L.match(/^([\d.–-]+)\s*%/))) { load = mm[1]; unit = "%"; }
    else load = L;
    return v(name, +m[1], m[2].trim(), load, unit);
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
    f.text().then((t) => { const o = JSON.parse(t); if (!valid(o)) throw new Error("bad"); if (!confirm("Replace the program in this browser with " + f.name + "?")) return; P = normalize(o); me = ""; target = null; save(true); rerender(); ctx.toast("Loaded " + (P.name || f.name)); })
      .catch(() => ctx.toast("That file isn't a program file from this dashboard.")).finally(() => (input.value = ""));
  }

  // ---------- print ----------
  function printOut(kind) {
    const w = week(), box = root.querySelector("#pbPrint"), p = player();
    const head = (title, sub) => `<div class="pp-head"><div><div class="pp-k">${esc(P.name)} · ${esc(w.label)}</div><h2>${esc(title)}</h2>${sub ? `<div class="pp-sub">${sub}</div>` : ""}</div><div class="pp-mark">ETSU</div></div>`;
    let html = "";
    if (kind === "team") {
      html = `<div class="pp-page">${head("Team program")}${w.days.map((d) => `<h3>${esc(d.title)}${d.focus ? ` <span>· ${esc(d.focus)}</span>` : ""}</h3>
        <table><thead><tr><th>#</th><th>Exercise</th><th>Sets × reps @ load</th><th>Note</th></tr></thead><tbody>${(() => { const L = labels(d.items); return d.items.map((it, i) => `<tr class="${L[i].n > 1 && !L[i].first ? "pp-gj" : ""}${L[i].n > 1 ? " pp-g" : ""}"><td class="pp-lab">${esc(L[i].lab)}${L[i].n > 1 && L[i].first ? `<div class="pp-kind">${L[i].kind}</div>` : ""}</td><td><b>${esc(it.name)}</b>${it.swap ? `<div class="pp-sw">${QK.map((qq) => `${esc(ctx.Q[qq].name)}: ${esc(it.swap[qq].name)} ${esc(fmt(it.swap[qq]))}`).join("<br>")}</div>` : ""}</td><td>${esc(fmt(it))}</td><td>${esc(it.note)}</td></tr>`).join(""); })()}</tbody></table>`).join("")}</div>`;
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
