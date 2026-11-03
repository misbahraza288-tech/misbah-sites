/* Misbah HQ — dashboard (vanilla JS). Data: Worker /api/hq (header x-key = DASHBOARD_KEY).
   Key sirf is browser ke localStorage ("mdc_key", wahi jo Computer dashboard use karta hai). Koi secret is file me nahi. */
(function () {
  "use strict";
  var CFG = window.HQ_CONFIG || {};
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var rs = function (n) { return "₹" + Number(n || 0).toLocaleString("en-IN"); };
  var LS = { get: function (k) { try { return JSON.parse(localStorage.getItem("mdc_" + k)); } catch (e) { return null; } }, set: function (k, v) { localStorage.setItem("mdc_" + k, JSON.stringify(v)); } };
  var KEY = LS.get("key") || "";
  var D = null;
  var I = {
    crown: '<path d="M4 18h16M5 18 4 8l5 4 3-6 3 6 5-4-1 10"/>', radar: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 12l5-5"/>',
    bulb: '<path d="M9 18h6M10 21h4M8 14a5 5 0 1 1 8 0c-1 1-1.5 2-1.5 3h-5C9.5 16 9 15 8 14z"/>', target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
    pen: '<path d="M4 20l4-1L19 8l-3-3L5 16z"/><path d="M14 7l3 3"/>', palette: '<path d="M12 4a8 8 0 1 0 0 16c1 0 1.5-.8 1.2-1.6-.4-1 .3-2 1.4-2H17a3 3 0 0 0 3-3c0-5-3.6-9.4-8-9.4z"/><circle cx="8" cy="11" r="1"/><circle cx="11" cy="7.5" r="1"/><circle cx="15.5" cy="8.5" r="1"/>',
    code: '<path d="M9 8l-4 4 4 4M15 8l4 4-4 4"/>', film: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 5v14M16 5v14M4 9h4M16 9h4M4 15h4M16 15h4"/>',
    rocket: '<path d="M12 15l-3-3c1.5-4 4.5-7 9-8-1 4.5-4 7.5-6 9z"/><path d="M9 12l-3 1-2 3 4-1M12 15l-1 3-3 2 1-4"/>', shield: '<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
    wallet: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M16 12h3M3 9h18"/>', today: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>',
    check: '<path d="M5 12l4 4 10-10"/>', team: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14c2.8.3 5 2.6 5 5.5"/>',
    pipe: '<path d="M4 6h16l-6 7v6l-4-2v-4z"/>', list: '<path d="M9 6h11M9 12h11M9 18h11M4 6h1M4 12h1M4 18h1"/>', pulse: '<path d="M3 12h4l3-7 4 14 3-7h4"/>',
    chat: '<path d="M4 5h16v11H8l-4 4z"/>', play: '<path d="M7 5l12 7-12 7z"/>', pause: '<path d="M8 5v14M16 5v14"/>', ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'
  };
  var icon = function (n) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (I[n] || I.list) + "</svg>"; };
  var ago = function (iso) { if (!iso) return ""; var s = (Date.now() - new Date(iso)) / 1000; if (s < 60) return "abhi"; if (s < 3600) return Math.floor(s / 60) + " min"; if (s < 86400) return Math.floor(s / 3600) + " ghante"; return Math.floor(s / 86400) + " din"; };
  var fmt = function (iso) { return iso ? new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "—"; };
  var BOTS = { father: "Father Bot", trend: "Trend Scout", idea: "Idea Maker", lead: "Lead Hunter", sales: "Sales Writer", designer: "Designer", coder: "Coder", content: "Content Maker", mxa: "Mxa Growth", qa: "QA", finance: "Finance", misbah: "Misbah" };
  var STAGE = { found: "Found", drafted: "Draft ready", pitched: "Pitched", talking: "Chat chal rahi", deal: "Deal fix", advance_paid: "Advance paid", delivering: "Ban raha", ready: "Ready (QA ok)", delivered: "Delivered", done: "Done", skipped: "Chhoda", lost: "Lost" };

  function toast(m) { var t = $("#toast"); t.textContent = m; t.style.display = "block"; clearTimeout(toast.t); toast.t = setTimeout(function () { t.style.display = "none"; }, 4200); }
  function api(path, body) {
    return fetch(CFG.WORKER_URL + path, { method: body ? "POST" : "GET", headers: Object.assign({ "x-key": KEY }, body ? { "content-type": "application/json" } : {}), body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || j.ok === false) { var e = new Error(j.error || ("HTTP " + r.status)); e.status = r.status; throw e; } return j; }); });
  }

  var SECTIONS = [["today", "Today", "today"], ["approvals", "Approvals", "check"], ["team", "Team", "team"], ["pipeline", "Leads", "pipe"], ["money", "Money", "wallet"], ["ideas", "Ideas", "bulb"], ["tasks", "Tasks", "list"], ["activity", "Activity", "pulse"], ["mxa", "Mxa growth", "rocket"]];
  function nav() {
    $("#tabs").innerHTML = SECTIONS.map(function (s) { var n = s[0] === "approvals" && D && D.approvals.length ? ' <span class="n">' + D.approvals.length + "</span>" : ""; return '<a href="#' + s[0] + '">' + icon(s[2]) + "<span>" + s[1] + "</span>" + n + "</a>"; }).join("");
  }

  function render() {
    var d = D, app = $("#app");
    var st = $("#status"); st.classList.toggle("paused", !!d.paused);
    $("#statusText").textContent = (d.paused ? "Paused" : "Team active") + " · Meeting " + (d.last_meeting ? fmt(d.last_meeting.at) : "abhi nahi");
    nav();
    var m = d.minutes || {}, h = [];
    if (!d.upi_ready) h.push('<div class="warnbar span12">UPI_ID set nahi hai — advance ka payment link tab banega. GitHub → Settings → Secrets and variables → Actions → Variables → <b>UPI_ID</b>, phir Actions → Deploy Worker → Run.</div>');
    // Today
    h.push('<section class="card span8" id="today"><h2>' + icon("today") + "Today's meeting<span class=\"r mut\">" + (d.last_meeting ? esc(d.last_meeting.date) + (d.last_meeting.dry_run ? " · test run" : "") : "") + "</span></h2>" +
      (d.last_meeting ? '<div class="summary">' + esc(d.last_meeting.summary || m.summary || "") + "</div>" : '<p class="empty">Abhi koi meeting nahi hui. Roz 7:30 AM apne aap, ya abhi chalao.</p>') +
      (m.top_ideas && m.top_ideas.length ? '<h3 class="small mut" style="margin:14px 0 6px">TOP IDEAS</h3><ul class="list">' + m.top_ideas.map(function (i) { return '<li class="row"><span class="ic">' + icon("bulb") + '</span><div class="grow"><b>' + esc(i.title) + "</b><p>" + esc(i.why || "") + ' <span class="tag">' + esc(BOTS[i.owner] || i.owner || "") + "</span></p></div></li>"; }).join("") + "</ul>" : "") +
      (m.risks && m.risks.length ? '<p class="note">Risk: ' + m.risks.map(esc).join(" · ") + "</p>" : "") +
      '<div class="meta"><span>Chair: Father Bot</span><span>Leads aaj: ' + ((m.new_leads || []).length) + "</span><span>Pitch bheje aaj: " + d.outreach_today + "/" + d.max_outreach + '</span></div><div class="acts" style="margin-top:12px"><button class="btn primary sm" data-act="meeting">' + icon("play") + "Run meeting now</button>" +
      '<button class="btn sm" data-act="' + (d.paused ? "resume" : "pause") + '">' + icon(d.paused ? "play" : "pause") + (d.paused ? "Resume team" : "Pause team") + "</button></div></section>");
    // Money (KPIs)
    var mo = d.money || {};
    h.push('<section class="card span4" id="money"><h2>' + icon("wallet") + 'Money<span class="r mut small">sirf asli</span></h2><div class="kpis">' +
      '<div class="kpi big"><small>Received (confirmed)</small><b>' + rs(mo.received) + "</b></div>" +
      '<div class="kpi"><small>Is mahine</small><b>' + rs(mo.thisMonth) + '</b></div><div class="kpi"><small>Pending</small><b>' + rs(mo.pending) + "</b></div>" +
      '<div class="kpi"><small>Advance pending</small><b>' + rs(mo.pendingAdvance) + '</b></div><div class="kpi est"><small>Estimate (kamai nahi)</small><b>' + rs(mo.estimatePipeline) + "</b></div></div>" +
      '<p class="note">Received me sirf wo paisa jo tumne [Paisa aa gaya] dabake confirm kiya. Estimate = bheje gaye quotes, abhi kamai nahi. Koi guarantee nahi.</p>' +
      ((d.payments || []).length ? '<ul class="list" style="margin-top:10px">' + d.payments.slice(0, 6).map(function (p) { return '<li class="row"><div class="grow"><b>' + rs(p.amount) + " · " + esc(p.client) + "</b><p>" + esc(p.kind) + " · " + fmt(p.at) + "</p></div></li>"; }).join("") + "</ul>" : '<p class="empty">Abhi koi payment nahi aayi.</p>') + "</section>");
    // Approvals
    h.push('<section class="card span12" id="approvals"><h2>' + icon("check") + 'Approvals waiting<span class="r mut">' + d.approvals.length + "</span></h2>" + (d.approvals.length ? d.approvals.map(apprHtml).join("") : '<p class="empty">Kuch approve karna baaki nahi.</p>') +
      '<p class="note">✅ Bhejo dabane pe WhatsApp link khulta hai — message tum khud Send karte ho. Bot kisi ko automatic message nahi karta. Din me max ' + d.max_outreach + " pitch.</p></section>");
    // Team
    h.push('<section class="card span6" id="team"><h2>' + icon("team") + 'Team<span class="r mut">' + d.team.length + ' bots</span></h2><ul class="list">' + d.team.map(function (t) {
      return '<li class="row"><span class="ic">' + icon(t.icon) + '</span><div class="grow"><b>' + esc(t.name) + ' <span class="tag ' + (t.status === "active" ? "ok" : "warn") + '">' + esc(t.status || "") + "</span></b><p>" + esc(t.role) + "</p>" + (t.last_action ? '<p style="color:#cfd5de">' + esc(t.last_action) + ' <span class="mut">· ' + ago(t.last_at) + "</span></p>" : "") + "</div></li>"; }).join("") + "</ul></section>");
    // Activity
    h.push('<section class="card span6 feed" id="activity"><h2>' + icon("pulse") + 'Activity<span class="r mut">har action, har rupaya</span></h2><ul class="list">' + (d.activity.length ? d.activity.slice(0, 40).map(function (a) {
      return '<li class="row"><div class="grow"><b class="small">' + esc(BOTS[a.bot] || a.bot) + (a.amount ? ' · <span style="color:var(--ok)">' + rs(a.amount) + "</span>" : "") + "</b><p>" + esc(a.text) + "</p></div><time>" + fmt(a.at) + "</time></li>"; }).join("") : '<li class="empty">Abhi kuch nahi.</li>') + "</ul></section>");
    // Pipeline
    var byId = {}; d.leads.forEach(function (l) { byId[l.id] = l; });
    h.push('<section class="card span12" id="pipeline"><h2>' + icon("pipe") + 'Leads pipeline<span class="r mut">' + d.leads.length + " leads</span></h2><div class=\"pipe\">" + d.columns.map(function (c) {
      return '<div class="col"><h3><span>' + esc(c.label) + "</span><span>" + c.leads.length + "</span></h3>" + c.leads.map(function (id) { var l = byId[id]; return '<div class="lead"><b>' + esc(l.name) + "</b><small>" + esc(l.area || "") + "</small><small>" + esc(STAGE[l.stage] || l.stage) + " · " + rs(l.deal ? l.deal.price : l.quote) + (l.deal ? "" : " est.") + "</small>" + (l.demo_url ? '<small><a href="' + esc(l.demo_url) + '" target="_blank" rel="noopener">Demo</a>' + (l.source_link ? ' · <a href="' + esc(l.source_link) + '" target="_blank" rel="noopener">Source</a>' : "") + "</small>" : "") + "</div>"; }).join("") + "</div>";
    }).join("") + '</div><p class="note">Sirf business ka naam + area. Phone numbers is page pe nahi aate.</p></section>');
    // Ideas
    h.push('<section class="card span6" id="ideas"><h2>' + icon("bulb") + "Ideas board</h2>" + (d.ideas.length ? '<ul class="list">' + d.ideas.slice(0, 10).map(function (i) { return '<li class="row"><div class="grow"><b>' + esc(i.title) + (i.status === "picked" ? ' <span class="tag acc">Top pick</span>' : "") + "</b><p>" + esc(i.why || "") + " · " + esc(BOTS[i.by] || i.by || "") + "</p></div></li>"; }).join("") + "</ul>" : '<p class="empty">Meeting ke baad yahan ideas aayenge.</p>') + "</section>");
    // Tasks
    h.push('<section class="card span6" id="tasks"><h2>' + icon("list") + "Tasks</h2>" + (d.tasks.length ? '<ul class="list">' + d.tasks.slice(0, 12).map(function (t) { return '<li class="row"><div class="grow"><b>' + esc(t.title) + '</b><p><span class="tag">' + esc(BOTS[t.owner] || t.owner) + '</span><span class="tag">' + esc(t.due || "") + '</span><span class="tag ' + (t.status === "done" ? "ok" : "") + '">' + esc(t.status) + "</span></p></div></li>"; }).join("") + "</ul>" : '<p class="empty">Koi task nahi.</p>') + "</section>");
    // Mxa growth + content + chats
    h.push('<section class="card span6" id="mxa"><h2>' + icon("rocket") + "Mxa growth</h2>" + (d.mxa.length ? '<ul class="list">' + d.mxa.map(function (x) { return '<li class="row"><div class="grow"><b>' + esc(x.title) + "</b><p>" + esc(x.why || "") + (x.first_step ? " · Pehla step: " + esc(x.first_step) : "") + "</p></div></li>"; }).join("") + "</ul>" : '<p class="empty">Meeting ke baad.</p>') + "</section>");
    h.push('<section class="card span6"><h2>' + icon("film") + 'Content scripts<span class="r mut">auto-post nahi</span></h2>' + (d.content.length ? '<ul class="list">' + d.content.map(function (c) { return '<li class="row"><div class="grow"><b>' + esc(c.hook) + "</b><p>" + esc(c.caption || "") + "</p></div></li>"; }).join("") + "</ul>" : '<p class="empty">Meeting ke baad.</p>') + "</section>");
    h.push('<section class="card span12"><h2>' + icon("chat") + 'AI sales chats<span class="r mut">client ke saath baat (AI clearly disclosed)</span></h2>' + (d.chats && d.chats.length ? '<ul class="list">' + d.chats.map(function (c) { return '<li class="row"><div class="grow"><b>' + esc(c.name) + (c.deal ? ' <span class="tag ok">Deal ' + rs(c.deal.price) + "</span>" : "") + "</b>" + c.last.map(function (x) { return "<p>" + (x.r === "c" ? "Client: " : "AI: ") + esc(x.t) + "</p>"; }).join("") + "</div><time class=\"small mut\">" + fmt(c.updated_at) + "</time></li>"; }).join("") + "</ul>" : '<p class="empty">Abhi kisi client ne chat nahi khola.</p>') + "</section>");
    app.innerHTML = h.join("");
  }

  function apprHtml(a) {
    var l = (D.leads || []).filter(function (x) { return x.id === a.lead_id; })[0] || {};
    var head = '<b>' + esc(a.name) + '</b> <span class="tag acc">' + esc(a.label) + "</span><p class=\"mut small\">" + esc(l.area || "") + (l.rating ? " · " + esc(l.rating) + "★ (" + esc(l.reviews || "?") + ")" : "") + " · " + rs(l.deal ? l.deal.price : l.quote) + (l.deal ? "" : " (estimate)") + "</p>";
    if (a.kind === "outreach") return '<div class="appr">' + head + '<div class="pitch">' + esc(l.pitch || "") + '</div><p class="small mut">' + (l.demo_url ? '<a href="' + esc(l.demo_url) + '" target="_blank" rel="noopener">Demo dekho</a> · ' : "") + (l.source_link ? '<a href="' + esc(l.source_link) + '" target="_blank" rel="noopener">Source (Google listing)</a> · ' : "") + "QA: " + (l.qa && l.qa.ok ? "pass" : "check") + '</p><div class="acts"><button class="btn primary sm" data-act="approve" data-id="' + esc(l.id) + '">Bhejo</button><button class="btn sm" data-act="editbox" data-id="' + esc(l.id) + '">Edit</button><button class="btn bad sm" data-act="skip" data-id="' + esc(l.id) + '">Chhodo</button></div><div class="editbox" id="eb-' + esc(l.id) + '" hidden><textarea aria-label="Pitch edit">' + esc(l.pitch || "") + '</textarea><button class="btn sm" data-act="edit" data-id="' + esc(l.id) + '">Save pitch</button></div></div>';
    if (a.kind === "advance") return '<div class="appr">' + head + '<div class="acts"><input type="number" inputmode="numeric" id="amt-' + esc(l.id) + '" value="' + (a.amount || "") + '" aria-label="Amount" style="max-width:140px"><button class="btn ok sm" data-act="paid" data-id="' + esc(l.id) + '">Paisa aa gaya</button></div></div>';
    if (a.kind === "delivery") return '<div class="appr">' + head + '<p class="small"><a href="' + esc((l.deliverable || {}).url || "#") + '" target="_blank" rel="noopener">Deliverable dekho</a></p><div class="acts"><button class="btn primary sm" data-act="deliver" data-id="' + esc(l.id) + '">Client ko bhejo</button></div></div>';
    if (a.kind === "final") return '<div class="appr">' + head + '<div class="acts"><input type="number" inputmode="numeric" id="amt-' + esc(l.id) + '" value="' + (a.amount || "") + '" aria-label="Amount" style="max-width:140px"><button class="btn ok sm" data-act="final" data-id="' + esc(l.id) + '">Baaki paisa aa gaya</button></div></div>';
    return "";
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]"); if (!b) return;
    var act = b.getAttribute("data-act"), id = b.getAttribute("data-id");
    if (act === "editbox") { var eb = $("#eb-" + id); eb.hidden = !eb.hidden; return; }
    if (window.HQ_FIXTURE) { toast("Preview mode — asli action nahi hua"); return; }
    var body = { action: act, lead_id: id };
    if (act === "edit") body.text = $("#eb-" + id + " textarea").value;
    if (act === "paid" || act === "final") { body.amount = Number(($("#amt-" + id) || {}).value || 0); if (!confirm("Pakka " + rs(body.amount) + " tumhare account me aa gaya?")) return; }
    if (act === "skip" && !confirm("Is lead ko chhod dein?")) return;
    b.disabled = true;
    api("/api/hq/action", body).then(function (r) {
      toast(r.text ? r.text.split("\n")[0] : "Ho gaya");
      return load().then(function () { if (r.link) linkBar(r.link); });
    }).catch(function (err) { b.disabled = false; toast("Error: " + err.message); });
  });

  // WhatsApp link: popup-blocker se bachne ke liye tap karne wala button (message tum khud Send karte ho)
  function linkBar(url) {
    var t = $("#toast"); clearTimeout(toast.t);
    t.innerHTML = '<b>Ready.</b> Tap karo → WhatsApp me message khulega → khud Send dabao.<div class="acts" style="margin-top:8px"><a class="btn primary sm" target="_blank" rel="noopener" href="' + esc(url) + '">WhatsApp kholo</a><button class="btn sm" type="button" id="tclose">Band</button></div>';
    t.style.display = "block"; $("#tclose").onclick = function () { t.style.display = "none"; };
  }
  function load() {
    if (window.HQ_FIXTURE) { D = window.HQ_FIXTURE; render(); return Promise.resolve(); }
    return api("/api/hq").then(function (d) { D = d; $("#login").hidden = true; render(); }).catch(function (e) {
      if (e.status === 401) { KEY = ""; LS.set("key", ""); showLogin("Key galat hai"); } else toast("Load nahi hua: " + e.message);
    });
  }
  function showLogin(msg) { if (!$("#login")) { location.reload(); return; } $("#login").hidden = false; $("#loginErr").textContent = msg || ""; }
  $("#loginForm").addEventListener("submit", function (e) { e.preventDefault(); KEY = $("#key").value.trim(); LS.set("key", KEY); load(); });
  if (window.HQ_FIXTURE || KEY) load(); else showLogin("");
  setInterval(function () { if (KEY && !document.hidden && !window.HQ_FIXTURE) load(); }, 60000);
})();
