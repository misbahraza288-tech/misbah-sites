/* =====================================================================
   PREMIUM theme — emoji ki jagah clean line SVG icons + fade-up entrance.
   app.js ke PEHLE load hota hai (data.js ke baad). Kuch bhi app logic nahi badalta.
   ===================================================================== */
(function () {
  "use strict";
  var CFG = window.KANAK_CONFIG || {};
  // 1) Pehli baar light (cream) theme — baad me user khud dark kar sakta hai
  try { var K = (CFG.STORAGE_KEY || "kanak2") + "_"; if (localStorage.getItem(K + "prefs") == null) localStorage.setItem(K + "prefs", JSON.stringify({ theme: "light" })); } catch (e) {}

  // 2) Line icons (24px grid, stroke) — Lucide-style, apne haath se
  var P = {
    bowl: '<path d="M3 11h18a9 9 0 0 1-18 0Z"/><path d="M7 21h10"/><path d="M9 7c0-1.5 1-2 1-3.5M13 7c0-1.5 1-2 1-3.5"/>',
    pizza: '<path d="M12 3 3 19a17 17 0 0 0 18 0Z"/><circle cx="11" cy="12" r="1"/><circle cx="13.5" cy="16" r="1"/><circle cx="9" cy="16.5" r="1"/>',
    burger: '<path d="M4 10a8 6 0 0 1 16 0Z"/><path d="M3 14h18"/><path d="M4 17h16a0 0 0 0 1 0 0 3 3 0 0 1-3 3H7a3 3 0 0 1-3-3Z"/>',
    cup: '<path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5Z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 2.5c0 1 .8 1.5.8 2.5M12 2.5c0 1 .8 1.5.8 2.5"/>',
    cake: '<path d="M4 21V13a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8"/><path d="M4 16c2 0 2 1.5 4 1.5S10 16 12 16s2 1.5 4 1.5S18 16 20 16"/><path d="M3 21h18M12 7v4"/><path d="M12 3.2c.8.8.8 2 0 2.8-.8-.8-.8-2 0-2.8Z"/>',
    scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>',
    sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><path d="M12 8.5 13.2 11l2.3 1-2.3 1L12 15.5 10.8 13l-2.3-1 2.3-1Z"/>',
    dumbbell: '<path d="M6 7v10M18 7v10M3 9.5v5M21 9.5v5M6 12h12"/>',
    book: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5Z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20"/>',
    bag: '<path d="M5 8h14l-1 13H6Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    cart: '<circle cx="9" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/><path d="M2.5 3h2.5l2.6 12.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 8H6"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13"/><path d="M12 8c-2-3-6-3-6-.5S9 8 12 8Zm0 0c2-3 6-3 6-.5S15 8 12 8Z"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/>',
    phone: '<path d="M5 3h3l2 5-2.5 1.5a11 11 0 0 0 7 7L16 14l5 2v3a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2Z"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    camera: '<path d="M3 8a2 2 0 0 1 2-2h2.5L9 4h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><circle cx="12" cy="13" r="3.5"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.6 15H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9 4.6V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1.3Z"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>',
    share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>',
    lock: '<rect x="4" y="10.5" width="16" height="10.5" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>',
    heart: '<path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    receipt: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2Z"/><path d="M9 8h6M9 12h6"/>',
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h10"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5Z"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.8 7L4 20l1.1-4.4A8 8 0 1 1 21 12Z"/>',
    leaf: '<path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15"/><path d="M5 19 13 11"/>',
    truck: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>',
    flame: '<path d="M12 22a7 7 0 0 0 7-7c0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-3 3-5 5-5 8a7 7 0 0 0 7 7Z"/>',
    dot: '<circle cx="12" cy="12" r="5"/>'
  };
  var MAP = [
    [/🥟|🍜|🍝|🍛|🍲|🥘|🍱|🍚|🥗|🍢|🍳|🥙|🌯|🍤|🍗|🍖|🥩|🍽/, "bowl"], [/🍕/, "pizza"], [/🍔|🌭|🌮|🥪|🍟|🥨/, "burger"],
    [/☕|🍵|🥤|🧋|🍹|🥛|🧃|🍶|🍺|🧉/, "cup"], [/🎂|🍰|🧁|🍩|🍪|🥐|🍞|🥧|🍫|🍬|🍮|🍦|🍨/, "cake"],
    [/💇|✂|🪒|💈/, "scissors"], [/🧖|✨|💅|💄|🌟/, "sparkle"], [/👰|💍|❤|♥|💖|💕/, "heart"], [/🏋|💪|🤸|🏃|🧘/, "dumbbell"],
    [/📚|🎯|🧑‍🏫|📖|✏|📝|🎓/, "book"], [/🛍|🏪|🏬/, "bag"], [/🛒/, "cart"], [/🎁|🎉/, "gift"], [/⭐|🏆/, "star"],
    [/📞|☎|📱/, "phone"], [/📍|🗺|🧭/, "pin"], [/📸|📷|🖼/, "camera"], [/⚙|🛠/, "settings"], [/📲|⬇/, "download"], [/🔗|📤/, "share"],
    [/🔐|🔒|🔑/, "lock"], [/🔍|🔎/, "search"], [/🧾|📋/, "receipt"], [/🏠/, "home"], [/✔|✅|☑/, "check"], [/⏰|🕒|⏱|🕐/, "clock"],
    [/💬|🗨/, "chat"], [/🌿|🥬|🌱/, "leaf"], [/🛵|🚚|🚴|🏍/, "truck"], [/🔥/, "flame"], [/🔴|🟢|🟡|⚪|⚫/, "dot"]
  ];
  var EMO = /(?:\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic}|[\u{1F3FB}-\u{1F3FF}])*)+/gu;
  function svg(name) { return '<svg class="pi' + (name === "dot" ? " pi-fill" : "") + '" viewBox="0 0 24 24" aria-hidden="true">' + (P[name] || P.dot) + "</svg>"; }
  function iconFor(e) { for (var i = 0; i < MAP.length; i++) if (MAP[i][0].test(e)) return MAP[i][1]; return "dot"; }
  // jin containers me emoji ICON hai (baaki text me emoji bas hata dete hain)
  var ICONISH = ".e,.emo,.ic,.big,.ti,.icon-btn,.btn,.li,.chip,.tagrow span,.status-card,.cat-sec h3,.empty";
  var PURE = ".e,.emo,.ic,.big,.ti";

  function fixText(node) {
    var t = node.nodeValue; EMO.lastIndex = 0;
    if (!t || !EMO.test(t)) return;
    var host = node.parentElement; if (!host || host.closest("script,style,svg,textarea,input")) return;
    var iconish = host.closest(ICONISH);
    var pure = host.closest(PURE);
    // icon box ke bahar ya anjaan emoji (🙏 😋) text ke beech → bas hata do
    if (iconish && !pure) { EMO.lastIndex = 0; var all = t.match(EMO) || []; if (all.every(function (e) { return iconFor(e) === "dot"; })) iconish = null; }
    if (!iconish) { node.nodeValue = t.replace(EMO, "").replace(/\s{2,}/g, " ").replace(/\s+([.,!?])/g, "$1"); return; }
    var frag = document.createDocumentFragment(), last = 0; EMO.lastIndex = 0; var m;
    while ((m = EMO.exec(t))) {
      if (m.index > last) frag.appendChild(document.createTextNode(t.slice(last, m.index)));
      var nm = iconFor(m[0]);
      if (nm !== "dot" || pure) { var span = document.createElement("span"); span.innerHTML = svg(nm); frag.appendChild(span.firstChild); }
      last = m.index + m[0].length;
    }
    if (last < t.length) frag.appendChild(document.createTextNode(t.slice(last)));
    node.parentNode.replaceChild(frag, node);
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) return fixText(root);
    var it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), list = [], n;
    while ((n = it.nextNode())) list.push(n);
    list.forEach(fixText);
  }
  // 3) Tab bar + top buttons: fixed icons (unicode ⌂ ☰ ⋯ ◐ ‹ bhi emoji jaise lagte hain)
  function chrome() {
    var tabs = { home: "home", menu: "menu", cart: "cart", orders: "receipt", more: "more" };
    document.querySelectorAll(".tabbar a[data-tab]").forEach(function (a) {
      var ti = a.querySelector(".ti"); if (!ti || ti.dataset.pi) return;
      var badge = ti.querySelector("b"); ti.innerHTML = svg(tabs[a.dataset.tab] || "dot"); if (badge) ti.appendChild(badge); ti.dataset.pi = "1";
    });
    var tq = document.getElementById("themeQuick"); if (tq && !tq.dataset.pi) { tq.innerHTML = svg("moon"); tq.dataset.pi = "1"; }
    var bb = document.getElementById("backBtn"); if (bb && !bb.dataset.pi) { bb.innerHTML = svg("back"); bb.dataset.pi = "1"; }
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.content = document.documentElement.dataset.theme === "dark" ? "#1A1C16" : "#F1EEE7";
  }
  // 4) Fade-up jab page/route badle
  var lastHash = null;
  function enter() {
    var pg = document.querySelector("#app > .page"); if (!pg) return;
    if (location.hash === lastHash && pg.dataset.pmSeen) return;
    lastHash = location.hash; pg.dataset.pmSeen = "1";
    pg.classList.remove("pm-enter"); void pg.offsetWidth; pg.classList.add("pm-enter");
    setTimeout(function () { pg.classList.remove("pm-enter"); }, 1400);
  }
  var queued = false;
  function sweep() { queued = false; chrome(); ["#app", "#topbar", "#tabbar", "#sheet", "#toast", "#splash"].forEach(function (s) { walk(document.querySelector(s)); }); enter(); }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(sweep); } }
  function start() {
    document.title = document.title.replace(EMO, "").trim();
    sweep();
    new MutationObserver(queue).observe(document.body, { childList: true, subtree: true, characterData: true });
    new MutationObserver(chrome).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
