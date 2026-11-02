/* Misbah Digital Computer — Web Dashboard (vanilla JS PWA)
   Backend: Cloudflare Worker /api/* (header x-key). Key sirf is browser ke localStorage mein. */
(function () {
  "use strict";
  const CFG = window.MDC_CONFIG;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const LS = { get: (k, d) => { try { const v = localStorage.getItem("mdc_" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set: (k, v) => localStorage.setItem("mdc_" + k, JSON.stringify(v)), del: (k) => localStorage.removeItem("mdc_" + k) };
  let prefs = Object.assign({ theme: "light", lang: "hi" }, LS.get("prefs2", {}));
  let KEY = LS.get("key", "");
  let DEMO = LS.get("demo", false);
  const cache = {};
  const ago = (iso) => { if (!iso) return ""; const s = (Date.now() - new Date(iso)) / 1000; if (s < 60) return "abhi"; if (s < 3600) return Math.floor(s / 60) + " min pehle"; if (s < 86400) return Math.floor(s / 3600) + " ghante pehle"; return Math.floor(s / 86400) + " din pehle"; };
  const fmtD = (iso) => (iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "");
  const L = {
    hi: { home: "Home", chat: "Chat (Brain)", agents: "Agents", automations: "Automations", apps: "Apps / Connect", leads: "Leads / CRM", sites: "Clients & Sites", reels: "Reel Studio", edit: "Video Edit", files: "Files", reminders: "Notes & Reminders", logs: "Logs / Runs", analytics: "Analytics", settings: "Settings", help: "Help / Docs", meetings: "Meetings", invoices: "Invoice / Quote", s_main: "Main", s_build: "Banao", s_biz: "Business", s_sys: "System", search: "Search ya command…", more: "More" },
    en: { home: "Home", chat: "Chat (Brain)", agents: "Agents", automations: "Automations", apps: "Apps / Integrations", leads: "Leads / CRM", sites: "Clients & Sites", reels: "Reel Studio", edit: "Video Edit", files: "Files", reminders: "Notes & Reminders", logs: "Logs / Runs", analytics: "Analytics", settings: "Settings", help: "Help / Docs", meetings: "Meetings", invoices: "Invoice / Quote", s_main: "Main", s_build: "Create", s_biz: "Business", s_sys: "System", search: "Search or command…", more: "More" },
  };
  const t = (k) => (L[prefs.lang] || L.hi)[k] || L.hi[k] || k;
  const NAV = [
    ["s_main", [["home", "home"], ["chat", "chat"], ["agents", "bot"], ["automations", "zap"], ["apps", "plug"]]],
    ["s_build", [["sites", "layout"], ["reels", "film"], ["edit", "scissors"]]],
    ["s_biz", [["leads", "target"], ["meetings", "calendar"], ["invoices", "receipt"], ["analytics", "chart"], ["files", "folder"], ["reminders", "note"]]],
    ["s_sys", [["logs", "clock"], ["settings", "settings"], ["help", "help"]]],
  ].map(([s, it]) => [s, it.map(([k, n]) => [k, window.ic(n)])]);
  const STAGES = [["new", "🆕 New"], ["contacted", "📞 Contacted"], ["interested", "🔥 Interested"], ["client", "🤝 Client"]];

  // ---------- API ----------
  class ApiError extends Error { constructor(s, m) { super(m); this.status = s; } }
  async function api(path, body, opts = {}) {
    if (DEMO && !opts.key) return window.MDC_DEMO(path, body);
    const res = await fetch(CFG.WORKER_URL + path, { method: body ? "POST" : "GET", headers: Object.assign({ "x-key": opts.key || KEY }, body ? { "content-type": "application/json" } : {}), body: body ? JSON.stringify(body) : undefined });
    const j = await res.json().catch(() => ({}));
    if (res.status === 401 && !opts.key) { toast("Key galat/expire — dobara login karo"); logout(); }
    if (!res.ok) throw new ApiError(res.status, j.error || "HTTP " + res.status);
    return j;
  }
  async function cached(path, ttl = 30000) { const c = cache[path]; if (c && Date.now() - c.at < ttl) return c.data; const data = await api(path); cache[path] = { at: Date.now(), data }; return data; }
  const bust = (...p) => p.forEach((x) => delete cache[x]);
  async function sitesList() {
    if (DEMO) return window.MDC_DEMO("/api/sites");
    try { const r = await fetch(CFG.SITES_JSON + "?t=" + Math.floor(Date.now() / 20000)); if (r.ok) return await r.json(); } catch (e) {}
    try { return await api("/api/sites"); } catch (e) { return []; }
  }

  // ---------- UI helpers ----------
  function toast(m) { const el = $("#toast"); if (!el) return; el.textContent = m; el.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("show"), 2600); }
  function sheet(html, onMount) { const w = $("#sheetWrap"); $("#sheet").innerHTML = html; w.hidden = false; $$("[data-close]", w).forEach((b) => (b.onclick = closeSheet)); if (onMount) onMount($("#sheet")); }
  function closeSheet() { $("#sheetWrap").hidden = true; }
  function qrSvg(text) { try { const q = qrcode(0, "M"); q.addData(text); q.make(); return q.createSvgTag({ cellSize: 5, margin: 2, scalable: true }); } catch (e) { return ""; } }
  async function copy(s) { try { await navigator.clipboard.writeText(s); toast("Copy ho gaya ✓"); } catch (e) { prompt("Copy karo:", s); } }
  function shareSheet(title, url) { sheet(`<h3>${esc(title)}</h3><div class="qrbox">${qrSvg(url)}</div><div class="field"><input readonly value="${esc(url)}"></div><div class="grid g2"><button class="btn" id="cp">📋 Copy link</button><a class="btn" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(title + " " + url)}">💬 WhatsApp</a></div>${navigator.share ? '<button class="btn pri block" style="margin-top:10px" id="nshare">📤 Share…</button>' : ""}<button class="btn block" style="margin-top:10px" data-close>Band karo</button>`, (s) => { $("#cp", s).onclick = () => copy(url); if ($("#nshare", s)) $("#nshare", s).onclick = () => navigator.share({ title, url }).catch(() => {}); }); }
  const loading = () => `<div class="empty"><div class="typing"><span></span><span></span><span></span></div></div>`;
  const errBox = (e) => `<div class="empty"><div class="e">😕</div>${esc(e.message || e)}</div>`;
  const pill = (st) => { const m = { success: "ok", completed: "ok", ok: "ok", failure: "bad", error: "bad", cancelled: "warn", in_progress: "acc", queued: "warn", active: "ok", disabled_manually: "warn", new: "acc", client: "ok", interested: "warn", lost: "bad" }; return `<span class="pill ${m[st] || ""}">${esc(st || "")}</span>`; };
  const runIcon = (x) => (x.conclusion === "success" ? "✅" : x.conclusion === "failure" ? "❌" : "⏳");
  function applyTheme() { document.documentElement.dataset.theme = prefs.theme; const m = $('meta[name="theme-color"]'); if (m) m.content = prefs.theme === "dark" ? "#1A1C16" : "#F1EEE7"; }

  // ---------- shell ----------
  function shell() {
    const I = window.ic;
    document.body.innerHTML = `
    ${DEMO ? `<div class="demo-bar">${I("eye")}<span class="dtx">Demo mode — sample data</span><a class="btn sm" href="#/login" id="exitDemo">Asli login karo</a></div>` : ""}
    <div class="shell">
      <aside class="sidebar" id="sidebar">
        <div class="brand"><div class="mark">M</div><div><b>Misbah Digital</b><small>Computer · v${CFG.VERSION}</small></div></div>
        <nav class="nav" id="nav"><span class="nav-ind" id="navInd"></span>${NAV.map(([sec, items]) => `<div class="nav-sec">${t(sec)}</div>` + items.map(([k, i]) => `<a href="#/${k}" data-k="${k}"><span class="i">${i}</span>${t(k)}${k === "leads" ? '<span class="badge" id="leadBadge" hidden></span>' : ""}</a>`).join("")).join("")}</nav>
        <div class="sb-foot"><b>1 Brain, many Agents</b>GitHub + Cloudflare + Gemini — sab free.<div class="tiny" style="margin-top:8px"><a href="#/settings">App install karo</a></div></div>
      </aside>
      <div class="drawer-bg" id="drawerBg"></div>
      <div class="main">
        <header class="topbar" id="topbar">
          <button class="icon-btn hamb" id="hamb" aria-label="Menu">${I("menu")}</button>
          <span class="m-brand">Misbah Digital</span><span class="top-sp sp1"></span><label class="search" id="searchBox">${I("search")}<input id="gsearch" placeholder="${t("search")}" aria-label="Search" readonly><kbd>Ctrl K</kbd></label>
          <span class="top-sp hide-m"></span>
          <button class="icon-btn" id="themeBtn" aria-label="Dark / light">${I(prefs.theme === "dark" ? "sun" : "moon")}</button>
          <button class="icon-btn" id="bell" aria-label="Notifications">${I("bell")}<span class="dot" id="bellDot" hidden></span></button>
          <a class="avatar" href="#/settings" id="topAvatar" aria-label="Profile">M</a>
        </header>
        <main class="content" id="view" tabindex="-1"></main>
      </div>
      <aside class="rpanel" id="rpanel"></aside>
    </div>
    <nav class="bottom-nav">${[["home", "home"], ["chat", "chat"], ["leads", "target"], ["meetings", "calendar"], ["more", "menu"]].map(([k, i]) => `<a href="${k === "more" ? "#" : "#/" + k}" data-k="${k}" ${k === "more" ? 'id="moreBtn"' : ""}><span class="i">${I(i)}</span>${k === "more" ? t("more") : t(k).split(" ")[0]}</a>`).join("")}</nav>
    <div id="sheetWrap" class="sheet-wrap" hidden><div class="sheet-bg" data-close></div><section class="sheet" id="sheet" role="dialog" aria-modal="true"></section></div>
    <div id="cmdk" class="cmdk-wrap" hidden><div class="sheet-bg" id="cmdkBg"></div><div class="cmdk" role="dialog" aria-modal="true" aria-label="Command palette"><div class="cmdk-in">${I("search")}<input id="cmdkIn" placeholder="Page, action ya Brain se sawaal…" autocomplete="off"><kbd class="tiny">Esc</kbd></div><div class="cmdk-list" id="cmdkList"></div><div class="cmdk-foot"><span>Enter = kholo</span><span>Up / Down = chuno</span><span class="hide-m">Ctrl K = kabhi bhi</span></div></div></div>
    <div id="toast" role="status" aria-live="polite"></div>`;
    const sb = $("#sidebar"), bg = $("#drawerBg");
    const open = () => { sb.classList.add("open"); bg.classList.add("open"); };
    const close = () => { sb.classList.remove("open"); bg.classList.remove("open"); };
    $("#hamb").onclick = open; $("#moreBtn").onclick = (e) => { e.preventDefault(); open(); };
    bg.onclick = close; $("#nav").onclick = close;
    $("#themeBtn").onclick = toggleTheme;
    $("#bell").onclick = notifSheet;
    if ($("#exitDemo")) $("#exitDemo").onclick = (e) => { e.preventDefault(); DEMO = false; LS.del("demo"); location.hash = "#/login"; boot(); };
    $("#searchBox").onclick = (e) => { e.preventDefault(); openCmdk(); };
    $("#cmdkBg").onclick = closeCmdk;
    window.onscroll = () => { const tb = $("#topbar"); if (tb) tb.classList.toggle("scrolled", window.scrollY > 8); };
    if (!shell.keys) { shell.keys = true; document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); if ($("#cmdk")) ($("#cmdk").hidden ? openCmdk() : closeCmdk()); }
      else if (e.key === "/" && $("#cmdk") && $("#cmdk").hidden && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); openCmdk(); }
      else if (e.key === "Escape") { if ($("#cmdk") && !$("#cmdk").hidden) closeCmdk(); else if ($("#sheetWrap") && !$("#sheetWrap").hidden) closeSheet(); }
    }); }
    rightPanel();
  }
  function toggleTheme() { prefs.theme = prefs.theme === "dark" ? "light" : "dark"; LS.set("prefs2", prefs); applyTheme(); const b = $("#themeBtn"); if (b) b.innerHTML = window.ic(prefs.theme === "dark" ? "sun" : "moon"); toast(prefs.theme === "dark" ? "Dark mode on" : "Light mode on"); }
  // ---------- Command palette (Ctrl+K) ----------
  function cmdItems() {
    const I = window.ic; const items = [];
    NAV.forEach(([sec, it]) => it.forEach(([k, i]) => items.push({ sec: "Pages", icon: i, label: t(k), hint: t(sec), run: () => (location.hash = "#/" + k) })));
    [["plus", "Naya client app banao", "Sites", "#/sites"], ["film", "Reel banao", "Reel Studio", "#/reels"], ["receipt", "Nayi invoice / quotation", "Invoice", "#/invoices/new"], ["calendar", "Meeting / follow-up add karo", "Meetings", "#/meetings/new"], ["target", "Lead add karo", "Leads", "#/leads"], ["zap", "Automation banao", "Automations", "#/automations"], ["note", "Note likho", "Notes", "#/reminders"]]
      .forEach(([ic, l, h, href]) => items.push({ sec: "Actions", icon: I(ic), label: l, hint: h, run: () => (location.hash = href) }));
    items.push({ sec: "Actions", icon: I("moon"), label: "Dark / light mode badlo", hint: "Theme", run: toggleTheme });
    items.push({ sec: "Actions", icon: I("share"), label: "Dashboard share karo", hint: "Link + QR", run: () => shareSheet("Misbah Digital Computer", location.href.split("#")[0]) });
    items.push({ sec: "Actions", icon: I("logout"), label: "Logout", hint: "Account", run: logout });
    return items;
  }
  let cmdSel = 0;
  function openCmdk() {
    const w = $("#cmdk"); if (!w) return; w.hidden = false; const inp = $("#cmdkIn"); inp.value = ""; cmdSel = 0; drawCmdk(""); setTimeout(() => inp.focus(), 30);
    inp.oninput = () => { cmdSel = 0; drawCmdk(inp.value); };
    inp.onkeydown = (e) => {
      const its = $$(".cmdk-it", w);
      if (e.key === "ArrowDown") { e.preventDefault(); cmdSel = Math.min(its.length - 1, cmdSel + 1); markCmdk(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); cmdSel = Math.max(0, cmdSel - 1); markCmdk(); }
      else if (e.key === "Enter") { e.preventDefault(); if (its[cmdSel]) its[cmdSel].click(); }
    };
  }
  function closeCmdk() { const w = $("#cmdk"); if (w) w.hidden = true; }
  function markCmdk() { $$(".cmdk-it").forEach((el, i) => el.classList.toggle("act", i === cmdSel)); const el = $$(".cmdk-it")[cmdSel]; if (el) el.scrollIntoView({ block: "nearest" }); }
  function drawCmdk(q) {
    q = q.trim().toLowerCase();
    const all = cmdItems(); const hit = q ? all.filter((x) => (x.label + " " + x.hint).toLowerCase().includes(q)) : all;
    if (q) hit.push({ sec: "Brain", icon: window.ic("brain"), label: "Brain se pucho: \u201c" + q + "\u201d", hint: "Chat", run: () => { LS.set("chatDraft", q); location.hash = "#/chat"; } });
    let html = "", sec = "";
    hit.forEach((x, i) => { if (x.sec !== sec) { sec = x.sec; html += `<div class="cmdk-sec">${esc(sec)}</div>`; } html += `<div class="cmdk-it" data-i="${i}">${x.icon}<span>${esc(x.label)}</span><small>${esc(x.hint)}</small></div>`; });
    const L2 = $("#cmdkList"); L2.innerHTML = html || '<div class="empty">Kuch nahi mila</div>';
    $$(".cmdk-it", L2).forEach((el) => { el.onclick = () => { closeCmdk(); hit[+el.dataset.i].run(); }; el.onmousemove = () => { cmdSel = $$(".cmdk-it").indexOf(el); markCmdk(); }; });
    markCmdk();
  }
  function doSearch(q) {
    q = q.trim().toLowerCase(); if (!q) return;
    const hit = NAV.flatMap(([, it]) => it.map(([k]) => k)).find((k) => t(k).toLowerCase().includes(q) || k.includes(q));
    if (hit) { location.hash = "#/" + hit; return; }
    LS.set("chatDraft", q); location.hash = "#/chat";
  }
  async function notifSheet() {
    let runs = []; try { runs = (await cached("/api/runs", 20000)).slice(0, 6); } catch (e) {}
    sheet(`<h3>Notifications</h3><div class="list">${runs.map((r) => `<div class="row"><div class="em">${runIcon(r)}</div><div class="t"><b>${esc(r.name)}</b><span>${esc(r.title || "")} · ${ago(r.at)}</span></div>${pill(r.conclusion || r.status)}</div>`).join("") || '<div class="empty">Sab shant hai 😌</div>'}</div><button class="btn block" style="margin-top:12px" data-close>OK</button>`);
  }
  async function rightPanel() {
    const rp = $("#rpanel"); if (!rp) return;
    let p = LS.get("profile", null), st = null, sites = [];
    try { p = await cached("/api/profile", 300000); LS.set("profile", p); } catch (e) {}
    p = p || { name: "Misbah", title: "Founder · Misbah Digital", handle: "@misbah_creator", city: "Govindpur, Dhanbad", avatar: "M", plan: "Free" };
    $("#topAvatar").textContent = (p.avatar || p.name[0] || "M").slice(0, 2);
    try { st = await cached("/api/state", 30000); } catch (e) {}
    try { sites = await sitesList(); } catch (e) {}
    const lb = $("#leadBadge"); if (lb && st && st.leadsByStatus && st.leadsByStatus.new) { lb.hidden = false; lb.textContent = st.leadsByStatus.new; }
    try { const r = await cached("/api/runs", 20000); if (r.some((x) => x.conclusion === "failure" && Date.now() - new Date(x.at) < 864e5)) $("#bellDot").hidden = false; } catch (e) {}
    const I = window.ic; const nm = nextMeetings(1)[0];
    rp.innerHTML = `
      <div class="glass profile-card"><div class="avatar">${esc((p.avatar || "M").slice(0, 2))}</div><b>${esc(p.name)}</b><div class="muted small" style="margin-top:4px">${esc(p.title || "")}</div><div class="tiny">${esc(p.handle || "")} · ${esc(p.city || "")}</div><span class="plan">${I("star")} ${esc(p.plan || "Free")} plan · ₹0 / month</span></div>
      <div class="mini-stats"><div><b class="cnt">${sites.length}</b><span>Client sites</span></div><div><b class="cnt">${st ? st.leads || 0 : "–"}</b><span>Leads</span></div><div><b class="cnt">${st ? (st.log || []).length : "–"}</b><span>Recent tasks</span></div><div><b class="cnt">${st ? st.automationsOn || 0 : "–"}</b><span>Automations on</span></div></div>
      ${nm ? `<div class="rp-meet"><span class="eyebrow">Next meeting</span><b>${esc(nm.title)}</b><span>${esc(fmtMeet(nm.at))}${nm.place ? " · " + esc(nm.place) : ""}</span><div style="margin-top:14px"><a class="btn sm" style="background:#F6F3EC;color:#1E1E1C;border-color:#F6F3EC" href="#/meetings">Sab meetings ${I("arrow-right")}</a></div></div>` : ""}
      <div class="rp-title">Quick links</div>
      <div class="ql"><a href="#/sites">${I("layout")}Naya client app<span class="go">${I("arrow-right")}</span></a><a href="#/invoices/new">${I("receipt")}Quotation banao<span class="go">${I("arrow-right")}</span></a><a href="#/reels">${I("film")}Reel banao<span class="go">${I("arrow-right")}</span></a><a href="#/leads">${I("target")}Lead form share<span class="go">${I("arrow-right")}</span></a>
        <a href="https://github.com/${CFG.REPO}" target="_blank" rel="noopener">${I("github")}GitHub repo<span class="go">${I("arrow-up-right")}</span></a><a href="${CFG.SITES_BASE}" target="_blank" rel="noopener">${I("globe")}Portfolio page<span class="go">${I("arrow-up-right")}</span></a></div>
      <div class="rp-title">System</div>
      <div class="glass" style="padding:6px 18px;font-size:13px">
        <div class="kv"><span>Worker</span>${st ? '<span class="pill ok">online</span>' : '<span class="pill warn">checking</span>'}</div>
        <div class="kv"><span>Brain</span><span class="tiny">${esc(st ? (st.models || [])[0] || "" : "Gemini")}</span></div>
        <div class="kv"><span>Agents</span><span>${st ? st.agents.length : "–"}</span></div></div>`;
  }
  // ---------- Meetings store (this browser) ----------
  const SEED_MEET = [{ id: 1, title: "Kanak Cafe — owner se meeting", client: "Kanak Cafe & Restaurant", at: "2026-11-04T16:30:00+05:30", place: "GT Road, Govindpur", phone: "+917488236001", kind: "meeting", note: "App demo dikhana, price ₹1,500 (launch offer ₹999)", done: false },
    { id: 2, title: "Kanak Cafe — follow-up message", client: "Kanak Cafe & Restaurant", at: "2026-11-05T11:00:00+05:30", place: "WhatsApp", phone: "+917488236001", kind: "followup", note: "Thank-you + decision poochna", done: false }];
  const getMeet = () => LS.get("meetings", null) || SEED_MEET;
  const setMeet = (m) => LS.set("meetings", m);
  const fmtMeet = (iso) => new Date(iso).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  function nextMeetings(n) { const now = Date.now() - 3 * 3600e3; return getMeet().filter((m) => !m.done && new Date(m.at) >= now).sort((x, y) => new Date(x.at) - new Date(y.at)).slice(0, n); }
  // count-up for numbers
  function countUp(root) {
    $$(".val, .cnt", root || document).forEach((el) => {
      if (el.dataset.cu) return; const raw = el.textContent.trim(); const m = raw.match(/^(₹?)([\d,]+)$/); if (!m) return; el.dataset.cu = 1;
      const end = +m[2].replace(/,/g, ""); if (!end) return; const t0 = performance.now(), D = 1100;
      const step = (t) => { const k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3); el.textContent = m[1] + Math.round(end * e).toLocaleString("en-IN"); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }
  new MutationObserver(() => countUp()).observe(document.documentElement, { childList: true, subtree: true });
  function lineChart(vals, labels) {
    const W = 560, H = 170, pad = 22, mx = Math.max(1, ...vals);
    const pts = vals.map((v, i) => [pad + (i * (W - pad * 2)) / Math.max(1, vals.length - 1), H - 26 - (v / mx) * (H - 56)]);
    let d = `M${pts[0][0]},${pts[0][1]}`; for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], cx = (x0 + x1) / 2; d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`; }
    const area = d + ` L${pts[pts.length - 1][0]},${H - 26} L${pts[0][0]},${H - 26} Z`;
    return `<svg class="linechart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Activity chart"><defs><linearGradient id="lcg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--acc)" stop-opacity=".22"/><stop offset="1" stop-color="var(--acc)" stop-opacity="0"/></linearGradient></defs>
      ${[0, 1, 2].map((g) => `<line class="gl" x1="${pad}" x2="${W - pad}" y1="${30 + g * ((H - 56) / 2)}" y2="${30 + g * ((H - 56) / 2)}"/>`).join("")}
      <path class="ar" d="${area}"/><path class="ln" d="${d}" style="--len:1400"/>${pts.map((p, i) => `<circle class="pt" cx="${p[0]}" cy="${p[1]}" r="3.5" style="animation-delay:${1 + i * 0.08}s"/>`).join("")}
      ${labels.map((l, i) => `<text x="${pts[i][0]}" y="${H - 6}" text-anchor="middle">${esc(l)}</text>`).join("")}</svg>`;
  }

  // ---------- pages ----------
  const P = {};
  P.home = async (v) => {
    const I = window.ic; const p = LS.get("profile", { name: "Misbah" }) || { name: "Misbah" };
    const hr = new Date().getHours(); const gm = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
    const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
    const meets = nextMeetings(3);
    v.innerHTML = `<section class="hero"><svg class="hero-art" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="96"/><circle cx="100" cy="100" r="72"/><circle cx="100" cy="100" r="48"/><circle cx="100" cy="100" r="24"/></svg>
        <span class="eyebrow">${esc(today)}</span><h2>${gm}, ${esc(p.name)}. <em>Aaj kya banaye?</em></h2><p>Client apps, reels, leads aur automations — sab ek shaant jagah se. Telegram se bhi, yahan se bhi.</p>
        <div class="chips"><a class="btn pri" href="#/sites">Naya client app <span class="arw">${I("arrow-right")}</span></a><a class="btn" href="#/invoices/new">${I("receipt")} Quotation</a><a class="btn" href="#/reels">${I("film")} Reel banao</a></div></section>
      <div class="grid g4" id="stats">${loading()}</div>
      <div class="grid g2 g21" style="margin-top:20px">
        <div class="glass card"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px"><h3>Activity<small>Tasks · last 7 din</small></h3><a class="btn sm" href="#/analytics">Analytics ${I("arrow-right")}</a></div><div id="hchart">${loading()}</div></div>
        <div class="glass card"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px"><h3>Meetings & follow-ups<small>Clients · upcoming</small></h3><a class="btn sm" href="#/meetings/new" aria-label="Meeting add">${I("plus")}</a></div>
          <div class="list">${meets.map(meetRow).join("") || `<div class="empty"><div class="e">${I("calendar")}</div>Koi meeting nahi — add karo</div>`}</div></div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin:40px 0 18px"><div><span class="eyebrow">Shortcuts</span><h3 style="margin:6px 0 0;font:500 26px/1.2 var(--serif)">Quick actions</h3></div></div>
      <div class="qa">${[["sites", "layout", "Client app"], ["reels", "film", "Reel"], ["invoices/new", "receipt", "Invoice"], ["leads", "target", "Lead add"], ["automations", "zap", "Automation"], ["chat", "brain", "Brain chat"]].map(([k, e, n]) => `<a href="#/${k}"><span class="e">${I(e)}</span>${n}</a>`).join("")}</div>
      <div class="grid g2" style="margin-top:28px"><div class="glass card"><h3>Recent tasks<small>Telegram + dashboard</small></h3><div class="list" id="recent">${loading()}</div></div>
      <div class="glass card"><h3>Workflow runs<small>GitHub Actions</small></h3><div class="list" id="hruns">${loading()}</div></div></div>`;
    bindMeetRows(v);
    try {
      const [st, sites] = await Promise.all([cached("/api/state"), sitesList()]);
      let reels = []; try { reels = await cached("/api/reels", 60000); } catch (e) {}
      const log = st.log || [];
      const today = log.filter((x) => new Date(x.at).toDateString() === new Date().toDateString()).length;
      $("#stats").innerHTML = [["receipt", "Aaj ke tasks", today, log.length + " recent", true], ["layout", "Client apps", sites.length, sites.filter((s) => !s.sample).length + " real menu"], ["film", "Reels", reels.length, "AI voice · free"], ["target", "Leads", st.leads || 0, ((st.leadsByStatus || {}).new || 0) + " new"]]
        .map(([i, l, n, s, hl]) => `<div class="glass stat${hl ? " hl" : ""}"><div class="ic">${I(i)}</div><div class="lab">${l}</div><div class="val">${n}</div><div class="sub">${s}</div></div>`).join("");
      const days = [...Array(7)].map((_, i) => new Date(Date.now() - (6 - i) * 864e5));
      const per = days.map((d) => log.filter((x) => new Date(x.at).toDateString() === d.toDateString()).length);
      $("#hchart").innerHTML = `<div style="display:flex;gap:28px;margin:0 0 8px"><div><div class="val" style="font:500 34px/1 var(--serif)">${per.reduce((x, y) => x + y, 0)}</div><div class="tiny">tasks is hafte</div></div><div><div class="val" style="font:500 34px/1 var(--serif)">${(st.agents || []).length}</div><div class="tiny">agents ready</div></div></div>` + lineChart(per, days.map((d) => d.toLocaleDateString("en-IN", { weekday: "short" })));
      const ae = Object.fromEntries((st.agents || []).map((a) => [a.name, a.emoji]));
      $("#recent").innerHTML = log.slice(0, 6).map((x) => `<div class="row"><div class="em">${ae[x.agent] || I("settings")}</div><div class="t"><b>${esc(x.input)}</b><span>${esc(x.agent)} · ${ago(x.at)} · ${esc(x.via || "")}</span></div>${pill(x.status)}</div>`).join("") || '<div class="empty">Abhi koi task nahi — Telegram pe "hi" bolo</div>';
    } catch (e) { $("#stats").innerHTML = errBox(e); $("#recent").innerHTML = ""; $("#hchart").innerHTML = ""; }
    try { const r = await cached("/api/runs", 20000); $("#hruns").innerHTML = r.slice(0, 6).map((x) => `<div class="row"><div class="em">${runIcon(x)}</div><div class="t"><b>${esc(x.name)}</b><span>${esc(x.title || "")} · ${ago(x.at)}</span></div>${pill(x.conclusion || x.status)}</div>`).join(""); } catch (e) { $("#hruns").innerHTML = errBox(e); }
  };
  function meetRow(m) {
    const d = new Date(m.at); const I = window.ic;
    const wa = m.phone ? `https://wa.me/${m.phone.replace(/\D/g, "")}?text=${encodeURIComponent(m.kind === "followup" ? `Namaste ${m.client || ""} ji, Misbah Digital se Misbah. ${m.note || ""}` : `Namaste ${m.client || ""} ji, aaj ${d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })} ki meeting yaad dila raha hoon — Misbah`)}` : "";
    return `<div class="meet${m.done ? " done" : ""}"><div class="dt"><b>${d.getDate()}</b><span>${d.toLocaleDateString("en-IN", { month: "short" })}</span></div><div class="mi"><b>${esc(m.title)}</b><span>${I(m.kind === "followup" ? "repeat" : "clock")} ${d.toLocaleString("en-IN", { weekday: "short", hour: "numeric", minute: "2-digit" })}${m.place ? " · " + esc(m.place) : ""}</span>${m.note ? `<span>${esc(m.note)}</span>` : ""}
      <div class="ma">${wa ? `<a class="btn sm" target="_blank" rel="noopener" href="${wa}">${I("whatsapp")} WhatsApp</a>` : ""}<button class="btn sm" data-mdone="${m.id}">${I("check")} ${m.done ? "Undo" : "Done"}</button><button class="btn sm" data-mics="${m.id}" aria-label="Calendar">${I("calendar")}</button></div></div></div>`;
  }
  function bindMeetRows(root, after) {
    $$("[data-mdone]", root).forEach((b) => (b.onclick = () => { const ms = getMeet(); const m = ms.find((x) => x.id === +b.dataset.mdone); m.done = !m.done; setMeet(ms); toast(m.done ? "Done mark ho gaya" : "Wapas open"); after ? after() : route(); }));
    $$("[data-mics]", root).forEach((b) => (b.onclick = () => { const m = getMeet().find((x) => x.id === +b.dataset.mics); icsDownload(m); }));
  }
  function icsDownload(m) {
    const f = (d) => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const end = new Date(new Date(m.at).getTime() + 3600e3);
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Misbah Digital//EN", "BEGIN:VEVENT", "UID:mdc-" + m.id + "@misbah", "DTSTAMP:" + f(Date.now()), "DTSTART:" + f(m.at), "DTEND:" + f(end), "SUMMARY:" + m.title, "LOCATION:" + (m.place || ""), "DESCRIPTION:" + (m.note || ""), "BEGIN:VALARM", "TRIGGER:-PT30M", "ACTION:DISPLAY", "DESCRIPTION:" + m.title, "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" })); a.download = (m.title || "meeting").replace(/[^\w]+/g, "-") + ".ics"; a.click(); toast("Calendar file download — phone ke calendar mein add ho jayega");
  }

  // ---------- Meetings & follow-ups page ----------
  P.meetings = (v) => {
    const I = window.ic; const sub = (location.hash.split("/")[2] || "");
    const all = getMeet().slice().sort((x, y) => new Date(x.at) - new Date(y.at));
    const now = new Date(); const y = now.getFullYear(), mo = now.getMonth();
    const first = new Date(y, mo, 1), startDay = (first.getDay() + 6) % 7, nd = new Date(y, mo + 1, 0).getDate();
    const has = new Set(all.filter((m) => !m.done).map((m) => new Date(m.at).toDateString()));
    const cells = [...Array(startDay)].map(() => '<div class="d mut"></div>').concat([...Array(nd)].map((_, i) => { const d = new Date(y, mo, i + 1); return `<div class="d${d.toDateString() === now.toDateString() ? " today" : ""}${has.has(d.toDateString()) ? " has" : ""}">${i + 1}</div>`; }));
    const up = all.filter((m) => !m.done), done = all.filter((m) => m.done);
    v.innerHTML = `<div class="ph"><div><span class="eyebrow">Business</span><h1>Meetings & follow-ups</h1><p>Client meetings, demo aur follow-up — time pe WhatsApp reminder aur phone calendar mein add.</p></div><button class="btn pri" id="madd">${I("plus")} Naya add karo</button></div>
      <div class="grid g2 g21"><div class="glass card"><h3>Upcoming<small>${up.length} baaki</small></h3><div class="list" id="mup">${up.map(meetRow).join("") || '<div class="empty">Sab clear</div>'}</div>${done.length ? `<h3 style="margin-top:26px">Ho gaye<small>${done.length}</small></h3><div class="list">${done.map(meetRow).join("")}</div>` : ""}</div>
      <div class="glass card"><h3>${now.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}<small>Calendar</small></h3><div class="cal">${["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => `<div class="dh">${d}</div>`).join("")}${cells.join("")}</div>
        <p class="tiny" style="margin-top:18px">Ye list abhi is browser/phone mein save hoti hai. Telegram reminder ke liye: <span class="code">yaad dilana kal 4 baje Kanak meeting</span></p></div></div>`;
    bindMeetRows(v);
    const form = () => sheet(`<h3>${I("calendar")} Meeting / follow-up</h3>
      <div class="seg" style="margin-bottom:18px" id="mk"><button class="on" data-k="meeting">Meeting</button><button data-k="followup">Follow-up</button></div>
      <label class="field"><span>Title</span><input id="mt" placeholder="Royal Bakers — demo"></label>
      <div class="grid g2" style="gap:12px"><label class="field"><span>Client</span><input id="mc" placeholder="Business ka naam"></label><label class="field"><span>Phone (WhatsApp)</span><input id="mp" inputmode="tel" placeholder="+91…"></label></div>
      <div class="grid g2" style="gap:12px"><label class="field"><span>Date & time</span><input id="md" type="datetime-local"></label><label class="field"><span>Jagah</span><input id="ml" placeholder="Shop / Google Meet / WhatsApp"></label></div>
      <label class="field"><span>Note</span><textarea id="mn" placeholder="Kya baat karni hai"></textarea></label>
      <div class="grid g2" style="gap:12px"><button class="btn" data-close>Cancel</button><button class="btn pri" id="msave">${I("save")} Save</button></div>`, (s) => {
      let kind = "meeting"; $$("#mk button", s).forEach((b) => (b.onclick = () => { kind = b.dataset.k; $$("#mk button", s).forEach((x) => x.classList.toggle("on", x === b)); }));
      const d = new Date(Date.now() + 864e5); d.setHours(17, 0, 0, 0); $("#md", s).value = new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
      $("#msave", s).onclick = () => { const title = $("#mt", s).value.trim(); if (!title) { toast("Title likho"); return; } const ms = getMeet(); ms.push({ id: Date.now(), title, client: $("#mc", s).value.trim(), phone: $("#mp", s).value.trim(), at: new Date($("#md", s).value).toISOString(), place: $("#ml", s).value.trim(), note: $("#mn", s).value.trim(), kind, done: false }); setMeet(ms); closeSheet(); toast("Save ho gaya"); if (location.hash === "#/meetings") route(); else location.hash = "#/meetings"; };
    });
    $("#madd").onclick = form; if (sub === "new") form();
  };

  // ---------- Invoice / quotation maker ----------
  const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
  P.invoices = (v) => {
    const I = window.ic; const sub = location.hash.split("/")[2] || "";
    const saved = LS.get("invoices", []);
    const prof = LS.get("profile", {}) || {};
    let doc = LS.get("invDraft", null) || { type: "Quotation", no: "MD-" + String(saved.length + 1).padStart(3, "0"), date: new Date().toISOString().slice(0, 10), client: "Kanak Cafe & Restaurant", phone: "", items: [{ d: "Online order app (PWA) — menu, cart, WhatsApp order", q: 1, r: 1500 }, { d: "Table QR code print design", q: 1, r: 0 }], disc: 501, upi: "", note: "50% advance, 50% live hone ke baad. Monthly updates ₹300 (optional)." };
    const total = () => { const sub = doc.items.reduce((s, it) => s + (+it.q || 0) * (+it.r || 0), 0); return { sub, grand: Math.max(0, sub - (+doc.disc || 0)) }; };
    const paper = () => { const tt = total(); return `<div class="paper" id="paper"><div class="ph1"><div><div class="brandp">Misbah Digital</div><div style="color:#5C5B55;font-size:12px;margin-top:4px">${esc(prof.city || "Govindpur, Dhanbad")}<br>Apps · Websites · Reels</div></div><div style="text-align:right"><h2>${esc(doc.type)}</h2><div style="color:#5C5B55;font-size:12px">No. ${esc(doc.no)}<br>${new Date(doc.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div></div></div>
      <div class="lbl">Bill to</div><div style="font-weight:600;font-size:15px">${esc(doc.client || "—")}</div>${doc.phone ? `<div style="color:#5C5B55">${esc(doc.phone)}</div>` : ""}
      <table style="margin-top:22px"><thead><tr><th>Item</th><th style="text-align:right">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Amount</th></tr></thead><tbody>${doc.items.filter((it) => it.d).map((it) => `<tr><td>${esc(it.d)}</td><td style="text-align:right">${+it.q || 0}</td><td style="text-align:right">${inr(+it.r || 0)}</td><td style="text-align:right">${inr((+it.q || 0) * (+it.r || 0))}</td></tr>`).join("")}</tbody></table>
      <div class="tot"><div><p><span>Subtotal</span><span>${inr(tt.sub)}</span></p>${+doc.disc ? `<p><span>Discount</span><span>− ${inr(+doc.disc)}</span></p>` : ""}<p class="g"><span>Total</span><span>${inr(tt.grand)}</span></p></div></div>
      <div class="foot">${doc.note ? esc(doc.note) + "<br>" : ""}${doc.upi ? "UPI: " + esc(doc.upi) + "<br>" : ""}Shukriya — Misbah Digital</div></div>`; };
    v.innerHTML = `<div class="ph"><div><span class="eyebrow">Business</span><h1>Invoice & quotation</h1><p>Client ka naam, items aur rate daalo — total khud banega. PDF ke liye "Print / PDF" dabao aur "Save as PDF" chuno.</p></div></div>
      <div class="grid g2 g12" style="align-items:start"><div class="glass card">
        <div class="seg" style="margin-bottom:20px" id="ity"><button data-t="Quotation">Quotation</button><button data-t="Invoice">Invoice</button></div>
        <div class="grid g2" style="gap:12px"><label class="field"><span>Client</span><input id="ic" value="${esc(doc.client)}"></label><label class="field"><span>Phone</span><input id="ip" inputmode="tel" value="${esc(doc.phone)}" placeholder="+91…"></label></div>
        <div class="grid g2" style="gap:12px"><label class="field"><span>Number</span><input id="ino" value="${esc(doc.no)}"></label><label class="field"><span>Date</span><input id="idt" type="date" value="${esc(doc.date)}"></label></div>
        <div class="field"><span>Items · qty · rate (₹)</span><div class="inv-items" id="iit"></div><button class="btn sm" id="iadd">${I("plus")} Item</button></div>
        <div class="grid g2" style="gap:12px"><label class="field"><span>Discount (₹)</span><input id="idc" type="number" min="0" value="${+doc.disc || 0}"></label><label class="field"><span>UPI ID (optional)</span><input id="iupi" value="${esc(doc.upi)}" placeholder="naam@upi"></label></div>
        <label class="field"><span>Note / terms</span><textarea id="inote">${esc(doc.note)}</textarea></label>
        <div class="chips"><button class="btn pri" id="iprint">${I("printer")} Print / PDF</button><button class="btn" id="iwa">${I("whatsapp")} WhatsApp</button><button class="btn" id="isave">${I("save")} Save</button></div>
      </div><div><div id="iprev"></div>
      <div class="glass card" style="margin-top:20px"><h3>Saved<small>${saved.length} documents</small></h3><div class="list" id="isv">${saved.slice().reverse().map((d, i) => `<div class="row"><div class="em">${I("receipt")}</div><div class="t"><b>${esc(d.type)} ${esc(d.no)} — ${esc(d.client)}</b><span>${esc(d.date)} · ${inr(d.total || 0)}</span></div><button class="btn sm" data-iopen="${saved.length - 1 - i}">Kholo</button></div>`).join("") || '<div class="empty">Abhi kuch save nahi</div>'}</div></div></div></div>`;
    const draw = () => { $("#iprev").innerHTML = paper(); LS.set("invDraft", doc); $$("#ity button").forEach((b) => b.classList.toggle("on", b.dataset.t === doc.type)); };
    const drawItems = () => {
      $("#iit").innerHTML = doc.items.map((it, i) => `<div class="ir"><input class="inp" data-f="d" data-i="${i}" value="${esc(it.d)}" placeholder="Kaam / item"><input class="inp" data-f="q" data-i="${i}" type="number" min="0" value="${it.q}" aria-label="Qty"><input class="inp" data-f="r" data-i="${i}" type="number" min="0" value="${it.r}" aria-label="Rate"><button class="btn sm danger" data-irm="${i}" aria-label="Remove" style="padding:0">${I("x")}</button></div>`).join("");
      $$("#iit input").forEach((el) => (el.oninput = () => { doc.items[+el.dataset.i][el.dataset.f] = el.dataset.f === "d" ? el.value : +el.value; draw(); }));
      $$("[data-irm]").forEach((b) => (b.onclick = () => { doc.items.splice(+b.dataset.irm, 1); drawItems(); draw(); }));
    };
    [["ic", "client"], ["ip", "phone"], ["ino", "no"], ["idt", "date"], ["idc", "disc"], ["iupi", "upi"], ["inote", "note"]].forEach(([id, f]) => ($("#" + id).oninput = (e) => { doc[f] = e.target.value; draw(); }));
    $$("#ity button").forEach((b) => (b.onclick = () => { doc.type = b.dataset.t; draw(); }));
    $("#iadd").onclick = () => { doc.items.push({ d: "", q: 1, r: 0 }); drawItems(); draw(); };
    $("#iprint").onclick = () => window.print();
    $("#iwa").onclick = () => { const tt = total(); const txt = `${doc.type} ${doc.no} — Misbah Digital\n${doc.client}\n\n` + doc.items.filter((x) => x.d).map((x) => `• ${x.d}: ${inr((+x.q || 0) * (+x.r || 0))}`).join("\n") + (+doc.disc ? `\nDiscount: −${inr(+doc.disc)}` : "") + `\nTotal: ${inr(tt.grand)}` + (doc.upi ? `\nUPI: ${doc.upi}` : "") + (doc.note ? `\n\n${doc.note}` : ""); window.open(`https://wa.me/${(doc.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(txt)}`, "_blank"); };
    $("#isave").onclick = () => { const s2 = LS.get("invoices", []); s2.push(Object.assign({}, doc, { total: total().grand, saved: new Date().toISOString() })); LS.set("invoices", s2); LS.del("invDraft"); toast("Save ho gaya — " + doc.no); route(); };
    $$("[data-iopen]").forEach((b) => (b.onclick = () => { doc = Object.assign({}, saved[+b.dataset.iopen]); LS.set("invDraft", doc); route(); }));
    drawItems(); draw();
    if (sub === "new" && !LS.get("invDraftOpened", false)) { LS.set("invDraftOpened", true); }
  };

  P.chat = (v) => {
    const hist = LS.get("chat", []);
    v.innerHTML = `<div class="ph"><div><span class="eyebrow">Misbah Digital Computer</span><h1>Chat — Brain</h1><p>Telegram jaisa: kuch bhi pucho, ya command do (/site, /reel, research, yaad dilana…)</p></div><button class="btn sm" id="clr">🧹 Clear</button></div>
      <div class="chat"><div class="msgs" id="msgs"></div>
      <div class="chips" style="margin:8px 0">${["/help", "research karo free AI tools 2026", "/reel trending", "/site Royal Bakers | bakery | Govindpur", "yaad dilana kal 7 baje padhai", "caption do Pulsar rain edit"].map((c) => `<button class="chip" data-s="${esc(c)}">${esc(c)}</button>`).join("")}</div>
      <div class="glass composer"><textarea id="cin" rows="1" placeholder="Message likho…"></textarea><button class="btn pri" id="send" aria-label="Send">➤</button></div></div>`;
    const box = $("#msgs");
    const draw = () => { box.innerHTML = hist.map((m) => `<div class="msg ${m.me ? "me" : "bot"}">${esc(m.text)}<span class="meta">${m.me ? "" : esc(m.agent || "") + " · "}${fmtD(m.at)}</span></div>`).join("") || `<div class="empty"><div class="e">🧠</div>Namaste! Main tumhara Digital Computer hoon. Kuch bhi pucho.</div>`; box.scrollTop = box.scrollHeight; };
    draw();
    const send = async (text) => {
      text = text.trim(); if (!text) return;
      hist.push({ me: true, text, at: new Date().toISOString() }); draw();
      box.insertAdjacentHTML("beforeend", `<div class="msg bot typing"><span></span><span></span><span></span></div>`); box.scrollTop = box.scrollHeight;
      try { const r = await api("/api/chat", { text }); hist.push({ text: r.reply, agent: r.agent, at: new Date().toISOString() }); }
      catch (e) { hist.push({ text: "😕 " + e.message, at: new Date().toISOString() }); }
      LS.set("chat", hist.slice(-80)); draw(); bust("/api/state");
    };
    const inp = $("#cin");
    $("#send").onclick = () => { const x = inp.value; inp.value = ""; send(x); };
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("#send").click(); } });
    $$("[data-s]", v).forEach((b) => (b.onclick = () => send(b.dataset.s)));
    $("#clr").onclick = () => { hist.length = 0; LS.set("chat", []); draw(); };
    const d = LS.get("chatDraft", ""); if (d) { LS.del("chatDraft"); send(d); }
  };

  const EXTRA_AGENTS = [
    { name: "leadcap", emoji: "🎯", title: "Lead Capture", description: "Public form → leads.json + Telegram alert (+ automations)", go: "#/leads", tag: "Business" },
    { name: "followup", emoji: "🔁", title: "Follow-up Agent", description: "Naye lead ko WhatsApp follow-up link + Sheet row — automation template", go: "#/automations", tag: "Automation" },
    { name: "voice", emoji: "📞", title: "AI Calling Agent", description: "Phone pe AI se appointment booking — paid voice service chahiye", soon: true },
    { name: "wa", emoji: "🟢", title: "WhatsApp Auto-reply", description: "Official WhatsApp Business API paid hai — abhi free wa.me links", soon: true },
  ];
  P.agents = async (v) => {
    v.innerHTML = `<div class="ph"><div><span class="eyebrow">Misbah Digital Computer</span><h1>Agents</h1><p>Har agent ek kaam ka expert. ▶ Run → Brain ko bhejta hai (bilkul Telegram jaisa).</p></div></div><div class="grid g3" id="ag">${loading()}</div>`;
    try {
      const list = await cached("/api/agents", 300000);
      $("#ag").innerHTML = [...list, ...EXTRA_AGENTS].map((a) => `<div class="glass acard"><div class="hd"><div class="em">${a.emoji}</div><div><b>${esc(a.title)}</b><div class="tiny">${a.soon ? "Coming soon" : a.commands ? a.commands.map((c) => "/" + c).join(" · ") : a.tag}</div></div></div><p>${esc(a.description)}</p>
        ${a.examples && a.examples[0] ? `<div class="tiny">e.g. <span class="code">${esc(a.examples[0])}</span></div>` : ""}
        <div class="ft">${a.soon ? '<span class="pill warn">needs paid key</span>' : a.go ? `<a class="btn sm pri" href="${a.go}">Kholo →</a>` : `<button class="btn sm pri" data-run="${esc(a.name)}">▶ Run</button>`}${a.name === "site" ? '<a class="btn sm" href="#/sites">Form</a>' : a.name === "reel" ? '<a class="btn sm" href="#/reels">Studio</a>' : a.name === "video" ? '<a class="btn sm" href="#/edit">Edit page</a>' : ""}</div></div>`).join("");
      $$("[data-run]", v).forEach((b) => (b.onclick = () => runAgentSheet(list.find((x) => x.name === b.dataset.run))));
    } catch (e) { $("#ag").innerHTML = errBox(e); }
  };
  function runAgentSheet(a) {
    sheet(`<h3>${a.emoji} ${esc(a.title)}</h3><p class="muted small">${esc(a.description)}</p><label class="field"><span>Kya karna hai?</span><textarea id="ain">${esc((a.examples || [])[0] || "")}</textarea></label><div class="tiny" style="margin-bottom:10px">${(a.examples || []).map((x) => `<span class="code">${esc(x)}</span>`).join(" ")}</div><div class="grid g2"><button class="btn" data-close>Cancel</button><button class="btn pri" id="ago">▶ Run</button></div><div id="aout" style="margin-top:12px"></div>`, (s) => {
      $("#ago", s).onclick = async () => {
        const b = $("#ago", s); b.disabled = true; $("#aout", s).innerHTML = loading();
        let text = $("#ain", s).value.trim();
        if (a.commands && a.commands[0] && !text.startsWith("/") && a.name !== "chat" && !/^(yaad|note|research|code|caption|reel|video|briefing|pata|kanak)/i.test(text)) text = "/" + a.commands[0] + " " + text;
        try { const r = await api("/api/chat", { text }); $("#aout", s).innerHTML = `<div class="msg bot" style="max-width:100%">${esc(r.reply)}</div>`; } catch (e) { $("#aout", s).innerHTML = errBox(e); }
        b.disabled = false;
      };
    });
  }

  const APPS = [
    { k: "telegram", e: "✈️", n: "Telegram Bot", s: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_WEBHOOK_SECRET", "ALLOWED_CHAT_ID"], d: "Chat box — yahan se kaam dete ho", how: "BotFather se token → GitHub Secret TELEGRAM_BOT_TOKEN. Phir Worker /setup?key=… ek baar kholo." },
    { k: "gemini", e: "🧠", n: "Google Gemini (Brain)", s: ["GEMINI_API_KEY"], d: "Saare jawab, reel scripts, site copy", how: "aistudio.google.com → API key → GitHub Secret GEMINI_API_KEY → Actions → Deploy Worker → Run." },
    { k: "github", e: "🐙", n: "GitHub (disk + computer)", s: ["GH_TOKEN"], d: "Data, workflows, sites, reels — sab yahin", how: "Classic token (repo + workflow) → Secret GH_TOKEN." },
    { k: "cloudflare", e: "⚡", n: "Cloudflare Worker", always: true, d: "Instant jawab + is dashboard ka API (free 100k req/din)", how: "CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID secrets (set hain)." },
    { k: "pages", e: "🌐", n: "GitHub Pages", always: true, d: "Client apps + ye dashboard (free hosting)", how: "misbah-sites repo → Pages ON (ho gaya)." },
    { k: "sheets", e: "📗", n: "Google Sheets", s: ["SHEETS_WEBHOOK_URL"], d: "Leads / automation rows sheet mein (free Apps Script)", how: "Google Sheet → Extensions → Apps Script → docs/HOW-TO-USE.md wala chhota code paste → Deploy → Web app (Anyone) → URL ko GitHub Secret SHEETS_WEBHOOK_URL mein daalo → Deploy Worker run." },
    { k: "websearch", e: "🔎", n: "Web Search (Tavily)", s: ["TAVILY_API_KEY"], optional: true, d: "Research agent ke better results (free tier)", how: "tavily.com free key → Secret TAVILY_API_KEY. Bina iske DuckDuckGo/Wikipedia chalta hai." },
    { k: "whatsapp", e: "🟢", n: "WhatsApp", free: true, d: "FREE: wa.me tap-to-send links (leads + automations). Auto-send = Business API (paid)", how: "Kuch set nahi karna — wa.me links chal rahe hain." },
    { k: "webhooks", e: "🪝", n: "Webhooks", always: true, d: "Kisi bhi app/form se automation trigger", how: "Automations → Webhook trigger → Save → URL copy." },
    { k: "instagram", e: "📸", n: "Instagram", soon: true, d: "Reels auto-post — Meta app review chahiye", how: "Abhi: Reel Studio se download → Insta pe post." },
    { k: "gmail", e: "✉️", n: "Gmail", soon: true, d: "Email bhejna — Google OAuth setup chahiye", how: "Coming soon. Abhi WhatsApp/Telegram nodes use karo." },
    { k: "drive", e: "🗂️", n: "Google Drive", optional: true, s: ["RCLONE_CONF"], d: "Videos Drive pe save (video trim)", how: "rclone config → Secret RCLONE_CONF (optional). Note: dashboard sirf Worker ke secrets dekh sakta hai." },
    { k: "youtube", e: "▶️", n: "YouTube", soon: true, d: "Shorts upload — OAuth chahiye", how: "Coming soon." },
    { k: "notion", e: "📓", n: "Notion", soon: true, d: "Notes sync", how: "Coming soon." },
  ];
  P.apps = async (v) => {
    v.innerHTML = `<div class="ph"><div><span class="eyebrow">Misbah Digital Computer</span><h1>Apps / Integrations</h1><p>Kaun connect hai, kaun nahi, aur kaise karna hai. Keys kabhi chat/dashboard mein nahi — sirf GitHub → Settings → Secrets.</p></div></div><div class="grid g3" id="apps">${loading()}</div>`;
    let sec = {}; try { sec = (await cached("/api/apps", 60000)).secrets || {}; } catch (e) {}
    $("#apps").innerHTML = APPS.map((a) => {
      const on = a.always || a.free || (a.s && a.s.every((n) => sec[n]));
      const st = a.soon ? '<span class="pill warn">Coming soon</span>' : on ? '<span class="pill ok">● Connected</span>' : a.optional ? '<span class="pill">Optional</span>' : '<span class="pill bad">Not connected</span>';
      return `<div class="glass acard"><div class="hd"><div class="em">${a.e}</div><div style="flex:1"><b>${esc(a.n)}</b></div>${st}</div><p>${esc(a.d)}</p>${a.s ? `<div class="tiny">Secret: ${a.s.map((n) => `<span class="code">${n}</span>${sec[n] ? " ✓" : ""}`).join(" ")}</div>` : ""}<div class="ft"><button class="btn sm" data-how="${a.k}">${on ? "Details" : a.soon ? "Kab aayega?" : "Connect kaise?"}</button>${a.s && !on ? `<a class="btn sm" target="_blank" rel="noopener" href="https://github.com/${CFG.REPO}/settings/secrets/actions/new">＋ Secret add</a>` : ""}</div></div>`;
    }).join("");
    $$("[data-how]", v).forEach((b) => (b.onclick = () => { const a = APPS.find((x) => x.k === b.dataset.how); sheet(`<h3>${a.e} ${esc(a.n)}</h3><p>${esc(a.how)}</p><p class="tiny">🔒 Key/token kabhi chat, dashboard ya repo file mein mat daalna — sirf GitHub Secrets. Secret add karke Actions → "Deploy Worker" → Run workflow.</p><button class="btn block" data-close>Samajh gaya</button>`); }));
  };

  // ---------- Automations (visual builder) ----------
  const NODE_T = {
    schedule: { e: "⏰", n: "Schedule", trig: 1, f: [["every", "Kab", ["day", "hour", "week", "minutes"]], ["at", "Time (IST, HH:MM)"], ["day", "Week day (0=Ravi … 6=Shani)"], ["minutes", "Har kitne min (min 5)"]], sum: (c) => `${c.every || "day"} · ${c.every === "minutes" ? (c.minutes || 30) + " min" : c.at || "08:00"} IST` },
    telegram_in: { type: "telegram", e: "✈️", n: "Telegram message", trig: 1, f: [["keyword", "Message is word se shuru ho"]], sum: (c) => `jab msg "${c.keyword || "…"}" se shuru` },
    webhook: { e: "🪝", n: "Webhook", trig: 1, f: [], sum: () => "POST /hook/… (koi bhi app)" },
    lead: { e: "🎯", n: "New form lead", trig: 1, f: [], sum: () => "lead form submit hote hi" },
    manual: { e: "👆", n: "Manual", trig: 1, f: [], sum: () => "Run button se" },
    gemini: { e: "🧠", n: "Gemini AI", f: [["prompt", "Prompt ({{last}}, {{lead.name}}, {{now}})", "area"]], sum: (c) => (c.prompt || "").slice(0, 70) },
    telegram: { e: "📨", n: "Send Telegram", f: [["text", "Message ({{last}})", "area"]], sum: (c) => (c.text || "{{last}}").slice(0, 70) },
    whatsapp: { e: "🟢", n: "WhatsApp link", f: [["phone", "Phone ({{lead.phone}})"], ["text", "Message", "area"]], sum: (c) => "wa.me → " + (c.phone || "{{lead.phone}}") },
    sheet: { e: "📗", n: "Google Sheet row", f: [["row", "Row JSON (khaali = auto)", "area"]], sum: () => "row add (SHEETS_WEBHOOK_URL)" },
    leads: { e: "🗃️", n: "Save lead", f: [["name", "Naam"], ["phone", "Phone"], ["note", "Note"]], sum: () => "data/leads.json" },
    http: { e: "🌐", n: "HTTP request", f: [["url", "URL"], ["method", "Method", ["GET", "POST"]], ["body", "Body (JSON)", "area"]], sum: (c) => (c.method || "GET") + " " + (c.url || "") },
    site: { e: "🏗️", n: "Make Site", f: [["name", "Business naam ({{lead.business}})"], ["btype", "Type", ["cafe", "bakery", "salon", "gym", "coaching", "shop"]], ["area", "Area"], ["phone", "Phone"]], sum: (c) => "app: " + (c.name || "{{lead.business}}") },
    reel: { e: "🎬", n: "Make Reel", f: [["topic", "Topic (trending)"], ["voice", "Voice", ["hi-IN-MadhurNeural", "hi-IN-SwaraNeural"]]], sum: (c) => "reel: " + (c.topic || "trending") },
    email: { e: "✉️", n: "Gmail (soon)", soon: 1, f: [["to", "To"], ["text", "Text", "area"]], sum: () => "coming soon" },
    call: { e: "📞", n: "AI Call (soon)", soon: 1, f: [], sum: () => "paid — coming soon" },
  };
  const isTrigNode = (n) => ["schedule", "webhook", "lead", "manual"].includes(n.type) || (n.type === "telegram" && !!n.trigger);
  const ndefOf = (n) => (n.type === "telegram" && isTrigNode(n) ? NODE_T.telegram_in : NODE_T[n.type]) || NODE_T.manual;
  let flow = null, selNode = null, armed = null;
  const markTrig = (f) => { (f.nodes || []).forEach((n) => { if (n.type === "telegram" && !(f.edges || []).some((e) => e.to === n.id) && (n.config || {}).keyword !== undefined) n.trigger = true; }); return f; };
  P.automations = async (v) => {
    v.innerHTML = `<div class="ph"><div><span class="eyebrow">Misbah Digital Computer</span><h1>Automations</h1><p>Trigger → Action nodes jodo. Schedule flows Worker cron se (har 5 min, free) chalte hain; webhook / lead / Telegram turant.</p></div><div class="chips"><button class="btn pri" id="newFlow">＋ Naya flow</button></div></div>
      <div class="tabs" id="atabs"><button class="on" data-t="list">Mere flows</button><button data-t="build">Builder</button><button data-t="runs">Run history</button></div><div id="apane">${loading()}</div>`;
    let data = { flows: [], templates: [], hookBase: "" };
    const load = async () => { bust("/api/automations"); data = await cached("/api/automations", 1); data.flows.forEach(markTrig); };
    const tab = (k) => { $$("#atabs button").forEach((b) => b.classList.toggle("on", b.dataset.t === k)); ({ list: listView, build: buildView, runs: runsView })[k](); };
    $$("#atabs button").forEach((b) => (b.onclick = () => tab(b.dataset.t)));
    $("#newFlow").onclick = () => { flow = { name: "Naya flow", on: false, nodes: [{ id: "n1", type: "manual", x: 40, y: 120, config: {} }], edges: [] }; tab("build"); };
    async function listView() {
      $("#apane").innerHTML = loading();
      try { await load(); } catch (e) { $("#apane").innerHTML = errBox(e); return; }
      $("#apane").innerHTML = `<div class="grid g2"><div class="glass card"><h3>Mere flows <small>${data.flows.length}</small></h3><div class="list flow-list">${data.flows.map((f) => { const tr = f.nodes.find(isTrigNode); return `<div class="row"><div class="em">${tr ? ndefOf(tr).e : "⚡"}</div><div class="t" data-open="${f.id}" style="cursor:pointer"><b>${esc(f.name)}</b><span>${f.nodes.map((n) => ndefOf(n).e).join(" → ")} · ${f.lastRun ? "last run " + ago(f.lastRun) + (f.lastOk ? " ✓" : " ✗") : "kabhi nahi chala"}</span></div><label class="pill ${f.on ? "ok" : ""}" style="cursor:pointer"><input type="checkbox" data-tog="${f.id}" ${f.on ? "checked" : ""} style="margin:0 4px 0 0">${f.on ? "ON" : "OFF"}</label></div>`; }).join("") || '<div class="empty"><div class="e">⚡</div>Abhi koi flow nahi — template se shuru karo 👉</div>'}</div></div>
        <div class="glass card"><h3>Templates <small>1 tap mein</small></h3><div class="list">${data.templates.map((f, i) => `<div class="row"><div class="em">✨</div><div class="t"><b>${esc(f.name)}</b><span>${markTrig(JSON.parse(JSON.stringify(f))).nodes.map((n) => ndefOf(n).e).join(" → ")}</span></div><button class="btn sm pri" data-tpl="${i}">Use</button></div>`).join("")}
          <div class="row"><div class="em">🔁</div><div class="t"><b>Morning follow-up reminder</b><span>⏰ → 📨 (har subah leads follow-up)</span></div><button class="btn sm pri" data-tpl="fu">Use</button></div>
          <div class="row"><div class="em">🎬</div><div class="t"><b>Har shaam trending reel</b><span>⏰ → 🎬 → 📨</span></div><button class="btn sm pri" data-tpl="reel">Use</button></div></div></div></div>`;
      $$("[data-open]").forEach((el) => (el.onclick = () => { flow = JSON.parse(JSON.stringify(data.flows.find((f) => f.id === el.dataset.open))); tab("build"); }));
      $$("[data-tog]").forEach((el) => (el.onchange = async () => { try { await api("/api/automations", { action: "toggle", id: el.dataset.tog, on: el.checked }); toast(el.checked ? "ON ✓" : "OFF"); listView(); } catch (e) { toast(e.message); } }));
      $$("[data-tpl]").forEach((el) => (el.onclick = () => {
        const k = el.dataset.tpl;
        if (k === "fu") flow = { name: "Morning follow-up reminder", on: false, nodes: [{ id: "t", type: "schedule", x: 40, y: 100, config: { every: "day", at: "09:00" } }, { id: "s", type: "telegram", x: 320, y: 100, config: { text: "🔁 Follow-up time! Dashboard → Leads mein 'New' aur 'Contacted' wale leads ko aaj WhatsApp karo 💪" } }], edges: [{ from: "t", to: "s" }] };
        else if (k === "reel") flow = { name: "Har shaam trending reel", on: false, nodes: [{ id: "t", type: "schedule", x: 40, y: 100, config: { every: "day", at: "17:30" } }, { id: "r", type: "reel", x: 320, y: 100, config: { topic: "trending", voice: "hi-IN-MadhurNeural" } }, { id: "s", type: "telegram", x: 600, y: 100, config: { text: "🎬 Aaj ki trending reel ban rahi hai — 5 min mein yahin aayegi" } }], edges: [{ from: "t", to: "r" }, { from: "r", to: "s" }] };
        else { flow = markTrig(JSON.parse(JSON.stringify(data.templates[+k]))); delete flow.id; }
        tab("build"); toast("Template load ✓ — Save dabao");
      }));
    }
    function buildView() {
      if (!flow) flow = { name: "Naya flow", on: false, nodes: [{ id: "n1", type: "manual", x: 40, y: 120, config: {} }], edges: [] };
      const groups = [["Triggers", Object.entries(NODE_T).filter(([, d]) => d.trig)], ["Actions", Object.entries(NODE_T).filter(([, d]) => !d.trig)]];
      $("#apane").innerHTML = `<div class="glass card" style="margin-bottom:12px;display:flex;gap:10px;flex-wrap:wrap;align-items:center"><input class="inp" id="fname" value="${esc(flow.name)}" style="flex:1;min-width:180px" aria-label="Flow naam"><label class="chip"><input type="checkbox" id="fon" ${flow.on ? "checked" : ""}> ON</label><button class="btn" id="ftest">▶ Test run</button><button class="btn pri" id="fsave">💾 Save</button>${flow.id ? '<button class="btn danger" id="fdel" aria-label="Delete">🗑</button>' : ""}</div>
        <div class="builder"><div class="glass palette">${groups.map(([g, items]) => `<h4>${g}</h4>` + items.map(([k, d]) => `<div class="pal-item ${d.soon ? "soon" : ""}" data-add="${k}"><span>${d.e}</span>${d.n}</div>`).join("")).join("")}</div>
        <div class="canvas-wrap" id="cw"><div class="canvas-tools"><span class="pill acc">● se ○ tak tap = jodo · node tap = settings</span></div><div class="canvas" id="cv"><svg id="edges"></svg></div></div></div>
        <div id="hookInfo" class="tiny" style="margin-top:8px"></div><div id="testOut"></div>`;
      $$("[data-add]").forEach((el) => (el.onclick = () => {
        const k = el.dataset.add, d = NODE_T[k], type = d.type || k;
        if (d.trig) { const old = flow.nodes.find(isTrigNode); if (old) { flow.nodes = flow.nodes.filter((n) => n !== old); flow.edges = flow.edges.map((e) => (e.from === old.id ? { ...e, from: "__T" } : e)); } }
        const id = "n" + Date.now().toString(36).slice(-5);
        const acts = flow.nodes.filter((n) => !isTrigNode(n)).length;
        const n = { id, type, x: d.trig ? 40 : 300 + (acts % 3) * 250, y: d.trig ? 120 : 60 + Math.floor(acts / 3) * 170 + (acts % 2) * 60, config: {} };
        if (k === "telegram_in") n.trigger = true;
        if (d.trig) { flow.nodes.unshift(n); flow.edges = flow.edges.map((e) => (e.from === "__T" ? { ...e, from: id } : e)); }
        else { const last = flow.nodes[flow.nodes.length - 1]; flow.nodes.push(n); if (last) flow.edges.push({ from: last.id, to: id }); }
        drawCanvas(); editNode(n);
      }));
      $("#fsave").onclick = async () => { flow.name = $("#fname").value.trim() || "Flow"; flow.on = $("#fon").checked; try { const r = await api("/api/automations", { action: "save", flow: serial(flow) }); flow = markTrig(JSON.parse(JSON.stringify(r.flows[0]))); toast("Saved ✓ (data/automations.json)"); drawCanvas(); hookInfo(); } catch (e) { toast(e.message); } };
      $("#ftest").onclick = async () => { $("#testOut").innerHTML = loading(); try { const r = await api("/api/automation/run", flow.id ? { id: flow.id } : { flow: serial(flow) }); $("#testOut").innerHTML = `<div class="glass card" style="margin-top:10px"><h3>${r.ok ? "Chal gaya" : "Ruk gaya"} <small>${r.ms}ms</small></h3>${r.steps.map((s) => `<div class="row"><div class="em">${(NODE_T[s.type] || {}).e || "•"}</div><div class="t"><b>${esc(s.type)}</b><span>${esc(s.out)}</span></div>${pill(s.ok ? "ok" : "error")}</div>`).join("") || "Trigger ke baad koi node juda nahi"}</div>`; } catch (e) { $("#testOut").innerHTML = errBox(e); } };
      if ($("#fdel")) $("#fdel").onclick = async () => { if (!confirm("Flow delete karein?")) return; await api("/api/automations", { action: "delete", id: flow.id }); flow = null; tab("list"); };
      drawCanvas(); hookInfo();
    }
    function hookInfo() {
      const el = $("#hookInfo"); if (!el) return; const tr = flow.nodes.find(isTrigNode);
      el.innerHTML = tr && tr.type === "webhook" ? (flow.hookToken ? `🪝 Webhook URL: <span class="code">${esc(data.hookBase + flow.id + "?t=" + flow.hookToken)}</span> <button class="btn sm" id="cph">Copy</button>` : "Save karo — phir webhook URL milega")
        : tr && tr.type === "lead" ? `🎯 Lead form: <a href="${CFG.SITES_BASE}computer/lead.html" target="_blank" rel="noopener" class="code">${CFG.SITES_BASE}computer/lead.html</a>` : "";
      if ($("#cph")) $("#cph").onclick = () => copy(data.hookBase + flow.id + "?t=" + flow.hookToken);
    }
    function serial(f) { return { id: f.id, name: f.name, on: f.on, nodes: f.nodes.map((n) => ({ id: n.id, type: n.type, x: Math.round(n.x), y: Math.round(n.y), config: Object.assign({}, n.config || {}, n.trigger ? { keyword: (n.config || {}).keyword || "" } : {}) })), edges: f.edges }; }
    function drawCanvas() {
      const cv = $("#cv"); if (!cv) return;
      $$(".node", cv).forEach((n) => n.remove());
      for (const n of flow.nodes) {
        const d = ndefOf(n), trig = isTrigNode(n);
        const el = document.createElement("div");
        el.className = "node " + (trig ? "trig" : "act") + (selNode === n.id ? " sel" : ""); el.style.left = n.x + "px"; el.style.top = n.y + "px";
        el.innerHTML = `${trig ? "" : '<div class="port in" data-port="in" title="input"></div>'}<div class="nh"><span class="k">${d.e}</span>${esc(d.n)}${d.soon ? ' <span class="pill warn" style="margin-left:auto">soon</span>' : trig ? ' <span class="pill acc" style="margin-left:auto">trigger</span>' : ""}</div><div class="nb">${esc(d.sum(n.config || {}))}</div><div class="port out" data-port="out" title="output"></div>`;
        cv.appendChild(el); dragify(el, n);
      }
      drawEdges();
    }
    function drawEdges() {
      const svg = $("#edges"); if (!svg) return;
      const pos = Object.fromEntries(flow.nodes.map((n) => [n.id, n]));
      svg.innerHTML = `<defs><linearGradient id="eg" x1="0" x2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset="1" stop-color="#7c5cff"/></linearGradient></defs>` + flow.edges.map((e) => {
        const a = pos[e.from], b = pos[e.to]; if (!a || !b) return "";
        const x1 = a.x + 190, y1 = a.y + 30, x2 = b.x, y2 = b.y + 30, dx = Math.max(50, Math.abs(x2 - x1) / 2);
        return `<path d="M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}" stroke="url(#eg)" stroke-width="3" fill="none"/><circle cx="${x2}" cy="${y2}" r="4" fill="#7c5cff"/>`;
      }).join("");
    }
    function dragify(el, n) {
      el.addEventListener("pointerdown", (e) => {
        const port = e.target.dataset && e.target.dataset.port;
        if (port) { e.stopPropagation(); portTap(n, port, e.target); return; }
        const sx = e.clientX, sy = e.clientY, ox = n.x, oy = n.y; let moved = false; el.setPointerCapture(e.pointerId);
        const mv = (ev) => { const dx = ev.clientX - sx, dy = ev.clientY - sy; if (Math.abs(dx) + Math.abs(dy) > 5) moved = true; if (!moved) return; n.x = Math.max(0, ox + dx); n.y = Math.max(0, oy + dy); el.style.left = n.x + "px"; el.style.top = n.y + "px"; drawEdges(); };
        const up = () => { el.removeEventListener("pointermove", mv); el.removeEventListener("pointerup", up); if (!moved) editNode(n); };
        el.addEventListener("pointermove", mv); el.addEventListener("pointerup", up);
      });
    }
    function portTap(n, port, dom) {
      if (port === "out") { armed = n.id; $$(".port").forEach((p) => p.classList.remove("armed")); dom.classList.add("armed"); toast("Ab jis node se jodna hai uska ○ tap karo"); return; }
      if (port === "in" && armed && armed !== n.id) { if (!flow.edges.some((e) => e.from === armed && e.to === n.id)) flow.edges.push({ from: armed, to: n.id }); armed = null; drawCanvas(); toast("Jud gaya ✓"); }
    }
    function editNode(n) {
      selNode = n.id; drawCanvas();
      const d = ndefOf(n), c = n.config || (n.config = {});
      sheet(`<h3>${d.e} ${esc(d.n)}</h3>${d.soon ? '<p><span class="pill warn">Coming soon — paid service / setup chahiye</span></p>' : ""}${d.f.map(([k, lab, kind]) => Array.isArray(kind) ? `<label class="field"><span>${esc(lab)}</span><select data-k="${k}">${kind.map((o) => `<option ${c[k] === o ? "selected" : ""}>${o}</option>`).join("")}</select></label>` : kind === "area" ? `<label class="field"><span>${esc(lab)}</span><textarea data-k="${k}">${esc(c[k] || "")}</textarea></label>` : `<label class="field"><span>${esc(lab)}</span><input data-k="${k}" value="${esc(c[k] || "")}"></label>`).join("") || '<p class="muted small">Is node mein kuch set nahi karna.</p>'}
        <p class="tiny">Variables: {{last}} (pichle node ka output), {{lead.name}}, {{lead.phone}}, {{lead.business}}, {{lead.msg}}, {{now}}</p>
        <div class="grid g2"><button class="btn danger" id="ndel">🗑 Node hatao</button><button class="btn pri" id="nok">✓ Done</button></div>${flow.edges.some((e) => e.to === n.id || e.from === n.id) ? '<button class="btn sm block" id="nunlink" style="margin-top:8px">✂ Is node ki lines hatao</button>' : ""}`, (s) => {
        $("#nok", s).onclick = () => { $$("[data-k]", s).forEach((el) => (c[el.dataset.k] = el.value)); if (n.type === "schedule" && !c.every) c.every = "day"; closeSheet(); drawCanvas(); };
        $("#ndel", s).onclick = () => { flow.nodes = flow.nodes.filter((x) => x !== n); flow.edges = flow.edges.filter((e) => e.from !== n.id && e.to !== n.id); closeSheet(); drawCanvas(); };
        if ($("#nunlink", s)) $("#nunlink", s).onclick = () => { flow.edges = flow.edges.filter((e) => e.from !== n.id && e.to !== n.id); closeSheet(); drawCanvas(); };
      });
    }
    async function runsView() {
      $("#apane").innerHTML = loading();
      try { const r = await api("/api/automation-runs"); $("#apane").innerHTML = `<div class="glass card"><div class="list">${r.map((x) => `<div class="row"><div class="em">${x.ok ? "✅" : "❌"}</div><div class="t"><b>${esc(x.name)}</b><span>${esc(x.trigger)} · ${fmtD(x.at)} · ${x.steps.map((s) => s.type + (s.ok ? "✓" : "✗")).join(" → ")}</span></div><span class="tiny">${x.ms}ms</span></div>`).join("") || '<div class="empty">Abhi koi run nahi</div>'}</div></div>`; } catch (e) { $("#apane").innerHTML = errBox(e); }
    }
    listView();
  };

  // ---------- Leads / CRM ----------
  P.leads = async (v) => {
    const formUrl = CFG.SITES_BASE + "computer/lead.html";
    v.innerHTML = `<div class="ph"><div><span class="eyebrow">Misbah Digital Computer</span><h1>Leads / CRM</h1><p>Lead → Contacted → Interested → Client. Public form share karo — naye lead pe Telegram alert.</p></div><div class="chips"><button class="btn" id="shareForm">🔗 Lead form</button><button class="btn" id="imp">⬆ CSV</button><button class="btn pri" id="addL">＋ Lead</button></div></div>
      <div class="grid g4" id="lstats"></div><div class="tabs" id="ltabs" style="margin-top:14px"><button class="on" data-t="board">Pipeline</button><button data-t="table">Table</button></div><div id="lpane">${loading()}</div>`;
    let leads = [], tabk = "board";
    $("#shareForm").onclick = () => shareSheet("Free website/app demo — form bharo", formUrl);
    $("#addL").onclick = () => leadForm();
    $("#imp").onclick = () => sheet(`<h3>CSV import</h3><p class="small muted">Har line: naam,phone,business,note</p><label class="field"><textarea id="csv" rows="7" placeholder="Ravi,9876543210,Ravi Mobile,app chahiye"></textarea></label><input type="file" id="csvf" accept=".csv,text/csv" class="inp"><div class="grid g2" style="margin-top:10px"><button class="btn" data-close>Cancel</button><button class="btn pri" id="go">Import</button></div>`, (s) => {
      $("#csvf", s).onchange = async (e) => { $("#csv", s).value = await e.target.files[0].text(); };
      $("#go", s).onclick = async () => { const rows = $("#csv", s).value.split(/\r?\n/).map((l) => l.split(",").map((x) => x.trim())).filter((r) => r[0] && !/^(naam|name)$/i.test(r[0])); try { await api("/api/leads", { action: "import", leads: rows.map(([name, phone, business, msg]) => ({ name, phone, business, msg, source: "csv" })) }); toast(rows.length + " leads import ✓"); closeSheet(); refresh(); } catch (e) { toast(e.message); } };
    });
    function leadForm(l) {
      sheet(`<h3>${l ? "Lead edit" : "＋ Naya lead"}</h3>${[["name", "Naam"], ["phone", "Phone"], ["business", "Business"], ["msg", "Note"]].map(([k, lab]) => `<label class="field"><span>${lab}</span><input data-k="${k}" value="${esc(l ? l[k] || "" : "")}"></label>`).join("")}<label class="field"><span>Stage</span><select data-k="status">${STAGES.concat([["lost", "❌ Lost"]]).map(([k, n]) => `<option value="${k}" ${l && l.status === k ? "selected" : ""}>${n}</option>`).join("")}</select></label><div class="grid g2"><button class="btn" data-close>Cancel</button><button class="btn pri" id="ok">Save</button></div>`, (s) => {
        $("#ok", s).onclick = async () => { const o = {}; $$("[data-k]", s).forEach((el) => (o[el.dataset.k] = el.value.trim())); if (!o.name) return toast("Naam likho"); try { await api("/api/leads", l ? { action: "update", id: l.id, patch: o } : { action: "add", lead: o }); closeSheet(); toast("Saved ✓"); refresh(); } catch (e) { toast(e.message); } };
      });
    }
    const wa = (l) => `https://wa.me/${(l.phone || "").replace(/\D/g, "").replace(/^(\d{10})$/, "91$1")}?text=${encodeURIComponent(`Namaste ${l.name} ji 🙏 Main Misbah (Misbah Digital, Govindpur). Aapke ${l.business || "business"} ke liye ek free app/website demo banaya hai — dekhna chahenge?`)}`;
    const stageSel = (l) => `<select class="btn sm" data-mv="${l.id}" aria-label="Stage">${STAGES.concat([["lost", "❌ Lost"]]).map(([k, n]) => `<option value="${k}" ${l.status === k ? "selected" : ""}>${n}</option>`).join("")}</select>`;
    const leadCard = (l) => `<div class="lead"><b>${esc(l.name)}</b><span class="tiny">${esc(l.business || "")} · ${esc(l.phone || "")}</span>${l.msg ? `<div class="small muted" style="margin-top:4px">${esc(String(l.msg).slice(0, 90))}</div>` : ""}<div class="acts"><a class="btn sm" target="_blank" rel="noopener" href="${wa(l)}" aria-label="WhatsApp">💬</a><a class="btn sm" href="tel:${esc(l.phone || "")}" aria-label="Call">📞</a>${stageSel(l)}<button class="btn sm" data-ed="${l.id}" aria-label="Edit">✏️</button></div></div>`;
    function render() {
      const by = (k) => leads.filter((l) => (l.status || "new") === k);
      $("#lstats").innerHTML = [["🎯", "Total leads", leads.length], ["🆕", "New", by("new").length], ["🔥", "Interested", by("interested").length], ["🤝", "Clients", by("client").length]].map(([i, l, n]) => `<div class="glass stat"><div class="ic">${i}</div><div class="lab">${l}</div><div class="val">${n}</div></div>`).join("");
      $$("#ltabs button").forEach((b) => b.classList.toggle("on", b.dataset.t === tabk));
      $("#lpane").innerHTML = tabk === "board" ? `<div class="board">${STAGES.map(([k, n]) => `<div class="glass col"><h4>${n}<span class="pill">${by(k).length}</span></h4>${by(k).map(leadCard).join("") || '<div class="tiny">Khaali</div>'}</div>`).join("")}</div>`
        : `<div class="glass card tbl"><table><thead><tr><th>Naam</th><th>Business</th><th>Phone</th><th>Stage</th><th>Source</th><th>Kab</th><th></th></tr></thead><tbody>${leads.map((l) => `<tr><td><b>${esc(l.name)}</b></td><td>${esc(l.business || "")}</td><td>${esc(l.phone || "")}</td><td>${pill(l.status || "new")}</td><td class="tiny">${esc(l.source || "")}</td><td class="tiny">${ago(l.at)}</td><td style="white-space:nowrap"><a class="btn sm" target="_blank" rel="noopener" href="${wa(l)}">💬</a> <button class="btn sm danger" data-del="${l.id}">🗑</button></td></tr>`).join("") || '<tr><td colspan="7" class="empty">Abhi koi lead nahi</td></tr>'}</tbody></table></div>`;
      $$("[data-mv]").forEach((el) => (el.onchange = async () => { await api("/api/leads", { action: "update", id: el.dataset.mv, patch: { status: el.value } }); toast("Stage update ✓"); refresh(); }));
      $$("[data-ed]").forEach((el) => (el.onclick = () => leadForm(leads.find((l) => l.id === el.dataset.ed))));
      $$("[data-del]").forEach((el) => (el.onclick = async () => { if (confirm("Delete?")) { await api("/api/leads", { action: "delete", id: el.dataset.del }); refresh(); } }));
    }
    $$("#ltabs button").forEach((b) => (b.onclick = () => { tabk = b.dataset.t; render(); }));
    async function refresh() { try { leads = await api("/api/leads"); render(); bust("/api/state"); } catch (e) { $("#lpane").innerHTML = errBox(e); } }
    refresh();
  };

  // ---------- Sites ----------
  const TYPE_E = { cafe: "🍽️", bakery: "🎂", salon: "💇", gym: "🏋️", coaching: "📚", shop: "🛍️" };
  P.sites = async (v) => {
    v.innerHTML = `<div class="ph"><div><span class="eyebrow">Misbah Digital Computer</span><h1>Clients & Sites</h1><p>Form bharo → GitHub Actions app banata hai → <b>misbah-sites</b> repo mein live → link Telegram pe. Sab free.</p></div></div>
      <div class="grid g2"><div class="glass card"><h3>＋ Naya client app</h3>
        <label class="field"><span>Business ka naam *</span><input id="sn" placeholder="Royal Bakers"></label>
        <div class="grid g2" style="gap:10px"><label class="field"><span>Type</span><select id="stype">${Object.keys(TYPE_E).map((x) => `<option>${x}</option>`).join("")}</select></label><label class="field"><span>Area</span><input id="sa" placeholder="Govindpur, Dhanbad"></label></div>
        <label class="field"><span>WhatsApp number (khaali = tumhara, demo ke liye)</span><input id="sp" inputmode="numeric" placeholder="98765 43210"></label>
        <label class="field"><span>Menu / rate / notes (optional — khaali = AI SAMPLE menu)</span><textarea id="so" placeholder="Choco cake 450, Pastry 50, Patties 30…"></textarea></label>
        <button class="btn pri block" id="sgo">🚀 App banao</button><div id="sres" class="small" style="margin-top:10px"></div></div>
        <div class="glass card"><h3>Site edit <small>phone / timing / rate</small></h3><label class="field"><span>Site</span><select id="es"></select></label><label class="field"><span>Kya badalna hai?</span><textarea id="ec" placeholder="phone 9123456789, timing 10 am se 9 pm, Veg Momos 70"></textarea></label><button class="btn block" id="ego">✏️ Update karo</button><div id="eres" class="small" style="margin-top:10px"></div>
        <p class="tiny" style="margin-top:12px">Telegram: <span class="code">/site Naam | type | area | phone</span> · <span class="code">/sites</span> · <span class="code">/site_edit slug badlav</span></p></div></div>
      <h3 style="margin:22px 0 10px">Client apps</h3><div class="grid g3" id="slist">${loading()}</div>`;
    $("#sgo").onclick = async () => {
      const b = { name: $("#sn").value.trim(), type: $("#stype").value, area: $("#sa").value.trim(), phone: $("#sp").value.trim(), notes: $("#so").value.trim() };
      if (!b.name) return toast("Business ka naam likho");
      $("#sgo").disabled = true; $("#sres").textContent = "⏳ Shuru…";
      try { const r = await api("/api/site", b); $("#sres").innerHTML = `✅ ${esc(r.message)} · <a href="${esc(r.progress)}" target="_blank" rel="noopener">progress</a>`; } catch (e) { $("#sres").textContent = "😕 " + e.message; }
      $("#sgo").disabled = false;
    };
    $("#ego").onclick = async () => { const slug = $("#es").value, change = $("#ec").value.trim(); if (!slug || !change) return toast("Site aur badlav likho"); try { const r = await api("/api/site-edit", { slug, change }); $("#eres").innerHTML = `✅ Edit shuru — 1-2 min mein live. <a href="${esc(r.progress)}" target="_blank" rel="noopener">progress</a>`; } catch (e) { $("#eres").textContent = "😕 " + e.message; } };
    const list = await sitesList();
    $("#es").innerHTML = list.map((s) => `<option value="${esc(s.slug)}">${esc(s.name)} (${esc(s.slug)})</option>`).join("");
    $("#slist").innerHTML = list.map((s) => `<div class="glass acard"><div class="hd"><div class="em">${TYPE_E[s.type] || "🌐"}</div><div style="flex:1;min-width:0"><b>${esc(s.name)}</b><div class="tiny">${esc(s.type)} · ${esc(s.area || "")}</div></div>${s.sample ? '<span class="pill warn">sample menu</span>' : '<span class="pill ok">real menu</span>'}</div><p class="small"><a href="${esc(s.url)}" target="_blank" rel="noopener" style="color:var(--acc3);word-break:break-all">${esc(s.url.replace("https://", ""))}</a></p><div class="tiny">${s.updated ? "Update " + ago(s.updated) : ""}${s.old_url ? " · purana link bhi live" : ""}</div><div class="ft"><a class="btn sm pri" target="_blank" rel="noopener" href="${esc(s.url)}">Kholo</a><button class="btn sm" data-qr="${esc(s.url)}" data-n="${esc(s.name)}">QR / Share</button><a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(s.name + " ka app 👉 " + s.url)}" aria-label="WhatsApp">💬</a></div></div>`).join("") || '<div class="empty">Abhi koi site nahi</div>';
    $$("[data-qr]").forEach((b) => (b.onclick = () => shareSheet(b.dataset.n + " — app", b.dataset.qr)));
  };

  // ---------- Reels ----------
  P.reels = async (v) => {
    v.innerHTML = `<div class="ph"><div><span class="eyebrow">Misbah Digital Computer</span><h1>Reel Studio</h1><p>Topic do ya "trending" — Gemini script, FREE Hindi AI voice, kinetic captions, beat. 1080×1920, 30-40 sec.</p></div></div>
      <div class="grid g2"><div class="glass card"><h3>Nayi reel</h3><label class="field"><span>Topic</span><input id="rt" placeholder="trending (Google Trends India) — ya: ChatGPT vs Gemini"></label>
        <label class="field"><span>Voice</span><select id="rv"><option value="hi-IN-MadhurNeural">Madhur (male)</option><option value="hi-IN-SwaraNeural">Swara (female)</option></select></label>
        <label class="chip" style="display:inline-flex;gap:6px;margin-bottom:12px"><input type="checkbox" id="rn" checked> Telegram pe bhejo</label>
        <button class="btn pri block" id="rgo">🎬 Reel banao (~4-6 min)</button><div id="rres" class="small" style="margin-top:10px"></div></div>
        <div class="glass card"><h3>Sach baat </h3><ul class="small muted" style="padding-left:18px;margin:0;line-height:1.7"><li>Free voice achhi hai, par ElevenLabs jaisi natural nahi.</li><li>Music khud generate hota hai (copyright-free beat) — voice hamesha ~15 dB upar.</li><li>GitHub Actions free minutes lagte hain (private repo: 2000 min/month) — ek reel ≈ 3-5 min.</li><li>Trending mein religion / politics / hadsa wale topics automatic skip.</li></ul></div></div>
      <h3 style="margin:22px 0 10px">Bani hui reels</h3><div class="grid g3" id="rlist">${loading()}</div>`;
    $("#rgo").onclick = async () => { $("#rgo").disabled = true; try { const r = await api("/api/reel", { topic: $("#rt").value.trim() || "trending", voice: $("#rv").value, notify: $("#rn").checked }); $("#rres").innerHTML = `✅ Ban rahi hai — 4-6 min. <a href="${esc(r.progress)}" target="_blank" rel="noopener">progress</a>`; } catch (e) { $("#rres").textContent = "😕 " + e.message; } $("#rgo").disabled = false; };
    try {
      const reels = await cached("/api/reels", 30000);
      $("#rlist").innerHTML = reels.map((r) => { const mp4 = (r.assets || []).find((a) => /\.mp4$/.test(a.name)); return `<div class="glass acard"><div class="hd"><div class="em">🎬</div><div style="flex:1;min-width:0"><b>${esc(String(r.title).replace(/^🎬\s*/, ""))}</b><div class="tiny">${fmtD(r.at)}${mp4 ? " · " + (mp4.size / 1e6).toFixed(1) + " MB" : ""}</div></div></div><p class="small" style="white-space:pre-line;margin:0">${esc(String(r.notes).split("\n").slice(0, 2).join("\n"))}</p><div class="ft">${mp4 ? `<button class="btn sm pri" data-dl="${mp4.id}">⬇ Download</button>` : ""}<a class="btn sm" href="${esc(r.url)}" target="_blank" rel="noopener">GitHub</a></div></div>`; }).join("") || '<div class="empty"><div class="e">🎬</div>Abhi koi reel nahi — upar se banao</div>';
      $$("[data-dl]").forEach((b) => (b.onclick = async () => { try { const r = await api("/api/asset?id=" + b.dataset.dl); location.href = r.url; } catch (e) { toast(e.message); } }));
    } catch (e) { $("#rlist").innerHTML = errBox(e); }
  };

  P.edit = (v) => {
    v.innerHTML = `<div class="ph"><div><span class="eyebrow">Misbah Digital Computer</span><h1>Video Edit (Smart)</h1><p>Khamoshi kaat + zoom punch-in + Roman Hinglish captions + beat — free, GitHub Actions pe.</p></div></div>
      <div class="grid g2"><div class="glass card"><h3>Sabse aasaan: Telegram</h3><ol class="small muted" style="padding-left:18px;line-height:1.8"><li>Bot ko video bhejo (20 MB tak)</li><li>Caption likho: <span class="code">edit: captions + music</span></li><li>3-6 min mein edited video wapas</li></ol><p class="tiny">Options: captions · music · reel (9:16 blur background) · no cut · no zoom · english</p></div>
      <div class="glass card"><h3>Link se</h3><label class="field"><span>Video link (Drive "anyone with link" / mp4)</span><input id="vl" placeholder="https://drive.google.com/…"></label><div class="chips" style="margin-bottom:12px">${["captions", "music", "reel", "no cut", "no zoom"].map((o, i) => `<label class="chip"><input type="checkbox" data-o="${o}" ${i < 2 ? "checked" : ""}> ${o}</label>`).join("")}</div><button class="btn pri block" id="vgo">✂️ Edit karo</button><div id="vres" class="small" style="margin-top:10px;white-space:pre-line"></div></div></div>
      <div class="glass card" style="margin-top:14px"><h3>Sirf trim + text</h3><p class="small muted">Telegram: <span class="code">video trim &lt;link&gt; 0:05 0:20 caption: Rainy ride</span></p></div>`;
    $("#vgo").onclick = async () => { const url = $("#vl").value.trim(); if (!/^https?:\/\//.test(url)) return toast("Video link do"); const opts = $$("[data-o]").filter((c) => c.checked).map((c) => c.dataset.o).join(" "); try { const r = await api("/api/chat", { text: `/edit ${url} ${opts}` }); $("#vres").textContent = r.reply; } catch (e) { $("#vres").textContent = "😕 " + e.message; } };
  };

  P.files = (v) => {
    const R = "https://github.com/" + CFG.REPO;
    v.innerHTML = `<div class="ph"><div><span class="eyebrow">Misbah Digital Computer</span><h1>Files</h1><p>Tumhari "hard disk" = GitHub. Sab yahin se khulta hai.</p></div></div><div class="grid g3">${[
      ["🧾", "Tasks log", "data/tasks-log.json", R + "/blob/main/data/tasks-log.json"], ["⏰", "Reminders", "data/reminders.json", R + "/blob/main/data/reminders.json"], ["📝", "Notes", "data/notes.json", R + "/blob/main/data/notes.json"],
      ["🎯", "Leads", "data/leads.json", R + "/blob/main/data/leads.json"], ["⚡", "Automations", "data/automations.json", R + "/blob/main/data/automations.json"], ["🎬", "Reels (downloads)", "GitHub Releases", R + "/releases"],
      ["🏗️", "Client apps", "misbah-sites repo", "https://github.com/" + CFG.OWNER + "/misbah-sites"], ["🍽️", "App template", "clients/_template-cafe", R + "/tree/main/clients/_template-cafe"], ["💻", "Agents code", "src/agents", R + "/tree/main/src/agents"],
      ["📖", "How to use", "docs/HOW-TO-USE.md", R + "/blob/main/docs/HOW-TO-USE.md"], ["⚙️", "Workflows", ".github/workflows", R + "/tree/main/.github/workflows"], ["📁", "Projects (coding agent)", "projects/", R + "/tree/main/projects"],
    ].map(([e, n, p, u]) => `<a class="glass acard" href="${u}" target="_blank" rel="noopener"><div class="hd"><div class="em">${e}</div><div><b>${n}</b><div class="tiny">${p}</div></div></div></a>`).join("")}</div><p class="tiny" style="margin-top:12px">Private repo ki files kholne ke liye phone pe GitHub login hona chahiye.</p>`;
  };

  P.reminders = (v) => {
    v.innerHTML = `<div class="ph"><div><span class="eyebrow">Misbah Digital Computer</span><h1>Reminders & Notes</h1><p>Time aate hi Telegram pe yaad dilata hai (IST).</p></div></div><div class="grid g2"><div class="glass card"><h3>Reminders</h3><div style="display:flex;gap:8px;margin-bottom:10px"><input class="inp" id="rin" placeholder="kal 7 baje padhai / 30 min baad chai"><button class="btn pri" id="radd" aria-label="Add">＋</button></div><div class="list" id="rl">${loading()}</div></div>
      <div class="glass card"><h3>Notes</h3><div style="display:flex;gap:8px;margin-bottom:10px"><input class="inp" id="nin" placeholder="Aura client ka number save karna"><button class="btn pri" id="nadd" aria-label="Add">＋</button></div><div class="list" id="nl">${loading()}</div></div></div>`;
    const loadR = async () => { const r = await api("/api/reminders"); $("#rl").innerHTML = r.filter((x) => !x.done).map((x) => `<div class="row"><div class="em">⏰</div><div class="t"><b>${esc(x.text)}</b><span>${fmtD(x.due)}${x.repeat ? " · " + esc(x.repeat) : ""}</span></div><button class="btn sm" data-rd="${x.id}" aria-label="Done">✓</button><button class="btn sm danger" data-rx="${x.id}" aria-label="Delete">🗑</button></div>`).join("") || '<div class="empty">Koi reminder nahi</div>'; $$("[data-rd]").forEach((b) => (b.onclick = async () => { await api("/api/reminders", { action: "done", id: +b.dataset.rd }); loadR(); })); $$("[data-rx]").forEach((b) => (b.onclick = async () => { await api("/api/reminders", { action: "delete", id: +b.dataset.rx }); loadR(); })); };
    const loadN = async () => { const n = await api("/api/notes"); $("#nl").innerHTML = n.slice().reverse().map((x) => `<div class="row"><div class="em">📝</div><div class="t"><b>${esc(x.text)}</b><span>${fmtD(x.at)}</span></div><button class="btn sm danger" data-nx="${x.id}" aria-label="Delete">🗑</button></div>`).join("") || '<div class="empty">Koi note nahi</div>'; $$("[data-nx]").forEach((b) => (b.onclick = async () => { await api("/api/notes", { action: "delete", id: +b.dataset.nx }); loadN(); })); };
    $("#radd").onclick = async () => { const x = $("#rin").value.trim(); if (!x) return; try { const r = await api("/api/reminders", { action: "add", text: x }); toast(String(r.reply).split("\n")[0]); $("#rin").value = ""; loadR(); } catch (e) { toast(e.message); } };
    $("#nadd").onclick = async () => { const x = $("#nin").value.trim(); if (!x) return; await api("/api/notes", { action: "add", text: x }); $("#nin").value = ""; loadN(); };
    loadR().catch((e) => ($("#rl").innerHTML = errBox(e))); loadN().catch((e) => ($("#nl").innerHTML = errBox(e)));
  };

  P.logs = async (v) => {
    v.innerHTML = `<div class="ph"><div><span class="eyebrow">Misbah Digital Computer</span><h1>Logs / Workflow runs</h1><p>GitHub Actions ka har kaam · workflows ON/OFF · manual run.</p></div><button class="btn" id="rf">↻ Refresh</button></div><div class="grid g2"><div class="glass card"><h3>Recent runs</h3><div class="list" id="lr">${loading()}</div></div><div class="glass card"><h3>Workflows</h3><div class="list" id="lw">${loading()}</div></div></div>`;
    $("#rf").onclick = () => { bust("/api/runs", "/api/workflows"); P.logs(v); };
    try { const r = await cached("/api/runs", 15000); $("#lr").innerHTML = r.map((x) => `<a class="row" href="${esc(x.url)}" target="_blank" rel="noopener"><div class="em">${runIcon(x)}</div><div class="t"><b>${esc(x.name)}</b><span>${esc(x.title || "")} · ${esc(x.event)} · ${fmtD(x.at)}</span></div>${pill(x.conclusion || x.status)}</a>`).join(""); } catch (e) { $("#lr").innerHTML = errBox(e); }
    try { const w = await cached("/api/workflows", 60000); $("#lw").innerHTML = w.map((x) => `<div class="row"><div class="em">⚙️</div><div class="t"><b>${esc(x.name)}</b><span>${esc(x.file)}</span></div>${pill(x.state)}<button class="btn sm" data-wt="${esc(x.file)}" data-on="${x.state === "active" ? 0 : 1}">${x.state === "active" ? "OFF" : "ON"}</button>${/deploy-worker|daily-briefing/.test(x.file) ? `<button class="btn sm" data-wr="${esc(x.file)}" aria-label="Run">▶</button>` : ""}</div>`).join("");
      $$("[data-wt]").forEach((b) => (b.onclick = async () => { await api("/api/workflow/toggle", { file: b.dataset.wt, enable: b.dataset.on === "1" }); toast("Done ✓"); bust("/api/workflows"); P.logs(v); }));
      $$("[data-wr]").forEach((b) => (b.onclick = async () => { await api("/api/workflow/run", { file: b.dataset.wr }); toast("Run shuru ✓"); }));
    } catch (e) { $("#lw").innerHTML = errBox(e); }
  };

  P.analytics = async (v) => {
    v.innerHTML = `<div class="ph"><div><span class="eyebrow">Misbah Digital Computer</span><h1>Analytics</h1><p>Tumhare computer ka kaam — numbers mein.</p></div></div><div id="an">${loading()}</div>`;
    try {
      const [st, sites] = await Promise.all([cached("/api/state"), sitesList()]);
      let reels = []; try { reels = await cached("/api/reels", 60000); } catch (e) {}
      const log = st.log || [];
      const days = [...Array(7)].map((_, i) => { const d = new Date(Date.now() - (6 - i) * 864e5); return { k: d.toDateString(), n: d.toLocaleDateString("en-IN", { weekday: "short" }) }; });
      const per = days.map((d) => log.filter((x) => new Date(x.at).toDateString() === d.k).length); const mx = Math.max(1, ...per);
      const byA = {}; log.forEach((x) => (byA[x.agent] = (byA[x.agent] || 0) + 1)); const ma = Math.max(1, ...Object.values(byA));
      const ls = st.leadsByStatus || {}; const ml = Math.max(1, ...Object.values(ls));
      const bt = sites.reduce((a, s) => ((a[s.type] = (a[s.type] || 0) + 1), a), {});
      $("#an").innerHTML = `<div class="grid g4">${[["🧾", "Tasks (recent)", log.length], ["🏗️", "Client apps", sites.length], ["🎬", "Reels", reels.length], ["🎯", "Leads", st.leads || 0]].map(([i, l, n]) => `<div class="glass stat"><div class="ic">${i}</div><div class="lab">${l}</div><div class="val">${n}</div></div>`).join("")}</div>
        <div class="grid g2" style="margin-top:14px"><div class="glass card"><h3>Tasks — last 7 din</h3><div class="bars">${per.map((n, i) => `<div style="height:${(n / mx) * 100}%"><i>${n}</i><span>${days[i].n}</span></div>`).join("")}</div><div style="height:22px"></div></div>
        <div class="glass card"><h3>Agents usage</h3>${Object.entries(byA).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<div class="hbar"><span style="width:90px">${esc(k)}</span><div class="b"><i style="width:${(n / ma) * 100}%"></i></div><b>${n}</b></div>`).join("") || '<div class="empty">Data nahi</div>'}</div>
        <div class="glass card"><h3>Leads pipeline</h3>${STAGES.concat([["lost", "❌ Lost"]]).map(([k, n]) => `<div class="hbar"><span style="width:110px">${n}</span><div class="b"><i style="width:${((ls[k] || 0) / ml) * 100}%"></i></div><b>${ls[k] || 0}</b></div>`).join("")}</div>
        <div class="glass card"><h3>Apps by type</h3>${Object.entries(bt).map(([k, n]) => `<div class="hbar"><span style="width:90px">${TYPE_E[k] || ""} ${esc(k)}</span><div class="b"><i style="width:${(n / Math.max(1, sites.length)) * 100}%"></i></div><b>${n}</b></div>`).join("") || '<div class="empty">Abhi koi site nahi</div>'}</div></div>`;
    } catch (e) { $("#an").innerHTML = errBox(e); }
  };

  // ---------- Settings ----------
  let deferredInstall = null;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferredInstall = e; });
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  P.settings = async (v) => {
    const p = LS.get("profile", {}) || {};
    const appUrl = CFG.SITES_BASE + "computer-v2/";
    v.innerHTML = `<div class="ph"><div><span class="eyebrow">Misbah Digital Computer</span><h1>Settings</h1><p>Theme, language, app install / share, profile, API status.</p></div></div>
      <div class="grid g2"><div class="glass card"><h3>Look & language</h3>
        <div class="row"><div class="t"><b>Dark mode</b><span>Olive-dark ya cream-light</span></div><input type="checkbox" id="sdark" ${prefs.theme === "dark" ? "checked" : ""} aria-label="Dark mode"></div>
        <div class="row"><div class="t"><b>Language</b><span>Menu ki bhasha</span></div><select class="btn sm" id="slang" aria-label="Language"><option value="hi" ${prefs.lang === "hi" ? "selected" : ""}>Hinglish</option><option value="en" ${prefs.lang === "en" ? "selected" : ""}>English</option></select></div>
        <h3 style="margin-top:18px">App</h3>
        <div class="grid g2"><button class="btn pri" id="inst">📲 App install karo</button><button class="btn" id="shr">🔗 App share karo</button></div>
        <p class="tiny" id="instNote" style="margin-top:8px"></p></div>
        <div class="glass card"><h3>Profile <small>right panel mein dikhta hai</small></h3>
        ${[["name", "Naam"], ["title", "Title"], ["handle", "Insta handle"], ["city", "Shehar"], ["avatar", "Avatar (1-2 letter / emoji)"]].map(([k, l]) => `<label class="field"><span>${l}</span><input data-p="${k}" value="${esc(p[k] || "")}"></label>`).join("")}
        <button class="btn pri block" id="psave">Save profile</button></div>
        <div class="glass card"><h3>API status</h3><div class="list" id="apist">${loading()}</div></div>
        <div class="glass card"><h3>ℹ️ About</h3><p class="small muted">Misbah Digital Computer v${CFG.VERSION} — 1 Brain (Gemini) + many Agents. Sab tumhare GitHub mein, free services pe (GitHub Actions + Pages, Cloudflare Worker, Gemini free tier).</p><p class="tiny">Dashboard key sirf is phone/browser ke localStorage mein save hai — kahin aur nahi.</p><div class="grid g2"><a class="btn" href="#/help">❓ Help</a><button class="btn danger" id="lout">🚪 Logout</button></div></div></div>`;
    $("#sdark").onchange = (e) => { prefs.theme = e.target.checked ? "dark" : "light"; LS.set("prefs2", prefs); applyTheme(); };
    $("#slang").onchange = (e) => { prefs.lang = e.target.value; LS.set("prefs2", prefs); shell(); route(); };
    const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
    $("#instNote").textContent = standalone ? "✅ App already install hai." : isIOS ? "iPhone: Safari mein Share ⬆ → 'Add to Home Screen'." : "Chrome menu ⋮ → 'Install app' bhi kar sakte ho.";
    $("#inst").onclick = async () => {
      if (deferredInstall) { deferredInstall.prompt(); const r = await deferredInstall.userChoice; toast(r.outcome === "accepted" ? "Install ho raha hai 🎉" : "Baad mein sahi"); deferredInstall = null; return; }
      sheet(`<h3>App install</h3>${isIOS ? "<p>1. Safari mein ye page kholo<br>2. Neeche <b>Share ⬆</b> dabao<br>3. <b>Add to Home Screen</b> → Add</p>" : "<p>Chrome mein upar <b>⋮ menu → Install app / Add to Home screen</b> dabao.</p>"}<p class="tiny">${standalone ? "✅ Already installed." : ""}</p><button class="btn block" data-close>OK</button>`);
    };
    $("#shr").onclick = () => shareSheet("Misbah Digital Computer", appUrl);
    $("#psave").onclick = async () => { const o = {}; $$("[data-p]").forEach((el) => (o[el.dataset.p] = el.value.trim())); try { const r = await api("/api/profile", { profile: o }); LS.set("profile", r.profile); bust("/api/profile"); toast("Profile saved ✓"); rightPanel(); } catch (e) { toast(e.message); } };
    $("#lout").onclick = () => { if (confirm("Logout?")) logout(); };
    try { const a = await cached("/api/apps", 60000); $("#apist").innerHTML = `<div class="row"><div class="t"><b>Worker</b><span>${esc(CFG.WORKER_URL)}</span></div><span class="pill ok">online</span></div><div class="row"><div class="t"><b>Repo</b><span>${esc(a.repo || CFG.REPO)}</span></div></div><div class="row"><div class="t"><b>Brain models</b><span>${esc((a.models || []).join(", "))}</span></div></div>` + Object.entries(a.secrets || {}).map(([k, on]) => `<div class="row"><div class="t"><b class="code">${k}</b></div>${on ? '<span class="pill ok">set</span>' : '<span class="pill">not set</span>'}</div>`).join(""); } catch (e) { $("#apist").innerHTML = errBox(e); }
  };

  P.help = (v) => {
    const cmds = [["/site Naam | type | area | phone | notes", "Client app banao (cafe, bakery, salon, gym, coaching, shop)"], ['"Kanak jaisa cafe app banao X ke liye"', "Normal Hinglish bhi chalta hai"], ["/sites", "Saare client apps"], ["/site_edit slug phone 98…, timing 10 am se 9 pm", "Site update"], ["/reel trending", "Trending topic pe reel"], ["/reel ChatGPT vs Gemini", "Topic pe reel (female: /reel female …)"], ["Video bhejo + caption: edit: captions + music", "Smart edit"], ["video trim <link> 0:05 0:20 caption: …", "Trim + text"], ["research karo …", "Web research + sources"], ["code likho …", "Code → GitHub commit"], ["caption do …", "Insta caption + hashtags"], ["yaad dilana kal 7 baje padhai", "Reminder (IST)"], ["note: …  /  notes dikhao", "Notes"], ["briefing do", "Aaj ka plan"]];
    v.innerHTML = `<div class="ph"><div><span class="eyebrow">Misbah Digital Computer</span><h1>Help / Docs</h1><p>Telegram commands + dashboard pages. Poori guide: <a style="color:var(--acc3)" target="_blank" rel="noopener" href="https://github.com/${CFG.REPO}/blob/main/docs/HOW-TO-USE.md">docs/HOW-TO-USE.md</a></p></div></div>
      <div class="glass card"><h3>Telegram commands</h3><div class="list">${cmds.map(([c, d]) => `<div class="row"><div class="t"><b class="code" style="white-space:normal">${esc(c)}</b><span>${esc(d)}</span></div></div>`).join("")}</div></div>
      <div class="grid g2" style="margin-top:14px"><div class="glass card"><h3>Pages</h3><div class="list">${NAV.flatMap(([, it]) => it).map(([k, i]) => `<a class="row" href="#/${k}"><div class="em">${i}</div><div class="t"><b>${t(k)}</b></div></a>`).join("")}</div></div>
      <div class="glass card"><h3>Free limits</h3><ul class="small muted" style="padding-left:18px;line-height:1.8"><li>Cloudflare Worker: 100k requests/din</li><li>GitHub Actions (private repo): 2000 min/month — reel ≈ 4 min, site ≈ 1-2 min</li><li>GitHub Pages: public repo (misbah-sites), 1 GB</li><li>Gemini: free tier ki daily limit — fail ho to agla model try hota hai</li><li>Telegram bot: video 50 MB bhej sakta hai, 20 MB tak download</li></ul></div></div>`;
  };

  // ---------- login / router ----------
  function loginView(msg) {
    const I = window.ic;
    document.body.innerHTML = `<div class="login"><section class="login-art"><div><span class="eyebrow">Misbah Digital · Computer</span></div>
      <div><h2>1 Brain. <em>Many agents.</em> Ek shaant jagah.</h2><p style="margin-top:18px">Client apps, reels, leads, invoices aur automations — Telegram se bhi, yahan se bhi.</p></div>
      <div class="tiny la-foot" style="color:#CFCFBE">GitHub + Cloudflare + Gemini · free</div></section>
      <section class="login-side"><div class="box"><div class="mark">M</div><span class="eyebrow">Welcome back</span><h1 style="margin-top:8px">Login karo</h1><p>Apni DASHBOARD_KEY daalo — wahi jo Worker /setup ke liye use karte ho.</p>
      <form id="lf"><label class="field"><span>Dashboard key</span><input id="lk" type="password" autocomplete="current-password" placeholder="••••••••" required></label><button class="btn pri block" id="lb">Login <span class="arw">${I("arrow-right")}</span></button></form><div class="err" id="le">${esc(msg || "")}</div>
      <button class="btn block" id="demo">${I("eye")} Demo dekho (sample data)</button>
      <p class="tiny" style="margin-top:22px">Key sirf is browser mein save hoti hai. Bhool gaye? GitHub → Settings → Secrets → DASHBOARD_KEY naya set karo → Deploy Worker run.</p></div></section></div><div id="toast"></div>`;
    $("#lf").onsubmit = async (e) => {
      e.preventDefault(); const k = $("#lk").value.trim(); if (!k) return;
      $("#lb").disabled = true; $("#le").textContent = "";
      try { await api("/api/login", null, { key: k }); KEY = k; LS.set("key", k); DEMO = false; LS.del("demo"); location.hash = "#/home"; boot(); }
      catch (err) { $("#le").textContent = err.status === 401 ? "Key galat hai — dobara check karo" : err.message; $("#lb").disabled = false; }
    };
    $("#demo").onclick = () => { DEMO = true; LS.set("demo", true); location.hash = "#/home"; boot(); };
  }
  function logout() { KEY = ""; LS.del("key"); LS.del("demo"); DEMO = false; Object.keys(cache).forEach((k) => delete cache[k]); location.hash = "#/login"; loginView(); }
  function route() {
    const k = (location.hash.replace(/^#\/?/, "").split("/")[0]) || "home";
    if (k === "login") { if (!KEY && !DEMO) return loginView(); location.hash = "#/home"; return; }
    if (!P[k]) { location.hash = "#/home"; return; }
    $$(".nav a, .bottom-nav a").forEach((a) => a.classList.toggle("on", a.dataset.k === k));
    moveInd();
    closeCmdk();
    const v = $("#view"); v.classList.remove("enter"); v.innerHTML = ""; window.scrollTo(0, 0); void v.offsetWidth; v.classList.add("enter");
    Promise.resolve(P[k](v)).catch((e) => (v.innerHTML = errBox(e)));
    document.title = t(k) + " — Misbah Digital Computer";
  }
  function moveInd() {
    const ind = $("#navInd"), on = $(".nav a.on"); if (!ind) return;
    if (!on) { ind.style.opacity = 0; return; }
    ind.style.opacity = 1; ind.style.height = on.offsetHeight + "px"; ind.style.transform = `translateY(${on.offsetTop}px)`;
  }
  window.addEventListener("resize", () => moveInd());
  function boot() {
    applyTheme();
    if (!KEY && !DEMO) { loginView(); return; }
    shell(); route();
  }
  window.addEventListener("hashchange", () => { if (KEY || DEMO) { if (!$("#view")) shell(); route(); } else loginView(); });
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
  boot();
})();
