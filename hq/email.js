/* Misbah HQ — Gmail Outreach card (alag file; hq.js ko nahi chhoota). Data: Worker /api/hq/email (x-key).
   Client emails yahan MASKED aate hain (a***@domain), email bodies nahi. Kamai ka koi number yahan nahi. */
(function () {
  "use strict";
  var CFG = window.HQ_CONFIG || {};
  var box = document.getElementById("hqEmail");
  if (!box) return;
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var rs = function (n) { return "₹" + Number(n || 0).toLocaleString("en-IN"); };
  var MAIL = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>';
  var ST = { sending: ["Bhej raha hai", "acc"], done: ["Aaj poora", "ok"], skipped: ["Aaj nahi", ""], waiting: ["Tumhare ✅ ka wait", "warn"], error: ["Rukka — Gmail check", "warn"], paused_limit: ["Gmail limit — ruka", "warn"] };
  var TS = { sent: "bheja", talking: "baat", interested: "interested", deal: "deal fix", handoff: "tumhe dekhna hai", stopped: "STOP" };
  function render(d) {
    var s = d.stats || {}, q = d.queue, st = d.paused ? ["PAUSED", "warn"] : ST[(q && q.status) || "waiting"] || ["—", ""];
    var html = '<h2>' + MAIL + 'Gmail Outreach<span class="r"><span class="tag ' + st[1] + '">' + esc(st[0]) + '</span></span></h2>' +
      '<div class="kpis"><div class="kpi"><small>Aaj bheje</small><b>' + (s.sent_today || 0) + '</b></div><div class="kpi"><small>Total bheje</small><b>' + (s.sent_total || 0) + '</b></div>' +
      '<div class="kpi"><small>Replies</small><b>' + (s.replies || 0) + '</b></div><div class="kpi"><small>Interested / Deals</small><b>' + (s.interested || 0) + ' / ' + (s.deals || 0) + '</b></div></div>';
    if (q && q.items && q.items.length) {
      html += '<div class="meta"><span>List ' + esc(q.date) + ' · ' + q.count + ' restaurants</span><span>STOP: ' + (s.stopped || 0) + '</span>' + (s.waiting_misbah ? '<span>Tumhare jawab ka wait: ' + s.waiting_misbah + '</span>' : '') + '</div><div class="list" style="margin-top:10px">';
      q.items.slice(0, 30).forEach(function (it) {
        html += '<div class="row"><div class="grow"><b>' + esc(it.name) + ' <span class="mut small">· ' + esc(it.city) + '</span></b><p>' + esc(it.subject) + '</p><p class="small">' + esc(it.to) + ' · ' + rs(it.quote) + ' est. · <a href="' + esc(it.source_url) + '" target="_blank" rel="noopener">source</a></p></div>' +
          '<span class="tag ' + (it.sent ? "ok" : "") + '">' + (it.sent ? "bheja" : "list") + '</span></div>';
      });
      html += '</div>';
    } else html += '<p class="mut" style="margin-top:12px">Aaj ki list abhi nahi bani — roz meeting ke baad banti hai.</p>';
    if (d.threads && d.threads.length) {
      html += '<h2 style="margin-top:16px">Replies</h2><div class="list">';
      d.threads.forEach(function (t) { html += '<div class="row"><div class="grow"><b>' + esc(t.name) + ' <span class="mut small">· ' + esc(t.city || "") + '</span></b><p class="small">' + esc(t.to) + ' · ' + (t.replies || 0) + ' reply</p></div><span class="tag ' + (t.status === "deal" ? "ok" : t.status === "handoff" ? "warn" : "") + '">' + esc(TS[t.status] || t.status) + '</span></div>'; });
      html += '</div>';
    }
    html += '<p class="note">Har email tumhare ✅ ke baad hi jaata hai · din me max 30, 3-5 min gap · har email me STOP option · client emails yahan masked. Reply ya deal ki koi guarantee nahi.</p>';
    box.innerHTML = html; box.hidden = false;
  }
  function load() {
    var key = ""; try { key = localStorage.getItem("mdc_key") || ""; } catch (e) {}
    if (!key || !CFG.WORKER_URL) return;
    fetch(CFG.WORKER_URL + "/api/hq/email", { headers: { "x-key": key } }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { if (d && d.stats) render(d); }).catch(function () {});
  }
  window.HQ_EMAIL_RENDER = render; // preview/test ke liye
  load(); setInterval(load, 120000);
  window.addEventListener("storage", load);
})();
