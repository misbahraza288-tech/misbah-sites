/* =====================================================================
   Kanak Cafe App v3 — Restaurant App Pro template (Misbah Digital)
   6 screens: Home · Menu · Cart · Orders · Profile · Settings (+ Owner Panel)
   Vanilla JS, koi framework nahi. Data: server (Cloudflare KV) → cache → data.js seed.
   ===================================================================== */
(function () {
  "use strict";
  const S = window.APP_STATIC, ICONS = window.ICONS || {};
  const API = S.api, KEY = S.storageKey || "app3";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const icon = (n, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ""}</svg>`;
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(KEY + ":" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(KEY + ":" + k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(KEY + ":" + k); } catch (e) {} },
  };
  function mergeCfg(base, over) {
    const o = Object.assign({}, clone(base), over || {});
    o.delivery = Object.assign({}, base.delivery, (over && over.delivery) || {});
    if (!Array.isArray(o.offers)) o.offers = clone(base.offers);
    if (!Array.isArray(o.coupons)) o.coupons = clone(base.coupons);
    return o;
  }

  // ---------- state ----------
  let MENU = LS.get("menu", null) || clone(window.APP_SEED_MENU);
  let CFG = mergeCfg(window.APP_SEED_CONFIG, LS.get("config", null));
  let MENU_V = LS.get("menuV", 0);
  let cart = LS.get("cart", []);
  let user = LS.get("user", null);
  let orders = LS.get("orders", []);
  let prefs = Object.assign({ theme: "light", lang: "hi", veg: false }, LS.get("prefs", {}));
  let ownerToken = LS.get("owner", null);
  let online = null; // server se data aaya?
  const saveCart = () => { LS.set("cart", cart); updateBadge(); };

  // ---------- language ----------
  const T = {
    hi: {
      home: "Home", menu: "Menu", cart: "Cart", orders: "Orders", settings: "Settings", profile: "Profile",
      open: "Abhi khula hai", closed: "Abhi band hai", closesAt: "band hoga", opensAt: "khulega",
      call: "Call", directions: "Raasta", whatsapp: "WhatsApp", share: "Share",
      offers: "Aaj ke offers", cats: "Kya khayenge?", popular: "Sabse pasand", seeAll: "Sab dekho", visit: "Cafe aaiye",
      search: "Momos, roll, noodles dhundo…", vegOnly: "Sirf veg", add: "ADD", half: "Half", full: "Full", out: "Khatam",
      addToCart: "Cart mein daalo", items: "items", viewCart: "Cart dekho",
      cartEmpty: "Cart khaali hai", cartEmptySub: "Menu se kuch tasty chuniye", browse: "Menu dekho",
      orderType: "Order kaise chahiye?", dinein: "Dine-in", takeaway: "Takeaway", delivery: "Delivery",
      table: "Table number", address: "Delivery address", notes: "Kuch kehna hai? (kam teekha, extra chutney…)",
      coupon: "Coupon code", apply: "Lagao", subtotal: "Item total", discount: "Discount", fee: "Delivery charge", total: "Total",
      place: "Order karo", loginToOrder: "Order ke liye login", loginFirst: "Order se pehle login karein",
      noOrders: "Abhi tak koi order nahi", noOrdersSub: "Pehla order karke dekhiye", reorder: "Dobara order",
      login: "Login", logout: "Logout", name: "Aapka naam", mobile: "Mobile number", saveLogin: "Login karo",
      theme: "Theme", light: "Light", dark: "Dark", auto: "Auto", language: "Bhasha", install: "App install karo", shareApp: "App share karo",
      qr: "QR code", about: "About", contact: "Contact", ownerLogin: "Owner Login", ownerPanel: "Owner Panel",
    },
    en: {
      home: "Home", menu: "Menu", cart: "Cart", orders: "Orders", settings: "Settings", profile: "Profile",
      open: "Open now", closed: "Closed now", closesAt: "closes", opensAt: "opens",
      call: "Call", directions: "Directions", whatsapp: "WhatsApp", share: "Share",
      offers: "Today's offers", cats: "Categories", popular: "Most loved", seeAll: "See all", visit: "Visit us",
      search: "Search momos, rolls, noodles…", vegOnly: "Veg only", add: "ADD", half: "Half", full: "Full", out: "Sold out",
      addToCart: "Add to cart", items: "items", viewCart: "View cart",
      cartEmpty: "Your cart is empty", cartEmptySub: "Pick something tasty from the menu", browse: "Browse menu",
      orderType: "How would you like it?", dinein: "Dine-in", takeaway: "Takeaway", delivery: "Delivery",
      table: "Table number", address: "Delivery address", notes: "Any instructions? (less spicy, extra chutney…)",
      coupon: "Coupon code", apply: "Apply", subtotal: "Item total", discount: "Discount", fee: "Delivery fee", total: "Total",
      place: "Place order", loginToOrder: "Login to order", loginFirst: "Please log in before ordering",
      noOrders: "No orders yet", noOrdersSub: "Place your first order", reorder: "Reorder",
      login: "Login", logout: "Logout", name: "Your name", mobile: "Mobile number", saveLogin: "Log in",
      theme: "Theme", light: "Light", dark: "Dark", auto: "Auto", language: "Language", install: "Install app", shareApp: "Share app",
      qr: "QR code", about: "About", contact: "Contact", ownerLogin: "Owner Login", ownerPanel: "Owner Panel",
    },
  };
  const t = (k) => (T[prefs.lang] && T[prefs.lang][k]) || T.hi[k] || k;

  // ---------- helpers ----------
  const rupee = (n) => "₹" + Math.round(Number(n) || 0).toLocaleString("en-IN");
  const imgSrc = (x, small) => !x ? "" : /^(https?:|data:)/.test(x) ? x : `img/${x}${small ? "-s" : ""}.webp`;
  const hasHF = (m) => m.h != null && m.f != null && m.h !== "" && m.f !== "";
  const unit = (m, v) => (v === "h" ? m.h : v === "f" ? m.f : (m.p != null ? m.p : m.f || m.h || 0));
  const item = (id) => MENU.items.find((m) => m.id === id);
  const catOf = (id) => MENU.cats.find((c) => c.id === id) || { n: "Menu", icon: "bowl" };
  const visibleItems = () => MENU.items.filter((m) => !m.hide);
  const mins = (hm) => { const [h, m] = String(hm || "0:0").split(":").map(Number); return h * 60 + (m || 0); };
  const fmt12 = (hm) => { let [h, m] = String(hm || "0:0").split(":").map(Number); const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return `${h}:${String(m || 0).padStart(2, "0")} ${ap}`; };
  function isOpen() {
    if (CFG.override === "open") return true;
    if (CFG.override === "closed") return false;
    const d = new Date(); const n = d.getHours() * 60 + d.getMinutes(); const o = mins(CFG.open), c = mins(CFG.close);
    return c > o ? n >= o && n < c : n >= o || n < c;
  }
  function statusLine() {
    const op = isOpen();
    if (CFG.override === "closed") return { op, text: t("closed") };
    if (CFG.override === "open") return { op, text: t("open") };
    return { op, text: op ? `${t("open")} · ${fmt12(CFG.close)} ${t("closesAt")}` : `${t("closed")} · ${fmt12(CFG.open)} ${t("opensAt")}` };
  }
  const waLink = (num, text) => { const n = String(num || "").replace(/\D/g, ""); const q = []; if (n) q.push("phone=" + n); if (text) q.push("text=" + encodeURIComponent(text)); return "https://api.whatsapp.com/send" + (q.length ? "?" + q.join("&") : ""); };
  const fmtPhone = (p) => { const d = String(p || "").replace(/\D/g, "").slice(-10); return d.length === 10 ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : String(p || ""); };
  const telLink = () => "tel:" + String(CFG.phone || "").replace(/[^\d+]/g, "");
  const appUrl = () => location.href.split("#")[0].split("?")[0].replace(/index\.html$/, "");
  const thumbHtml = (m, small = true) => {
    const src = imgSrc(m.img, small);
    return src ? `<img src="${esc(src)}" alt="" loading="lazy" decoding="async">` : `<div class="illus">${icon(catOf(m.c).icon || "bowl")}</div>`;
  };
  const priceHtml = (m) => hasHF(m) ? `${rupee(m.h)} <small>/ ${rupee(m.f)}</small>` : rupee(unit(m));
  const initials = (n) => String(n || "?").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const timeAgo = (iso) => { const d = new Date(iso); const s = (Date.now() - d) / 1000; if (s < 60) return "abhi"; if (s < 3600) return Math.floor(s / 60) + " min pehle"; if (s < 86400) return Math.floor(s / 3600) + " ghante pehle"; return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + ", " + d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }); };

  async function api(path, opts = {}) {
    const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), opts.timeout || 9000);
    try {
      const headers = {};
      if (opts.body) headers["content-type"] = "application/json";
      if (opts.owner && ownerToken) headers["x-owner-token"] = ownerToken;
      if (opts.key) headers["x-key"] = opts.key;
      const res = await fetch(API + path, { method: opts.body ? "POST" : "GET", headers, body: opts.body ? JSON.stringify(opts.body) : undefined, signal: ctl.signal, cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) { const e = new Error(data.error || "Server error " + res.status); e.status = res.status; throw e; }
      return data;
    } catch (e) {
      if (e.name === "AbortError") { const x = new Error("Internet slow hai — dobara try karo"); x.status = 0; throw x; }
      if (e.status == null) e.status = 0;
      throw e;
    } finally { clearTimeout(tm); }
  }

  // ---------- toast / sheets ----------
  let toastT;
  function toast(msg, ic = "check") {
    const el = $("#toast"); el.innerHTML = icon(ic, "sm") + "<span>" + esc(msg) + "</span>"; el.classList.add("on");
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("on"), 2600);
  }
  let sheetClose = null;
  function openSheet(html, mount) {
    if (sheetClose) sheetClose(true);
    const scrim = document.createElement("div"); scrim.className = "scrim";
    const sh = document.createElement("div"); sh.className = "sheet"; sh.setAttribute("role", "dialog");
    sh.innerHTML = `<div class="grab"></div><button class="iconbtn x" data-close aria-label="Band karo">${icon("x")}</button>` + html;
    document.body.append(scrim, sh);
    requestAnimationFrame(() => { scrim.classList.add("on"); sh.classList.add("on"); });
    const close = (instant) => {
      if (sheetClose !== close) return; sheetClose = null;
      scrim.classList.remove("on"); sh.classList.remove("on");
      setTimeout(() => { scrim.remove(); sh.remove(); }, instant ? 0 : 420);
    };
    sheetClose = close;
    scrim.addEventListener("click", () => close());
    sh.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) close(); });
    if (mount) mount(sh, close);
    return close;
  }
  function confirmSheet(title, sub, okText, danger) {
    return new Promise((res) => {
      let done = false;
      const close = openSheet(`<h3>${esc(title)}</h3><p class="muted" style="margin:0 0 18px">${esc(sub)}</p>
        <div class="grid2"><button class="btn ghost" data-no>Nahi</button><button class="btn ${danger ? "danger" : ""}" data-yes>${esc(okText)}</button></div>`, (sh, cl) => {
        sh.querySelector("[data-no]").onclick = () => { done = true; res(false); cl(); };
        sh.querySelector("[data-yes]").onclick = () => { done = true; res(true); cl(); };
      });
      const iv = setInterval(() => { if (sheetClose !== close) { clearInterval(iv); if (!done) res(false); } }, 300);
    });
  }

  // ---------- theme ----------
  function applyTheme() {
    const dark = prefs.theme === "dark" || (prefs.theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    const m = $('meta[name="theme-color"]'); if (m) m.content = dark ? "#12110E" : "#F6F1E9";
  }
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", applyTheme);

  // ---------- cart ----------
  const cartQty = (id) => cart.filter((c) => c.id === id).reduce((a, c) => a + c.q, 0);
  const cartCount = () => cart.reduce((a, c) => a + c.q, 0);
  const cartLines = () => cart.map((c) => ({ ...c, m: item(c.id) })).filter((c) => c.m);
  const cartSubtotal = () => cartLines().reduce((a, c) => a + unit(c.m, c.v) * c.q, 0);
  function addToCart(id, v, q = 1) {
    const m = item(id); if (!m || m.out) return;
    v = hasHF(m) ? (v || "f") : "";
    const key = id + ":" + v; const ex = cart.find((c) => c.key === key);
    if (ex) ex.q = Math.min(50, ex.q + q); else cart.push({ key, id, v, q });
    saveCart(); bumpBadge();
  }
  function changeQty(key, d) {
    const c = cart.find((x) => x.key === key); if (!c) return;
    c.q += d; if (c.q <= 0) cart = cart.filter((x) => x.key !== key);
    saveCart();
  }
  function decItem(id) { const lines = cart.filter((c) => c.id === id); if (lines.length) changeQty(lines[lines.length - 1].key, -1); }
  function updateBadge() {
    const n = cartCount(); const b = $("#cartBadge");
    if (b) { b.textContent = n; b.classList.toggle("hide", !n); }
    renderFloatCart();
  }
  function bumpBadge() { const b = $("#cartBadge"); if (b) { b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); } }
  function renderFloatCart() {
    const fc = $("#floatCart"); if (!fc) return;
    const show = cartCount() > 0 && ["home", "menu"].includes(current.name);
    fc.classList.toggle("on", show);
    if (show) fc.innerHTML = `<a href="#/cart"><span>${cartCount()} ${t("items")} · ${rupee(cartSubtotal())}</span><span>${t("viewCart")} ${icon("chev", "sm")}</span></a>`;
  }

  // ---------- router ----------
  const TABS = ["home", "menu", "cart", "orders", "settings"];
  const ORDER = ["home", "menu", "cart", "orders", "settings", "profile", "owner"];
  let current = { name: "", params: {} };
  function parseHash() {
    const h = location.hash.replace(/^#\/?/, "");
    const [name, qs] = h.split("?");
    const params = Object.fromEntries(new URLSearchParams(qs || ""));
    return { name: ORDER.includes(name) ? name : "home", params };
  }
  const go = (h) => { if (location.hash === h) render(); else location.hash = h; };
  function render(opts = {}) {
    const next = parseHash();
    const back = ORDER.indexOf(next.name) < ORDER.indexOf(current.name);
    const same = next.name === current.name;
    current = next;
    if (next.name === "owner" && !ownerToken) { location.hash = "#/settings"; return; }
    $$(".nav a").forEach((a) => a.classList.toggle("on", a.dataset.tab === (TABS.includes(next.name) ? next.name : next.name === "profile" || next.name === "owner" ? "settings" : "")));
    $$(".nav [data-l]").forEach((s) => (s.textContent = t(s.dataset.l)));
    const view = $("#view");
    if (!opts.keepScroll && !same) window.scrollTo(0, 0);
    const y = window.scrollY;
    $("#dock").innerHTML = "";
    SCREENS[next.name](view, next.params);
    if (!same && !opts.quiet) { view.classList.remove("enter", "back"); void view.offsetWidth; view.classList.add("enter"); if (back) view.classList.add("back"); view.addEventListener("animationend", function done(ev) { if (ev.target === view) { view.classList.remove("enter", "back"); view.removeEventListener("animationend", done); } }); }
    if (opts.keepScroll) window.scrollTo(0, y);
    renderFloatCart();
  }
  function topbar(html) { $("#topbar").innerHTML = html; }
  const titleBar = (title, kicker, right = "", backTo = "") => topbar(`${backTo ? `<a class="iconbtn" href="${backTo}" aria-label="Back">${icon("back")}</a>` : ""}<div class="title"><div class="kicker">${esc(kicker)}</div><h1>${esc(title)}</h1></div>${right}`);
  window.addEventListener("scroll", () => $("#topbar").classList.toggle("scrolled", window.scrollY > 8), { passive: true });

  const SCREENS = {};

  // =============== 1. HOME ===============
  let heroTimer;
  SCREENS.home = (el) => {
    topbar(`<div class="title brandmark"><img src="img/logo.webp" alt=""><div><div class="kicker">Govindpur · Dhanbad</div><h1>${esc(CFG.short || CFG.name)}</h1></div></div>
      <a class="iconbtn" href="#/profile" aria-label="Profile">${icon("user")}${user ? "" : '<span class="dot"></span>'}</a>`);
    const st = statusLine();
    const hero = S.hero || [];
    const offers = (CFG.offers || []).filter((o) => o.on);
    const popular = visibleItems().filter((m) => m.best).slice(0, 10);
    el.innerHTML = `<div class="stagger">
      <section class="hero" aria-label="Kanak Cafe">
        ${hero.map((h, i) => `<div class="slide ${i ? "" : "on"}"><img src="${esc(imgSrc(h.img))}" alt="" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}></div>`).join("")}
        <div class="dots">${hero.map((h, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}</div>
        <div class="cap"><span class="pill ${st.op ? "" : "closed"}"><span class="led"></span>${esc(st.text)}</span>
          <h2 id="heroT">${esc(hero[0] ? hero[0].title : CFG.tagline)}</h2><p id="heroS">${esc(hero[0] ? hero[0].sub : "")}</p></div>
      </section>
      ${CFG.notice ? `<div class="notice">${icon("bell", "sm")}<span>${esc(CFG.notice)}</span></div>` : ""}
      <div class="quick">
        <a href="${telLink()}"><span class="ico">${icon("phone")}</span>${t("call")}</a>
        <a href="${esc(CFG.maps)}" target="_blank" rel="noopener"><span class="ico">${icon("pin")}</span>${t("directions")}</a>
        <a href="${waLink(CFG.whatsapp, "Namaste " + CFG.short + "!")}" target="_blank" rel="noopener"><span class="ico">${icon("chat")}</span>${t("whatsapp")}</a>
        <button data-act="share"><span class="ico">${icon("share")}</span>${t("share")}</button>
      </div>
      ${offers.length ? `<div class="sec"><h2>${t("offers")}</h2></div>
      <div class="hscroll offers">${offers.map((o) => `<button class="offer" data-offer="${esc(o.id)}">${o.img ? `<img src="${esc(imgSrc(o.img, true))}" alt="" loading="lazy">` : ""}<div class="in"><span class="tagx">${esc(o.tag || "Offer")}</span><h3>${esc(o.title)}</h3><p>${esc(o.sub)}</p><span class="go">Order karo ${icon("chev", "sm")}</span></div></button>`).join("")}</div>` : ""}
      <div class="sec"><h2>${t("cats")}</h2><a href="#/menu">${t("seeAll")} ${icon("chev", "sm")}</a></div>
      <div class="hscroll cats">${MENU.cats.map((c) => `<a class="cat" href="#/menu?cat=${encodeURIComponent(c.id)}"><span class="ico">${icon(c.icon || "bowl")}</span>${esc(c.n)}</a>`).join("")}</div>
      ${popular.length ? `<div class="sec"><h2>${t("popular")}</h2><a href="#/menu">${t("seeAll")} ${icon("chev", "sm")}</a></div>
      <div class="hscroll pop">${popular.map((m) => `<div class="pc ${m.out ? "out" : ""}" data-open="${esc(m.id)}" role="button" tabindex="0"><div class="ph">${thumbHtml(m)}</div><div class="b"><span class="row" style="gap:6px"><span class="vmark ${m.v ? "" : "nv"}"></span><span class="tiny muted">${esc(catOf(m.c).n)}</span></span><div class="nm">${esc(m.n)}</div><div class="pr"><span class="price">${priceHtml(m)}</span>${m.out ? `<span class="tiny" style="color:var(--bad);font-weight:700">${t("out")}</span>` : `<button class="addmini" data-add="${esc(m.id)}" aria-label="Add">${icon("plus", "sm")}</button>`}</div></div></div>`).join("")}</div>` : ""}
      <div class="card infocard">
        <div class="r">${icon("clock")}<div><b>${fmt12(CFG.open)} – ${fmt12(CFG.close)}</b><span>Roz khula · Mon–Sun</span></div></div>
        <div class="r">${icon("pin")}<div><b>${esc(CFG.name)}</b><span>${esc(CFG.address)}</span></div></div>
        <div class="r">${icon("star")}<div><b>${esc(S.rating)} Google rating</b><span>${esc(S.reviews)} reviews · ${esc(S.priceRange)}</span></div></div>
        <div class="r">${icon("store")}<div><b>${(S.services || []).map(esc).join(" · ")}</b><span>${CFG.delivery.on ? "Delivery: " + esc(CFG.delivery.area || "") : "Delivery abhi band"}</span></div></div>
      </div>
      <div class="sec"><h2>${t("visit")}</h2></div>
      <div class="gallery">${(S.gallery || []).slice(0, 6).map((g) => `<button data-photo="${esc(g)}"><img src="${esc(imgSrc(g, true))}" alt="" loading="lazy"></button>`).join("")}</div>
      <p class="foot">${esc(CFG.name)} · App by ${esc(S.madeBy)}</p>
    </div>`;
    clearInterval(heroTimer);
    let hi = 0;
    if (hero.length > 1) heroTimer = setInterval(() => {
      if (current.name !== "home" || !$(".hero")) return clearInterval(heroTimer);
      const slides = $$(".hero .slide"), dots = $$(".hero .dots i");
      slides[hi].classList.remove("on"); dots[hi].classList.remove("on");
      hi = (hi + 1) % slides.length;
      slides[hi].classList.add("on"); dots[hi].classList.add("on");
      $("#heroT").textContent = hero[hi].title; $("#heroS").textContent = hero[hi].sub;
    }, 4200);
  };

  // =============== 2. MENU ===============
  let menuQ = "";
  SCREENS.menu = (el, params) => {
    titleBar(t("menu"), `${visibleItems().length} dishes · Half & Full`, `<button class="iconbtn" data-act="vegtoggle" aria-label="Veg">${icon("leaf")}</button>`);
    const cat = params.cat || "all";
    el.innerHTML = `<div class="menutools">
        <label class="searchbar">${icon("search")}<input id="q" type="search" placeholder="${esc(t("search"))}" value="${esc(menuQ)}" autocomplete="off" enterkeyhint="search"></label>
        <div class="row" style="margin-top:12px;gap:10px">
          <div class="hscroll grow" style="margin:0;padding:2px 0 4px">
            <button class="chip ${cat === "all" ? "on" : ""}" data-cat="all">${icon("grid")}Sab</button>
            ${MENU.cats.map((c) => `<button class="chip ${cat === c.id ? "on" : ""}" data-cat="${esc(c.id)}">${icon(c.icon || "bowl")}${esc(c.n)}</button>`).join("")}
          </div>
        </div>
        <div class="row" style="margin-top:10px;justify-content:space-between">
          <span class="small muted" id="mcount"></span>
          <button class="toggle" data-act="vegtoggle"><span class="vmark"></span>${t("vegOnly")}<span class="switch ${prefs.veg ? "on" : ""}"></span></button>
        </div>
      </div>
      <div id="mlist"></div>`;
    const input = $("#q", el);
    input.addEventListener("input", () => { menuQ = input.value; drawMenuList(current.params.cat || "all"); });
    drawMenuList(cat);
    const chipOn = $(".chip.on", el); if (chipOn && cat !== "all") chipOn.scrollIntoView({ inline: "center", block: "nearest" });
  };
  function itemSide(m) {
    const q = cartQty(m.id);
    const top = `<div class="thumb">${thumbHtml(m)}</div>`;
    if (m.out) return top + `<span class="outtag">${t("out")}</span>`;
    if (q) return top + `<div class="stepper"><button data-dec="${esc(m.id)}" aria-label="Kam">${icon("minus", "sm")}</button><b>${q}</b><button data-add="${esc(m.id)}" aria-label="Zyada">${icon("plus", "sm")}</button></div>`;
    return top + `<button class="addbtn" data-add="${esc(m.id)}">${t("add")} ${icon("plus", "sm")}</button>`;
  }
  function itemRow(m) {
    return `<div class="item ${m.out ? "out" : ""}" data-open="${esc(m.id)}" role="button" tabindex="0">
      <div class="info"><div class="row" style="gap:8px"><span class="vmark ${m.v ? "" : "nv"}"></span>${m.best ? `<span class="best">${icon("star")}Bestseller</span>` : ""}</div>
        <div class="nm">${esc(m.n)}</div>${m.d ? `<div class="ds">${esc(m.d)}</div>` : ""}
        <div class="price">${hasHF(m) ? `<small>${t("half")}</small> ${rupee(m.h)} &nbsp;<small>${t("full")}</small> ${rupee(m.f)}` : rupee(unit(m))}</div></div>
      <div class="side" data-side="${esc(m.id)}">${itemSide(m)}</div></div>`;
  }
  function drawMenuList(cat) {
    const q = menuQ.trim().toLowerCase();
    let list = visibleItems().filter((m) => (!prefs.veg || m.v) && (cat === "all" || m.c === cat) && (!q || (m.n + " " + (m.d || "") + " " + catOf(m.c).n).toLowerCase().includes(q)));
    const box = $("#mlist"); if (!box) return;
    $("#mcount").textContent = `${list.length} dishes`;
    if (!list.length) { box.innerHTML = `<div class="empty"><div class="art">${icon("search", "xl")}</div><h3>Kuch nahi mila</h3><p>Doosra naam try karo ya veg filter hatao</p></div>`; return; }
    box.innerHTML = MENU.cats.map((c) => {
      const its = list.filter((m) => m.c === c.id); if (!its.length) return "";
      return `<section class="catgroup" id="c-${esc(c.id)}"><h3>${icon(c.icon || "bowl")}${esc(c.n)} <small>${its.length}</small></h3>${its.map(itemRow).join("")}</section>`;
    }).join("") + (() => { const orphan = list.filter((m) => !MENU.cats.some((c) => c.id === m.c)); return orphan.length ? `<section class="catgroup"><h3>${icon("bowl")}Aur</h3>${orphan.map(itemRow).join("")}</section>` : ""; })();
  }
  function refreshSides(id) {
    $$(`[data-side="${CSS.escape(id)}"]`).forEach((s) => { const m = item(id); if (m) s.innerHTML = itemSide(m); });
  }

  // item detail sheet
  function openItem(id, wantAdd) {
    const m = item(id); if (!m) return;
    let v = hasHF(m) ? "f" : ""; let q = 1;
    const c = catOf(m.c);
    openSheet(`<div class="bigimg">${thumbHtml(m, false)}</div>
      <div class="row" style="gap:8px;margin-bottom:6px"><span class="vmark ${m.v ? "" : "nv"}"></span><span class="label">${esc(c.n)}</span>${m.best ? `<span class="tagx">Bestseller</span>` : ""}</div>
      <h3>${esc(m.n)}</h3>
      <p class="muted" style="margin:0 0 16px">${esc(m.d || (m.v ? "Veg" : "Non-veg") + " · taaza bana hua, garma-garam")}</p>
      ${hasHF(m) ? `<div class="label" style="margin-bottom:8px">Portion chuno</div><div class="seg" id="vseg"><button data-v="h">${t("half")} <small>${rupee(m.h)}</small></button><button data-v="f" class="on">${t("full")} <small>${rupee(m.f)}</small></button></div>` : ""}
      <div class="row" style="margin-top:20px;gap:12px">
        <div class="stepper inline"><button data-q="-1" aria-label="Kam">${icon("minus", "sm")}</button><b id="iq">1</b><button data-q="1" aria-label="Zyada">${icon("plus", "sm")}</button></div>
        <button class="btn block grow" id="iadd" ${m.out ? "disabled" : ""}>${m.out ? t("out") : `${t("addToCart")} · <span id="itot"></span>`}</button>
      </div>`, (sh, close) => {
      const upd = () => { const tt = $("#itot", sh); if (tt) tt.textContent = rupee(unit(m, v) * q); $("#iq", sh).textContent = q; };
      upd();
      $$("[data-v]", sh).forEach((b) => (b.onclick = () => { v = b.dataset.v; $$("[data-v]", sh).forEach((x) => x.classList.toggle("on", x === b)); upd(); }));
      $$("[data-q]", sh).forEach((b) => (b.onclick = () => { q = Math.max(1, Math.min(20, q + Number(b.dataset.q))); upd(); }));
      $("#iadd", sh).onclick = () => { addToCart(m.id, v, q); refreshSides(m.id); close(); toast(`${m.n} cart mein`); };
    });
  }

  // =============== 3. CART + CHECKOUT ===============
  let checkout = Object.assign({ type: "takeaway", table: "", address: "", notes: "", coupon: "" }, LS.get("checkout", {}));
  const saveCheckout = () => LS.set("checkout", checkout);
  function couponCalc(sub) {
    const code = String(checkout.coupon || "").toUpperCase();
    if (!code) return { disc: 0 };
    const k = (CFG.coupons || []).find((c) => c.on !== false && c.code === code);
    if (!k) return { disc: 0, err: "Ye coupon valid nahi hai" };
    if (sub < (k.min || 0)) return { disc: 0, err: `${rupee(k.min)} se upar ke order pe lagega` };
    let d = k.type === "flat" ? k.value : Math.round((sub * k.value) / 100);
    if (k.max) d = Math.min(d, k.max);
    return { disc: Math.min(d, sub), ok: k };
  }
  function bill() {
    const sub = cartSubtotal();
    const cp = couponCalc(sub);
    const del = checkout.type === "delivery" && CFG.delivery.on;
    const fee = del && !(CFG.delivery.freeAbove && sub - cp.disc >= CFG.delivery.freeAbove) ? CFG.delivery.fee || 0 : 0;
    return { sub, disc: cp.disc, cpErr: cp.err, cpOk: cp.ok, fee, total: Math.max(0, sub - cp.disc + fee) };
  }
  SCREENS.cart = (el) => {
    const lines = cartLines();
    titleBar(t("cart"), lines.length ? `${cartCount()} ${t("items")}` : "Aapka order", lines.length ? `<button class="iconbtn" data-act="clearcart" aria-label="Clear">${icon("trash")}</button>` : "");
    if (!lines.length) {
      el.innerHTML = `<div class="empty stagger"><div class="art">${icon("bag", "xl")}</div><h3>${t("cartEmpty")}</h3><p>${t("cartEmptySub")}</p><a class="btn" href="#/menu">${icon("menu")}${t("browse")}</a></div>`;
      return;
    }
    if (!CFG.delivery.on && checkout.type === "delivery") checkout.type = "takeaway";
    if (!CFG.dineIn && checkout.type === "dinein") checkout.type = "takeaway";
    const b = bill();
    const st = statusLine();
    const types = [["dinein", "table", t("dinein"), CFG.dineIn !== false], ["takeaway", "bag", t("takeaway"), CFG.takeaway !== false], ["delivery", "bike", t("delivery"), CFG.delivery.on]].filter((x) => x[3]);
    el.innerHTML = `<div class="stagger">
      ${st.op ? "" : `<div class="notice" style="margin-top:6px">${icon("clock", "sm")}<span>Cafe abhi band hai. ${fmt12(CFG.open)} ke baad order kar paayenge.</span></div>`}
      <div class="card pad" style="margin-top:8px;padding-top:4px;padding-bottom:4px">
        ${lines.map((c) => `<div class="citem"><div class="thumb">${thumbHtml(c.m)}</div><div class="grow"><div class="row" style="gap:7px"><span class="vmark ${c.m.v ? "" : "nv"}"></span><span class="nm">${esc(c.m.n)}</span></div><div class="vr">${c.v ? (c.v === "h" ? t("half") : t("full")) + " · " : ""}${rupee(unit(c.m, c.v))}${c.m.out ? ` · <b style="color:var(--bad)">${t("out")}</b>` : ""}</div></div>
          <div style="text-align:right"><div class="stepper inline"><button data-cq="${esc(c.key)}|-1" aria-label="Kam">${icon("minus", "sm")}</button><b>${c.q}</b><button data-cq="${esc(c.key)}|1" aria-label="Zyada">${icon("plus", "sm")}</button></div><div class="price" style="margin-top:6px;font-size:14px">${rupee(unit(c.m, c.v) * c.q)}</div></div></div>`).join("")}
        <a href="#/menu" class="row small" style="padding:12px 0;color:var(--gold-ink);font-weight:600;gap:6px">${icon("plus", "sm")}Aur items add karo</a>
      </div>
      <div class="sec" style="margin-top:22px"><h2>${t("orderType")}</h2></div>
      <div class="ordertype"><div class="seg">${types.map(([k, ic, lb]) => `<button data-type="${k}" class="${checkout.type === k ? "on" : ""}">${icon(ic)}${lb}</button>`).join("")}</div></div>
      <div class="card pad" style="margin-top:12px">
        ${checkout.type === "dinein" ? `<label class="field" style="margin-top:0"><span>${t("table")}</span><input class="input" id="ctable" inputmode="numeric" maxlength="4" placeholder="Jaise 4" value="${esc(checkout.table)}"></label><div class="help">${icon("qr")}Table pe laga QR scan kiya ho toh number apne aap aa jaata hai</div>` : ""}
        ${checkout.type === "delivery" ? `<label class="field" style="margin-top:0"><span>${t("address")}</span><textarea class="input" id="caddr" rows="3" placeholder="Ghar / gali / landmark, Govindpur">${esc(checkout.address || (user && user.address) || "")}</textarea></label><div class="help">${icon("truck")}${esc(CFG.delivery.area || "")}${CFG.delivery.minOrder ? ` · Minimum ${rupee(CFG.delivery.minOrder)}` : ""}${CFG.delivery.freeAbove ? ` · ${rupee(CFG.delivery.freeAbove)}+ pe free delivery` : ""}</div>` : ""}
        ${checkout.type === "takeaway" ? `<div class="row" style="gap:12px"><span class="lic" style="width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:var(--bg2)">${icon("store")}</span><div class="grow"><b style="font-size:14px">Counter se pickup</b><div class="small muted">${esc(CFG.address)}</div></div></div>` : ""}
        <label class="field"><span>Note</span><textarea class="input" id="cnotes" rows="2" placeholder="${esc(t("notes"))}">${esc(checkout.notes)}</textarea></label>
        <label class="field"><span>${t("coupon")}</span><div class="row" style="gap:8px"><input class="input grow ${b.cpErr ? "err" : ""}" id="ccoupon" placeholder="KANAK10" value="${esc(checkout.coupon)}" style="text-transform:uppercase"><button class="btn sm ghost" data-act="coupon" style="height:50px">${t("apply")}</button></div></label>
        ${b.cpErr ? `<div class="help" style="color:var(--bad)">${icon("info")}${esc(b.cpErr)}</div>` : b.cpOk ? `<div class="help" style="color:var(--ok)">${icon("check")}Coupon laga · ${rupee(b.disc)} bachaye</div>` : (CFG.coupons || []).filter((k) => k.on !== false).length ? `<div class="help">${icon("tag")}Codes: ${(CFG.coupons || []).filter((k) => k.on !== false).map((k) => esc(k.code)).join(", ")}</div>` : ""}
      </div>
      <div class="card pad bill" style="margin-top:12px">
        <div class="r"><span>${t("subtotal")}</span><span>${rupee(b.sub)}</span></div>
        ${b.disc ? `<div class="r disc"><span>${t("discount")}</span><span>− ${rupee(b.disc)}</span></div>` : ""}
        ${checkout.type === "delivery" ? `<div class="r"><span>${t("fee")}</span><span>${b.fee ? rupee(b.fee) : "Free"}</span></div>` : ""}
        <div class="r tot"><span>${t("total")}</span><span>${rupee(b.total)}</span></div>
      </div>
      <div class="card loginline" style="margin-top:12px">
        ${user ? `<span class="avatar">${esc(initials(user.name))}</span><div class="grow"><b style="font-size:14px">${esc(user.name)}</b><div class="small muted">+91 ${esc(user.phone)}</div></div><a class="small" href="#/profile" style="color:var(--gold-ink);font-weight:600">Badlo</a>`
        : `<span class="avatar" style="background:var(--gold-soft);color:var(--gold-ink)">${icon("lock")}</span><div class="grow"><b style="font-size:14px">${t("loginFirst")}</b><div class="small muted">Sirf naam + mobile, 10 second</div></div><button class="btn sm" data-act="login">${t("login")}</button>`}
      </div>
      <p class="small muted" style="text-align:center;margin-top:14px">Order cafe ke WhatsApp pe jaata hai · Payment cafe pe (cash / UPI)</p>
      <div style="height:70px"></div>
    </div>
`;
    $("#dock").innerHTML = `<div class="checkoutbar"><button class="btn block" data-act="place"><span>${rupee(b.total)} · ${cartCount()} ${t("items")}</span><span>${user ? t("place") : t("loginToOrder")} ${icon("chev", "sm")}</span></button></div>`;
    const bind = (id, k) => { const i = $("#" + id, el); if (i) i.addEventListener("input", () => { checkout[k] = i.value; saveCheckout(); }); };
    bind("ctable", "table"); bind("caddr", "address"); bind("cnotes", "notes"); bind("ccoupon", "coupon");
  };

  async function placeOrder() {
    const lines = cartLines(); if (!lines.length) return;
    if (!user) return openLogin(() => placeOrder());
    const st = statusLine();
    if (!st.op) return toast("Cafe abhi band hai — " + fmt12(CFG.open) + " ke baad order karein", "clock");
    if (lines.some((c) => c.m.out)) return toast("Kuch item khatam hain — cart se hatao", "info");
    const b = bill();
    if (checkout.type === "dinein" && !String(checkout.table).trim()) { $("#ctable")?.focus(); $("#ctable")?.classList.add("err"); return toast("Table number daalo", "info"); }
    if (checkout.type === "delivery") {
      if (!String(checkout.address).trim() || checkout.address.trim().length < 8) { $("#caddr")?.focus(); $("#caddr")?.classList.add("err"); return toast("Poora address daalo", "info"); }
      if (CFG.delivery.minOrder && b.sub < CFG.delivery.minOrder) return toast(`Delivery ke liye minimum ${rupee(CFG.delivery.minOrder)}`, "info");
    }
    const btn = $('[data-act="place"]'); if (btn) { btn.disabled = true; btn.innerHTML = `<span>Order bhej rahe hain…</span><span class="spin"></span>`; }
    const items = lines.map((c) => ({ id: c.id, n: c.m.n, v: c.v, q: c.q, price: unit(c.m, c.v) }));
    const payload = { items, customer: { name: user.name, phone: user.phone }, type: checkout.type, table: checkout.table, address: checkout.type === "delivery" ? checkout.address : "", notes: checkout.notes, coupon: b.cpOk ? b.cpOk.code : "", subtotal: b.sub, discount: b.disc, fee: b.fee, total: b.total };
    let id = "", synced = false;
    try { const r = await api("/order", { body: payload, timeout: 8000 }); id = r.id; synced = true; } catch (e) { id = "L" + Date.now().toString(36).toUpperCase().slice(-6); }
    if (checkout.type === "delivery" && user) { user.address = checkout.address; LS.set("user", user); }
    const order = { ...payload, id, synced, status: "new", at: new Date().toISOString() };
    orders.unshift(order); orders = orders.slice(0, 50); LS.set("orders", orders);
    cart = []; saveCart(); checkout.coupon = ""; checkout.notes = ""; saveCheckout();
    const msg = waMessage(order);
    location.hash = "#/orders";
    setTimeout(() => openSheet(`<div style="text-align:center;padding:10px 0 4px">
        <div class="empty" style="padding:6px 0 0"><div class="art" style="background:color-mix(in srgb,var(--ok) 14%,transparent);color:var(--ok)">${icon("check", "xl")}</div></div>
        <h3>Order ready!</h3><p class="muted" style="margin:0 0 6px">Order no. <b style="color:var(--ink)">#${esc(id)}</b> · ${rupee(order.total)}</p>
        <p class="small muted" style="margin:0 0 18px">${synced ? "Cafe ke system mein pahunch gaya." : "Internet slow tha, isliye abhi sirf WhatsApp se jaayega."} Ab WhatsApp pe bhej dijiye taaki cafe turant confirm kare.</p>
        <a class="btn block gold" href="${waLink(CFG.whatsapp, msg)}" target="_blank" rel="noopener" data-close>${icon("chat")}WhatsApp pe order bhejo</a>
        <button class="btn block ghost" style="margin-top:10px" data-close>Baad mein</button></div>`), 250);
  }
  function waMessage(o) {
    const L = [];
    L.push(`*Naya Order — ${CFG.short || CFG.name}*`);
    L.push(`Order no: #${o.id}`);
    L.push("");
    o.items.forEach((x, i) => L.push(`${i + 1}. ${x.n}${x.v ? " (" + (x.v === "h" ? "Half" : "Full") + ")" : ""} x ${x.q} = ${rupee(x.price * x.q)}`));
    L.push("");
    L.push(`Item total: ${rupee(o.subtotal)}`);
    if (o.discount) L.push(`Discount${o.coupon ? " (" + o.coupon + ")" : ""}: -${rupee(o.discount)}`);
    if (o.type === "delivery") L.push(`Delivery: ${o.fee ? rupee(o.fee) : "Free"}`);
    L.push(`*Total: ${rupee(o.total)}*`);
    L.push("");
    L.push(`Type: ${o.type === "dinein" ? "Dine-in (Table " + o.table + ")" : o.type === "delivery" ? "Delivery" : "Takeaway"}`);
    if (o.type === "delivery") L.push(`Address: ${o.address}`);
    L.push(`Naam: ${o.customer.name}`);
    L.push(`Mobile: ${o.customer.phone}`);
    if (o.notes) L.push(`Note: ${o.notes}`);
    L.push("");
    L.push("(App se order — " + appUrl() + ")");
    return L.join("\n");
  }

  // =============== 4. ORDERS ===============
  const STATUS = { new: "Bheja gaya", accepted: "Accept hua", preparing: "Ban raha hai", ready: "Ready hai", out: "Raste mein", done: "Complete", cancelled: "Cancel hua" };
  const STEPS = ["new", "accepted", "preparing", "ready", "done"];
  let lastStatusPoll = 0;
  SCREENS.orders = (el) => {
    titleBar(t("orders"), orders.length ? `${orders.length} orders` : "Aapke orders", orders.length ? `<button class="iconbtn" data-act="pollstatus" aria-label="Refresh">${icon("refresh")}</button>` : "");
    if (!orders.length) {
      el.innerHTML = `<div class="empty stagger"><div class="art">${icon("receipt", "xl")}</div><h3>${t("noOrders")}</h3><p>${t("noOrdersSub")}</p><a class="btn" href="#/menu">${icon("menu")}${t("browse")}</a></div>`;
      return;
    }
    el.innerHTML = `<div class="stagger" style="margin-top:6px">${orders.map((o) => {
      const step = o.status === "out" ? 3.5 : STEPS.indexOf(o.status);
      return `<div class="card ocard"><div class="hd"><div><div class="id">#${esc(o.id)}</div><div class="when">${esc(timeAgo(o.at))} · ${o.type === "dinein" ? "Dine-in · Table " + esc(o.table) : o.type === "delivery" ? "Delivery" : "Takeaway"}</div></div><span class="status ${esc(o.status)}">${esc(STATUS[o.status] || o.status)}</span></div>
        ${o.status !== "cancelled" ? `<div class="track">${STEPS.map((s, i) => `<i class="${i <= step ? "on" : ""}"></i>`).join("")}</div>` : ""}
        <div class="its">${o.items.map((x) => `${esc(x.n)}${x.v ? " (" + (x.v === "h" ? "H" : "F") + ")" : ""} × ${x.q}`).join(", ")}</div>
        <div class="ft"><span class="price grow">${rupee(o.total)}</span><a class="btn sm ghost" href="${waLink(CFG.whatsapp, waMessage(o))}" target="_blank" rel="noopener">${icon("chat", "sm")}WhatsApp</a><button class="btn sm" data-reorder="${esc(o.id)}">${icon("refresh", "sm")}${t("reorder")}</button></div></div>`;
    }).join("")}<p class="small muted" style="text-align:center">Status cafe update karta hai · ${online === false ? "abhi offline" : "pull karne ke liye refresh dabao"}</p></div>`;
    if (Date.now() - lastStatusPoll > 20000) pollStatus();
  };
  async function pollStatus(manual) {
    lastStatusPoll = Date.now();
    const ids = orders.filter((o) => o.synced && !["done", "cancelled"].includes(o.status)).map((o) => o.id).slice(0, 30);
    if (!ids.length) { if (manual) toast("Sab orders updated"); return; }
    try {
      const r = await api("/order-status?ids=" + ids.join(","));
      let ch = false;
      orders.forEach((o) => { const s = r.statuses[o.id]; if (s && s !== o.status) { o.status = s; ch = true; } });
      if (ch) { LS.set("orders", orders); if (current.name === "orders") render({ keepScroll: true, quiet: true }); }
      if (manual) toast(ch ? "Status update hua" : "Koi naya update nahi");
    } catch (e) { if (manual) toast(e.message, "info"); }
  }
  function reorder(id) {
    const o = orders.find((x) => x.id === id); if (!o) return;
    let added = 0;
    o.items.forEach((x) => { const m = item(x.id); if (m && !m.out) { addToCart(m.id, x.v, x.q); added++; } });
    if (!added) return toast("Ye items abhi available nahi", "info");
    toast(added === o.items.length ? "Saare items cart mein" : `${added} items cart mein (kuch khatam hain)`);
    go("#/cart");
  }

  // =============== 5. PROFILE / LOGIN ===============
  function loginForm(prefix) {
    return `<label class="field"><span>${t("name")}</span><input class="input" id="${prefix}name" autocomplete="name" placeholder="Jaise Rahul Kumar" maxlength="40" value="${esc(user ? user.name : "")}"></label>
      <label class="field"><span>${t("mobile")}</span><div class="row" style="gap:8px"><span class="input" style="width:64px;display:grid;place-items:center;flex:none">+91</span><input class="input grow" id="${prefix}phone" inputmode="numeric" autocomplete="tel-national" placeholder="10 digit number" maxlength="10" value="${esc(user ? user.phone : "")}"></div></label>
      <div class="help">${icon("shield")}Number sirf aapke order ke liye hai, cafe aapko call/WhatsApp kar sake. OTP verification nahi hai — sahi number daaliye.</div>`;
  }
  function readLogin(sh, prefix) {
    const n = $("#" + prefix + "name", sh), p = $("#" + prefix + "phone", sh);
    const name = n.value.trim().replace(/\s+/g, " "); const phone = p.value.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
    n.classList.toggle("err", name.length < 2); p.classList.toggle("err", !/^[6-9]\d{9}$/.test(phone));
    if (name.length < 2) { n.focus(); toast("Naam daaliye", "info"); return null; }
    if (!/^[6-9]\d{9}$/.test(phone)) { p.focus(); toast("Sahi 10 digit mobile number daaliye", "info"); return null; }
    return { name, phone, address: (user && user.address) || "", since: (user && user.since) || new Date().toISOString() };
  }
  function openLogin(then) {
    openSheet(`<div class="row" style="gap:12px;margin-bottom:6px"><span class="avatar">${icon("user")}</span><div><h3 style="margin:0">${t("login")}</h3><div class="small muted">${t("loginFirst")}</div></div></div>${loginForm("l")}
      <button class="btn block" style="margin-top:18px" id="ldo">${t("saveLogin")} ${icon("chev", "sm")}</button>`, (sh, close) => {
      setTimeout(() => $("#lname", sh).focus(), 350);
      $("#ldo", sh).onclick = () => { const u = readLogin(sh, "l"); if (!u) return; user = u; LS.set("user", user); close(); toast("Welcome, " + user.name.split(" ")[0] + "!"); render({ keepScroll: true, quiet: true }); if (then) setTimeout(then, 450); };
    });
  }
  SCREENS.profile = (el) => {
    titleBar(t("profile"), user ? "Aapka account" : "Login", "", "#/settings");
    if (!user) {
      el.innerHTML = `<div class="stagger"><div class="card pad" style="margin-top:8px">
        <div class="row" style="gap:14px"><span class="avatar" style="width:54px;height:54px;border-radius:18px">${icon("user", "lg")}</span><div><h3 class="serif" style="margin:0;font-size:21px;font-weight:600">Login karein</h3><div class="small muted">Order karne ke liye zaroori</div></div></div>
        ${loginForm("p")}<button class="btn block" style="margin-top:18px" id="pdo">${t("saveLogin")}</button></div>
        <div class="card list" style="margin-top:14px">
          <div class="li"><span class="lic">${icon("receipt")}</span><div class="tx"><b>Order history</b><small>Login ke baad aapke saare orders yahan</small></div></div>
          <div class="li"><span class="lic">${icon("refresh")}</span><div class="tx"><b>1-tap reorder</b><small>Pichla order dobara ek tap mein</small></div></div>
          <div class="li"><span class="lic">${icon("pin")}</span><div class="tx"><b>Saved address</b><small>Delivery ke time baar baar likhna nahi</small></div></div>
        </div></div>`;
      $("#pdo", el).onclick = () => { const u = readLogin(el, "p"); if (!u) return; user = u; LS.set("user", user); toast("Welcome, " + user.name.split(" ")[0] + "!"); render({ quiet: true }); };
      return;
    }
    const spent = orders.reduce((a, o) => a + (o.status === "cancelled" ? 0 : o.total || 0), 0);
    el.innerHTML = `<div class="stagger">
      <div class="card profilehead" style="margin-top:8px"><span class="avatar">${esc(initials(user.name))}</span><div class="grow"><h3 class="serif" style="margin:0;font-size:21px;font-weight:600">${esc(user.name)}</h3><div class="small muted">+91 ${esc(user.phone)}</div></div><button class="iconbtn" data-act="editprofile" aria-label="Edit">${icon("edit")}</button></div>
      <div class="grid2" style="margin-top:12px"><div class="card pad"><div class="label">Orders</div><div class="serif" style="font-size:26px;font-weight:600">${orders.length}</div></div><div class="card pad"><div class="label">Total</div><div class="serif" style="font-size:26px;font-weight:600">${rupee(spent)}</div></div></div>
      <div class="setgroup"><span class="label">Delivery address</span><div class="card pad"><textarea class="input" id="paddr" rows="2" placeholder="Ghar / gali / landmark">${esc(user.address || "")}</textarea><button class="btn sm ghost" style="margin-top:10px" id="psave">${icon("check", "sm")}Address save karo</button></div></div>
      <div class="setgroup"><div class="card list">
        <a class="li" href="#/orders"><span class="lic">${icon("receipt")}</span><span class="tx"><b>Mere orders</b><small>Status aur reorder</small></span>${icon("chev")}</a>
        <a class="li" href="#/settings"><span class="lic">${icon("settings")}</span><span class="tx"><b>Settings</b><small>Theme, bhasha, app install</small></span>${icon("chev")}</a>
        <button class="li danger" data-act="logout"><span class="lic">${icon("logout")}</span><span class="tx"><b>${t("logout")}</b><small>Is phone se naam/number hatao</small></span></button>
      </div></div>
      <div class="help" style="margin-top:14px">${icon("info")}Login is phone mein save hai. OTP verification nahi hai.</div></div>`;
    $("#psave", el).onclick = () => { user.address = $("#paddr", el).value.trim(); LS.set("user", user); toast("Address save ho gaya"); };
  };

  // =============== 6. SETTINGS ===============
  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferredPrompt = e; });
  window.addEventListener("appinstalled", () => { deferredPrompt = null; toast("App install ho gaya"); });
  const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  SCREENS.settings = (el) => {
    titleBar(t("settings"), "App & account");
    el.innerHTML = `<div class="stagger">
      <a class="card profilehead" href="#/profile" style="margin-top:8px">${user ? `<span class="avatar">${esc(initials(user.name))}</span><div class="grow"><b style="font-size:16px">${esc(user.name)}</b><div class="small muted">+91 ${esc(user.phone)} · Profile dekho</div></div>` : `<span class="avatar" style="background:var(--gold-soft);color:var(--gold-ink)">${icon("user", "lg")}</span><div class="grow"><b style="font-size:16px">Login / Sign up</b><div class="small muted">Order karne ke liye naam + mobile</div></div>`}${icon("chev")}</a>
      <div class="setgroup"><span class="label">Look</span><div class="card pad">
        <div class="row" style="justify-content:space-between;gap:10px"><span class="row" style="gap:10px;font-weight:600;font-size:14.5px">${icon(prefs.theme === "dark" ? "moon" : "sun")}${t("theme")}</span>
          <div class="seg" style="width:220px">${["light", "dark", "auto"].map((k) => `<button data-settheme="${k}" class="${prefs.theme === k ? "on" : ""}">${t(k)}</button>`).join("")}</div></div>
        <div class="divider"></div>
        <div class="row" style="justify-content:space-between;gap:10px"><span class="row" style="gap:10px;font-weight:600;font-size:14.5px">${icon("globe")}${t("language")}</span>
          <div class="seg" style="width:220px"><button data-setlang="hi" class="${prefs.lang === "hi" ? "on" : ""}">Hinglish</button><button data-setlang="en" class="${prefs.lang === "en" ? "on" : ""}">English</button></div></div>
      </div></div>
      <div class="setgroup"><span class="label">App</span><div class="card list">
        <button class="li" data-act="install"><span class="lic">${icon("download")}</span><span class="tx"><b>${t("install")}</b><small>${isStandalone() ? "Install ho chuka hai" : "Home screen pe, bina Play Store ke"}</small></span>${icon("chev")}</button>
        <button class="li" data-act="share"><span class="lic">${icon("share")}</span><span class="tx"><b>${t("shareApp")}</b><small>Doston ko link bhejo</small></span>${icon("chev")}</button>
        <button class="li" data-act="qr"><span class="lic">${icon("qr")}</span><span class="tx"><b>${t("qr")}</b><small>Scan karke app kholo · table QR</small></span>${icon("chev")}</button>
      </div></div>
      <div class="setgroup"><span class="label">${t("contact")}</span><div class="card list">
        <a class="li" href="${telLink()}"><span class="lic">${icon("phone")}</span><span class="tx"><b>Call karo</b><small>${esc(fmtPhone(CFG.phone))}</small></span>${icon("chev")}</a>
        <a class="li" href="${waLink(CFG.whatsapp, "Namaste!")}" target="_blank" rel="noopener"><span class="lic">${icon("chat")}</span><span class="tx"><b>WhatsApp</b><small>Order ya sawaal</small></span>${icon("chev")}</a>
        <a class="li" href="${esc(CFG.maps)}" target="_blank" rel="noopener"><span class="lic">${icon("pin")}</span><span class="tx"><b>Directions</b><small>${esc(CFG.address)}</small></span>${icon("chev")}</a>
        ${CFG.instagram ? `<a class="li" href="https://instagram.com/${esc(CFG.instagram)}" target="_blank" rel="noopener"><span class="lic">${icon("insta")}</span><span class="tx"><b>Instagram</b><small>@${esc(CFG.instagram)}</small></span>${icon("chev")}</a>` : ""}
        <button class="li" data-act="about"><span class="lic">${icon("info")}</span><span class="tx"><b>${t("about")}</b><small>${esc(CFG.name)} · v${esc(S.version)}</small></span>${icon("chev")}</button>
      </div></div>
      <div class="setgroup"><span class="label">Cafe owner</span><div class="card list">
        ${ownerToken ? `<a class="li owner" href="#/owner"><span class="lic">${icon("grid")}</span><span class="tx"><b>${t("ownerPanel")}</b><small>Menu, price, offers, timing, orders — sab control</small></span>${icon("chev")}</a>
          <button class="li" data-act="ownerlogout"><span class="lic">${icon("logout")}</span><span class="tx"><b>Owner logout</b><small>Is phone se owner access hatao</small></span></button>`
        : `<button class="li" data-act="ownerlogin"><span class="lic">${icon("lock")}</span><span class="tx"><b>${t("ownerLogin")}</b><small>Sirf cafe owner ke liye (password)</small></span>${icon("chev")}</button>`}
      </div></div>
      <p class="foot">${esc(CFG.name)}<br>App by ${esc(S.madeBy)} · v${esc(S.version)}${online === false ? " · offline" : ""}</p></div>`;
    if (ownerToken) api("/owner/check", { owner: true }).catch((e) => { if (e.status === 401) { ownerToken = null; LS.del("owner"); if (current.name === "settings") render({ quiet: true, keepScroll: true }); } });
  };
  async function doInstall() {
    if (isStandalone()) return toast("App pehle se install hai");
    if (deferredPrompt) { deferredPrompt.prompt(); const r = await deferredPrompt.userChoice.catch(() => ({})); deferredPrompt = null; if (r.outcome === "accepted") toast("Install ho raha hai"); return; }
    openSheet(`<h3>App install karo</h3><p class="muted" style="margin:0 0 14px">Play Store ki zaroorat nahi — 2 step:</p>
      <div class="card list">${isIOS() ? `<div class="li"><span class="lic">${icon("share")}</span><span class="tx"><b>1. Safari mein Share dabao</b><small>Neeche beech wala button</small></span></div><div class="li"><span class="lic">${icon("plus")}</span><span class="tx"><b>2. "Add to Home Screen"</b><small>Phir Add dabao</small></span></div>`
      : `<div class="li"><span class="lic">${icon("down")}</span><span class="tx"><b>1. Chrome ka menu (3 dots)</b><small>Upar right corner</small></span></div><div class="li"><span class="lic">${icon("download")}</span><span class="tx"><b>2. "Install app" / "Add to Home screen"</b><small>Phir Install dabao</small></span></div>`}</div>
      <button class="btn block" style="margin-top:16px" data-close>Theek hai</button>`);
  }
  async function doShare() {
    const url = appUrl(); const text = `${CFG.name} — menu dekho aur seedha order karo:`;
    if (navigator.share) { try { await navigator.share({ title: CFG.name, text, url }); return; } catch (e) { if (e.name === "AbortError") return; } }
    openSheet(`<h3>App share karo</h3><div class="input" style="display:flex;align-items:center;font-size:13px;overflow:hidden;white-space:nowrap;margin:10px 0 14px">${esc(url)}</div>
      <div class="grid2"><button class="btn ghost" id="cpy">${icon("link", "sm")}Copy link</button><a class="btn gold" href="${waLink("", text + " " + url)}" target="_blank" rel="noopener">${icon("chat", "sm")}WhatsApp</a></div>`, (sh) => { $("#cpy", sh).onclick = () => copyText(url); });
  }
  async function copyText(s) {
    try { await navigator.clipboard.writeText(s); toast("Link copy ho gaya"); }
    catch (e) { const ta = document.createElement("textarea"); ta.value = s; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); toast("Link copy ho gaya"); } catch (_) { toast(s); } ta.remove(); }
  }
  function qrSvg(text) { try { const qr = qrcode(0, "M"); qr.addData(text); qr.make(); return qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true }); } catch (e) { return ""; } }
  function showQR() {
    let table = "";
    const draw = (sh) => { const u = appUrl() + (table ? "?table=" + encodeURIComponent(table) + "#/menu" : ""); $(".qrbox", sh).innerHTML = qrSvg(u); $("#qru", sh).textContent = u; };
    openSheet(`<h3>Scan karke order karo</h3><p class="muted small" style="margin:0">Counter / table pe print karke lagao</p>
      <div class="qrbox"></div><p class="tiny muted" id="qru" style="text-align:center;word-break:break-all;margin:0 0 12px"></p>
      <label class="field"><span>Table QR (optional) — table number</span><input class="input" id="qrt" inputmode="numeric" maxlength="4" placeholder="Khaali = general QR"></label>
      <div class="grid2" style="margin-top:14px"><button class="btn ghost" id="qrdl">${icon("download", "sm")}Download</button><button class="btn" id="qrpr">${icon("note", "sm")}Print</button></div>`, (sh) => {
      draw(sh);
      $("#qrt", sh).oninput = (e) => { table = e.target.value.replace(/\D/g, ""); draw(sh); };
      $("#qrdl", sh).onclick = () => { const svg = $(".qrbox svg", sh); if (!svg) return; const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `kanak-qr${table ? "-table-" + table : ""}.svg`; a.click(); };
      $("#qrpr", sh).onclick = () => { const w = window.open("", "_blank"); if (!w) return toast("Popup allow karo", "info"); w.document.write(`<html><head><title>QR</title></head><body style="font-family:Georgia,serif;text-align:center;padding:40px"><h1 style="margin:0">${esc(CFG.name)}</h1><p style="font-family:sans-serif">Scan karo · Menu dekho · Order karo${table ? " · Table " + table : ""}</p><div style="width:320px;margin:20px auto">${$(".qrbox", sh).innerHTML}</div><p style="font-family:sans-serif;font-size:13px">${esc(fmtPhone(CFG.phone))}</p></body></html>`); w.document.close(); setTimeout(() => w.print(), 400); };
    });
  }
  function showAbout() {
    openSheet(`<div class="row" style="gap:14px;margin-bottom:14px"><img src="img/logo.webp" alt="" style="width:60px;height:60px;border-radius:18px;object-fit:cover"><div><h3 style="margin:0">${esc(CFG.name)}</h3><div class="small muted">${esc(CFG.tagline)}</div></div></div>
      <div class="card pad">
        <div class="kv"><span>Timing</span><span>${fmt12(CFG.open)} – ${fmt12(CFG.close)}</span></div>
        <div class="kv"><span>Rating</span><span>${esc(S.rating)} · ${esc(S.reviews)} reviews</span></div>
        <div class="kv"><span>Price</span><span>${esc(S.priceRange)}</span></div>
        <div class="kv"><span>Services</span><span style="text-align:right">${(S.services || []).map(esc).join(", ")}</span></div>
        <div class="kv"><span>Address</span><span style="text-align:right;max-width:62%">${esc(CFG.address)}</span></div>
      </div>
      <p class="small muted" style="margin:16px 0 0">App version ${esc(S.version)} · Offline bhi khulta hai · Banaya: <a href="${waLink(S.madeByWhatsapp, "Hi Misbah, mujhe bhi aisa app chahiye")}" target="_blank" rel="noopener" style="color:var(--gold-ink);font-weight:600">${esc(S.madeBy)}</a></p>`);
  }

  // ---------- owner login / setup ----------
  async function openOwnerLogin() {
    let pwSet = null;
    const close = openSheet(`<div class="row" style="gap:12px;margin-bottom:4px"><span class="avatar">${icon("lock")}</span><div><h3 style="margin:0">Owner Login</h3><div class="small muted">Sirf cafe owner ke liye</div></div></div>
      <div id="olbody"><div class="row" style="justify-content:center;padding:30px"><span class="spin"></span></div></div>`, async (sh) => {
      try { pwSet = (await api("/owner/status")).passwordSet; } catch (e) { $("#olbody", sh).innerHTML = `<div class="notice">${icon("info", "sm")}<span>Server se connect nahi hua (${esc(e.message)}). Internet check karke dobara kholo.</span></div>`; return; }
      drawLogin(sh);
    });
    function drawLogin(sh) {
      const b = $("#olbody", sh);
      if (!pwSet) return drawSetup(sh, true);
      b.innerHTML = `<label class="field"><span>Owner password</span><input class="input" id="opw" type="password" autocomplete="current-password" placeholder="••••••"></label>
        <button class="btn block" style="margin-top:16px" id="odo">${icon("key", "sm")}Login</button>
        <button class="small" style="margin-top:14px;color:var(--gold-ink);font-weight:600;width:100%" id="oreset">Password bhool gaye? Reset (Misbah Digital)</button>`;
      setTimeout(() => $("#opw", sh)?.focus(), 350);
      const go2 = async () => {
        const pw = $("#opw", sh).value; if (!pw) return;
        const btn = $("#odo", sh); btn.disabled = true; btn.innerHTML = `<span class="spin"></span>`;
        try { const r = await api("/owner/login", { body: { password: pw } }); ownerToken = r.token; LS.set("owner", ownerToken); close(); toast("Owner Panel unlock ho gaya", "shield"); go("#/owner"); }
        catch (e) { btn.disabled = false; btn.innerHTML = `${icon("key", "sm")}Login`; $("#opw", sh).classList.add("err"); toast(e.message, "info"); }
      };
      $("#odo", sh).onclick = go2; $("#opw", sh).onkeydown = (e) => { if (e.key === "Enter") go2(); };
      $("#oreset", sh).onclick = () => drawSetup(sh, false);
    }
    function drawSetup(sh, first) {
      $("#olbody", sh).innerHTML = `<div class="notice" style="margin-top:10px">${icon("shield", "sm")}<span>${first ? "Owner password abhi set nahi hai. Pehli baar setup:" : "Password reset:"} ye kaam app banane wala (Misbah Digital) apni secret Dashboard key se karta hai.</span></div>
        <label class="field"><span>Dashboard key (Misbah Digital)</span><input class="input" id="sk" type="password" autocomplete="off" placeholder="Secret key"></label>
        <label class="field"><span>Naya owner password</span><input class="input" id="sp1" type="password" autocomplete="new-password" placeholder="Kam se kam 6 characters"></label>
        <label class="field"><span>Password dobara</span><input class="input" id="sp2" type="password" autocomplete="new-password"></label>
        <button class="btn block" style="margin-top:16px" id="sdo">${icon("check", "sm")}Password set karo</button>
        ${first ? "" : `<button class="small" style="margin-top:14px;color:var(--muted);width:100%" id="sback">Wapas login pe</button>`}`;
      if (!first) $("#sback", sh).onclick = () => drawLogin(sh);
      $("#sdo", sh).onclick = async () => {
        const k = $("#sk", sh).value.trim(), p1 = $("#sp1", sh).value, p2 = $("#sp2", sh).value;
        if (!k) return toast("Dashboard key daalo", "info");
        if (p1.length < 6) return toast("Password kam se kam 6 characters", "info");
        if (p1 !== p2) return toast("Dono password same nahi hain", "info");
        const btn = $("#sdo", sh); btn.disabled = true; btn.innerHTML = `<span class="spin"></span>`;
        try {
          await api("/owner/set-password", { body: { password: p1 }, key: k });
          const r = await api("/owner/login", { body: { password: p1 } });
          ownerToken = r.token; LS.set("owner", ownerToken); close(); toast("Password set · Owner Panel khul gaya", "shield"); go("#/owner");
        } catch (e) { btn.disabled = false; btn.innerHTML = `${icon("check", "sm")}Password set karo`; toast(e.message, "info"); }
      };
    }
  }

  // =============== OWNER PANEL ===============
  const OTABS = [["orders", "receipt", "Orders"], ["items", "menu", "Menu items"], ["cats", "grid", "Categories"], ["offers", "gift", "Offers"], ["timing", "clock", "Timing & delivery"], ["info", "store", "Cafe info"], ["security", "shield", "Password"]];
  const CAT_ICONS = ["dumpling", "drumstick", "wrap", "combo", "noodles", "pizza", "fries", "pasta", "cup", "bowl", "flame", "leaf", "star", "gift"];
  let ownerOrders = null, ownerOrdersAt = 0, ownerPoll, itemQ = "", itemCat = "all";
  function ownerFail(e) {
    if (e.status === 401) { ownerToken = null; LS.del("owner"); toast("Owner login expire ho gaya — dobara login karo", "lock"); go("#/settings"); return; }
    toast(e.message, "info");
  }
  async function saveMenu(msg) {
    try {
      const r = await api("/owner/menu", { owner: true, body: { menu: { cats: MENU.cats, items: MENU.items }, baseV: MENU_V || null } });
      MENU_V = r.v; LS.set("menu", MENU); LS.set("menuV", MENU_V);
      toast(msg || "Save ho gaya — sabke phone pe update", "check"); return true;
    } catch (e) {
      if (e.status === 409) { toast("Kisi aur phone se change hua tha — latest la rahe hain", "refresh"); await fetchRemote(true); }
      else ownerFail(e);
      return false;
    }
  }
  async function saveConfig(msg) {
    try { const r = await api("/owner/config", { owner: true, body: { config: CFG } }); if (r.at) CFG.at = r.at; LS.set("config", CFG); toast(msg || "Save ho gaya — sabke phone pe update"); return true; }
    catch (e) { ownerFail(e); return false; }
  }
  SCREENS.owner = (el, params) => {
    const tab = OTABS.some((x) => x[0] === params.tab) ? params.tab : "orders";
    titleBar(t("ownerPanel"), CFG.short || CFG.name, `<button class="iconbtn" data-act="ownerrefresh" aria-label="Refresh">${icon("refresh")}</button>`, "#/settings");
    const todays = (ownerOrders || []).filter((o) => new Date(o.at).toDateString() === new Date().toDateString());
    el.innerHTML = `<div class="ownerhead" style="margin-top:8px"><span class="label">Owner Panel</span><h2>Namaste! Aaj ka control</h2>
        <div class="small" style="opacity:.8">Yahan ka har change turant sabke phone pe dikhega</div>
        <div class="ostats"><div><b>${ownerOrders ? todays.length : "–"}</b><span>Aaj ke orders</span></div><div><b>${MENU.items.length}</b><span>Menu items</span></div><div><b>${MENU.items.filter((m) => m.out).length}</b><span>Khatam</span></div></div></div>
      <div class="hscroll otabs">${OTABS.map(([k, ic, lb]) => `<a class="chip ${tab === k ? "on" : ""}" href="#/owner?tab=${k}">${icon(ic)}${lb}</a>`).join("")}</div>
      <div id="obody" class="stagger"></div>`;
    clearInterval(ownerPoll);
    OWNER[tab]($("#obody", el));
  };
  const OWNER = {};

  // --- orders ---
  OWNER.orders = async (box) => {
    const draw = () => {
      if (!ownerOrders) { box.innerHTML = `<div class="row" style="justify-content:center;padding:40px"><span class="spin"></span></div>`; return; }
      if (!ownerOrders.length) { box.innerHTML = `<div class="empty"><div class="art">${icon("receipt", "xl")}</div><h3>Abhi koi order nahi</h3><p>App se order aate hi yahan dikhega (WhatsApp pe bhi aata hai)</p></div>`; return; }
      box.innerHTML = ownerOrders.slice(0, 80).map((o) => `<div class="card ocard"><div class="hd"><div><div class="id">#${esc(o.id)} · ${rupee(o.total)}</div><div class="when">${esc(timeAgo(o.at))} · ${o.type === "dinein" ? "Table " + esc(o.table) : o.type === "delivery" ? "Delivery" : "Takeaway"}</div></div><span class="status ${esc(o.status)}">${esc(STATUS[o.status] || o.status)}</span></div>
        <div class="its">${o.items.map((x) => `<b>${x.q}×</b> ${esc(x.n)}${x.v ? " (" + (x.v === "h" ? "Half" : "Full") + ")" : ""}`).join("<br>")}${o.notes ? `<br><span class="muted">Note: ${esc(o.notes)}</span>` : ""}${o.address ? `<br><span class="muted">Address: ${esc(o.address)}</span>` : ""}</div>
        <div class="row" style="gap:10px"><span class="avatar" style="width:36px;height:36px;border-radius:12px;font-size:14px">${esc(initials(o.customer.name))}</span><div class="grow"><b style="font-size:13.5px">${esc(o.customer.name)}</b><div class="tiny muted">${esc(o.customer.phone)}</div></div>
          <a class="iconbtn" href="tel:${esc(o.customer.phone)}" aria-label="Call">${icon("phone", "sm")}</a><a class="iconbtn" href="${waLink("91" + String(o.customer.phone).replace(/\D/g, "").slice(-10), "Namaste " + o.customer.name + ", " + (CFG.short || "") + " se — aapka order #" + o.id + " ")}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon("chat", "sm")}</a></div>
        ${o.status === "cancelled" ? `<button class="small" data-odel="${esc(o.id)}" style="margin-top:10px;color:var(--bad);font-weight:600;display:inline-flex;gap:6px;align-items:center">${icon("trash", "sm")}Order list se hatao</button>` : ""}<div class="seg" style="margin-top:12px;grid-auto-columns:auto">${["accepted", "preparing", "ready", "done", "cancelled"].map((s) => `<button data-ost="${esc(o.id)}|${s}" class="${o.status === s ? "on" : ""}" style="font-size:12px;height:36px;padding:0 6px">${{ accepted: "Accept", preparing: "Bana rahe", ready: "Ready", done: "Done", cancelled: "Cancel" }[s]}</button>`).join("")}</div></div>`).join("");
    };
    draw();
    const load = async () => { try { const r = await api("/owner/orders", { owner: true }); ownerOrders = r.orders || []; ownerOrdersAt = Date.now(); if (current.name === "owner" && (current.params.tab || "orders") === "orders") { draw(); const s = $(".ostats b"); if (s) s.textContent = ownerOrders.filter((o) => new Date(o.at).toDateString() === new Date().toDateString()).length; } } catch (e) { ownerFail(e); } };
    await load();
    ownerPoll = setInterval(() => { if (current.name !== "owner" || (current.params.tab || "orders") !== "orders") return clearInterval(ownerPoll); load(); }, 30000);
  };
  async function setOrderStatus(id, status) {
    try { await api("/owner/order-status", { owner: true, body: { id, status } }); const o = (ownerOrders || []).find((x) => x.id === id); if (o) o.status = status; toast("Status: " + STATUS[status]); render({ keepScroll: true, quiet: true }); }
    catch (e) { ownerFail(e); }
  }

  // --- items ---
  OWNER.items = (box) => {
    box.innerHTML = `<div class="row" style="gap:10px"><label class="searchbar grow" style="height:46px">${icon("search")}<input id="oiq" type="search" placeholder="Item dhundo" value="${esc(itemQ)}"></label><button class="btn" style="height:46px" data-act="newitem">${icon("plus", "sm")}Naya</button></div>
      <div class="hscroll" style="margin-top:10px"><button class="chip ${itemCat === "all" ? "on" : ""}" data-icat="all">Sab</button>${MENU.cats.map((c) => `<button class="chip ${itemCat === c.id ? "on" : ""}" data-icat="${esc(c.id)}">${esc(c.n)}</button>`).join("")}</div>
      <div class="card list" id="oilist" style="margin-top:8px"></div>`;
    const drawList = () => {
      const q = itemQ.trim().toLowerCase();
      const list = MENU.items.filter((m) => (itemCat === "all" || m.c === itemCat) && (!q || m.n.toLowerCase().includes(q)));
      $("#oilist", box).innerHTML = list.length ? list.map((m) => `<div class="orow"><div class="thumb">${thumbHtml(m)}</div><div class="grow"><div class="nm">${esc(m.n)}</div><div class="meta"><span class="vmark ${m.v ? "" : "nv"}" style="width:11px;height:11px;vertical-align:-1px"></span> ${hasHF(m) ? `H ${rupee(m.h)} · F ${rupee(m.f)}` : rupee(unit(m))}${m.hide ? " · chhupa hua" : ""}</div></div>
        <button class="toggle" data-stock="${esc(m.id)}" aria-label="Available"><span class="switch brand ${m.out ? "" : "on"}"></span></button>
        <button class="iconbtn" data-edit="${esc(m.id)}" aria-label="Edit">${icon("edit", "sm")}</button></div>`).join("") : `<div class="pad muted small">Koi item nahi</div>`;
    };
    drawList();
    $("#oiq", box).oninput = (e) => { itemQ = e.target.value; drawList(); };
    box._drawList = drawList;
  };
  function compressImage(file, max = 900) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => { const im = new Image(); im.onload = () => { const s = Math.min(1, max / Math.max(im.width, im.height)); const c = document.createElement("canvas"); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL("image/jpeg", 0.82)); }; im.onerror = rej; im.src = fr.result; };
      fr.onerror = rej; fr.readAsDataURL(file);
    });
  }
  function photoField(cur) {
    return `<div class="field"><span>Photo</span>
      <div class="prevphoto" id="pprev">${cur ? `<img src="${esc(imgSrc(cur))}" alt="">` : `<div class="illus">${icon("image")}</div>`}</div>
      <div class="grid2" style="margin-top:8px"><label class="btn sm ghost" style="cursor:pointer">${icon("cam", "sm")}Upload<input type="file" accept="image/*" id="pfile" class="sr"></label><button class="btn sm ghost" type="button" id="pclear">${icon("x", "sm")}Hatao</button></div>
      <div class="photopick">${(S.gallery || []).map((g) => `<button type="button" data-pick="${esc(g)}" class="${cur === g ? "on" : ""}"><img src="${esc(imgSrc(g, true))}" alt=""></button>`).join("")}</div>
      <input class="input" id="purl" style="margin-top:8px" placeholder="Ya photo ka link (https://…)" value="${esc(/^https?:/.test(cur || "") ? cur : "")}"></div>`;
  }
  function bindPhoto(sh, get, set) {
    const prev = () => { const v = get(); $("#pprev", sh).innerHTML = v ? `<img src="${esc(imgSrc(v))}" alt="">` : `<div class="illus">${icon("image")}</div>`; $$("[data-pick]", sh).forEach((b) => b.classList.toggle("on", b.dataset.pick === v)); };
    $$("[data-pick]", sh).forEach((b) => (b.onclick = () => { set(b.dataset.pick); $("#purl", sh).value = ""; prev(); }));
    $("#pclear", sh).onclick = () => { set(""); $("#purl", sh).value = ""; prev(); };
    $("#purl", sh).oninput = (e) => { const v = e.target.value.trim(); if (/^https:\/\/\S+$/.test(v)) { set(v); prev(); } };
    $("#pfile", sh).onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      $("#pprev", sh).innerHTML = `<div class="illus"><span class="spin"></span></div>`;
      try { const data = await compressImage(f); const r = await api("/owner/upload", { owner: true, body: { dataUrl: data }, timeout: 30000 }); set(r.url); prev(); toast("Photo upload ho gayi"); }
      catch (err) { prev(); ownerFail(err); }
    };
  }
  function editItem(id) {
    const isNew = !id;
    const m = isNew ? { id: "i" + Date.now().toString(36), c: itemCat !== "all" ? itemCat : (MENU.cats[0] || {}).id, n: "", d: "", v: true, p: "" } : clone(item(id));
    let mode = hasHF(m) ? "hf" : "single";
    openSheet(`<h3>${isNew ? "Naya item" : "Item edit"}</h3>
      <label class="field"><span>Naam</span><input class="input" id="en" value="${esc(m.n)}" maxlength="90" placeholder="Jaise Paneer Momo"></label>
      <div class="grid2"><label class="field"><span>Category</span><select class="input" id="ec">${MENU.cats.map((c) => `<option value="${esc(c.id)}" ${c.id === m.c ? "selected" : ""}>${esc(c.n)}</option>`).join("")}</select></label>
        <div class="field"><span>Type</span><div class="seg"><button type="button" data-veg="1" class="${m.v ? "on" : ""}"><span class="vmark"></span>Veg</button><button type="button" data-veg="0" class="${m.v ? "" : "on"}"><span class="vmark nv"></span>Non</button></div></div></div>
      <div class="field"><span>Price</span><div class="seg"><button type="button" data-mode="single" class="${mode === "single" ? "on" : ""}">Ek price</button><button type="button" data-mode="hf" class="${mode === "hf" ? "on" : ""}">Half / Full</button></div></div>
      <div id="eprices"></div>
      <label class="field"><span>Description (optional)</span><input class="input" id="ed" value="${esc(m.d || "")}" maxlength="240" placeholder="Jaise 6 pcs · chutney ke saath"></label>
      ${photoField(m.img)}
      <div class="card list" style="margin-top:14px">
        <button class="li" type="button" data-flag="out"><span class="tx"><b>Available (stock mein)</b><small>Band karoge toh customer ko "Khatam" dikhega</small></span><span class="switch brand ${m.out ? "" : "on"}"></span></button>
        <button class="li" type="button" data-flag="best"><span class="tx"><b>Bestseller</b><small>Home pe "Sabse pasand" mein dikhega</small></span><span class="switch brand ${m.best ? "on" : ""}"></span></button>
        <button class="li" type="button" data-flag="hide"><span class="tx"><b>Menu se chhupao</b><small>Item delete kiye bina hide</small></span><span class="switch brand ${m.hide ? "on" : ""}"></span></button>
      </div>
      <div class="savebar">${isNew ? "" : `<button class="btn danger" id="edel" aria-label="Delete">${icon("trash", "sm")}</button>`}<button class="btn block grow" id="esave">${icon("check", "sm")}Save karo</button></div>`, (sh, close) => {
      const drawPrices = () => { $("#eprices", sh).innerHTML = mode === "hf" ? `<div class="grid2"><label class="field"><span>Half ₹</span><input class="input" id="eh" inputmode="numeric" value="${esc(m.h != null ? m.h : "")}"></label><label class="field"><span>Full ₹</span><input class="input" id="ef" inputmode="numeric" value="${esc(m.f != null ? m.f : m.p != null ? m.p : "")}"></label></div>` : `<label class="field"><span>Price ₹</span><input class="input" id="ep" inputmode="numeric" value="${esc(m.p != null ? m.p : m.f != null ? m.f : "")}"></label>`; };
      drawPrices();
      $$("[data-mode]", sh).forEach((b) => (b.onclick = () => { const ep = $("#ep", sh), ef = $("#ef", sh), eh = $("#eh", sh); if (ep) m.p = ep.value; if (ef) m.f = ef.value; if (eh) m.h = eh.value; mode = b.dataset.mode; $$("[data-mode]", sh).forEach((x) => x.classList.toggle("on", x === b)); drawPrices(); }));
      $$("[data-veg]", sh).forEach((b) => (b.onclick = () => { m.v = b.dataset.veg === "1"; $$("[data-veg]", sh).forEach((x) => x.classList.toggle("on", x === b)); }));
      $$("[data-flag]", sh).forEach((b) => (b.onclick = () => { const f = b.dataset.flag; m[f] = !m[f]; $(".switch", b).classList.toggle("on", f === "out" ? !m.out : m[f]); }));
      bindPhoto(sh, () => m.img || "", (v) => { m.img = v; });
      $("#esave", sh).onclick = async () => {
        const n = $("#en", sh).value.trim(); if (!n) { $("#en", sh).classList.add("err"); return toast("Naam daalo", "info"); }
        const num = (s) => { const v = parseInt(String(s || "").replace(/\D/g, ""), 10); return Number.isFinite(v) ? v : NaN; };
        const out = { id: m.id, c: $("#ec", sh).value, n, d: $("#ed", sh).value.trim(), v: m.v };
        if (mode === "hf") { out.h = num($("#eh", sh).value); out.f = num($("#ef", sh).value); if (!(out.h >= 0) || !(out.f > 0)) return toast("Half aur Full dono price daalo", "info"); }
        else { out.p = num($("#ep", sh).value); if (!(out.p > 0)) return toast("Price daalo", "info"); }
        if (m.img) out.img = m.img; if (m.out) out.out = true; if (m.best) out.best = true; if (m.hide) out.hide = true;
        const backup = clone(MENU.items);
        if (isNew) MENU.items.unshift(out); else MENU.items = MENU.items.map((x) => (x.id === m.id ? out : x));
        const btn = $("#esave", sh); btn.disabled = true; btn.innerHTML = `<span class="spin"></span>`;
        if (await saveMenu(isNew ? "Naya item add ho gaya" : "Item save ho gaya")) { close(); render({ keepScroll: true, quiet: true }); }
        else { MENU.items = backup; btn.disabled = false; btn.innerHTML = `${icon("check", "sm")}Save karo`; }
      };
      if (!isNew) $("#edel", sh).onclick = async () => {
        if (!(await confirmSheet("Item delete karein?", `"${m.n}" menu se hamesha ke liye hat jaayega. Sirf kuch din ke liye hatana ho toh "Available" band karo.`, "Delete", true))) return;
        const backup = clone(MENU.items); MENU.items = MENU.items.filter((x) => x.id !== m.id);
        if (await saveMenu("Item delete ho gaya")) render({ keepScroll: true, quiet: true }); else MENU.items = backup;
      };
    });
  }
  async function toggleStock(id) {
    const m = item(id); if (!m) return;
    m.out = !m.out; if (!m.out) delete m.out;
    const sw = $(`[data-stock="${CSS.escape(id)}"] .switch`); if (sw) sw.classList.toggle("on", !m.out);
    if (!(await saveMenu(m.out ? `${m.n}: Khatam` : `${m.n}: Available`))) { m.out = !m.out; if (sw) sw.classList.toggle("on", !m.out); }
    const st = $$(".ostats b")[2]; if (st) st.textContent = MENU.items.filter((x) => x.out).length;
  }

  // --- categories ---
  OWNER.cats = (box) => {
    box.innerHTML = `<div class="card list">${MENU.cats.map((c, i) => `<div class="orow"><span class="lic" style="width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:var(--gold-soft);color:var(--gold-ink)">${icon(c.icon || "bowl")}</span><div class="grow"><div class="nm">${esc(c.n)}</div><div class="meta">${MENU.items.filter((m) => m.c === c.id).length} items</div></div>
      <button class="iconbtn" data-cmove="${i}|-1" ${i ? "" : "disabled"} aria-label="Upar">${icon("up", "sm")}</button><button class="iconbtn" data-cmove="${i}|1" ${i < MENU.cats.length - 1 ? "" : "disabled"} aria-label="Neeche">${icon("down", "sm")}</button><button class="iconbtn" data-cedit="${i}" aria-label="Edit">${icon("edit", "sm")}</button></div>`).join("")}</div>
      <button class="btn block ghost" style="margin-top:12px" data-cedit="new">${icon("plus", "sm")}Nayi category</button>`;
  };
  function editCat(i) {
    const isNew = i === "new"; const c = isNew ? { id: "c" + Date.now().toString(36), n: "", icon: "bowl" } : clone(MENU.cats[i]);
    const count = isNew ? 0 : MENU.items.filter((m) => m.c === c.id).length;
    openSheet(`<h3>${isNew ? "Nayi category" : "Category edit"}</h3>
      <label class="field"><span>Naam</span><input class="input" id="cn" value="${esc(c.n)}" maxlength="40" placeholder="Jaise Shakes"></label>
      <div class="field"><span>Icon</span><div class="photopick" style="grid-template-columns:repeat(7,1fr)">${CAT_ICONS.map((k) => `<button type="button" data-ci="${k}" class="${c.icon === k ? "on" : ""}" style="display:grid;place-items:center;background:var(--bg2);color:var(--gold-ink)">${icon(k)}</button>`).join("")}</div></div>
      <div class="savebar">${isNew ? "" : `<button class="btn danger" id="cdel">${icon("trash", "sm")}</button>`}<button class="btn block grow" id="csave">${icon("check", "sm")}Save karo</button></div>`, (sh, close) => {
      $$("[data-ci]", sh).forEach((b) => (b.onclick = () => { c.icon = b.dataset.ci; $$("[data-ci]", sh).forEach((x) => x.classList.toggle("on", x === b)); }));
      $("#csave", sh).onclick = async () => {
        c.n = $("#cn", sh).value.trim(); if (!c.n) return toast("Naam daalo", "info");
        const backup = clone(MENU.cats);
        if (isNew) MENU.cats.push(c); else MENU.cats[i] = c;
        if (await saveMenu("Category save ho gayi")) { close(); render({ keepScroll: true, quiet: true }); } else MENU.cats = backup;
      };
      if (!isNew) $("#cdel", sh).onclick = async () => {
        if (count) return toast(`Pehle is category ke ${count} items doosri category mein daalo ya delete karo`, "info");
        if (!(await confirmSheet("Category delete?", `"${c.n}" hat jaayegi.`, "Delete", true))) return;
        const backup = clone(MENU.cats); MENU.cats.splice(i, 1);
        if (await saveMenu("Category delete ho gayi")) render({ keepScroll: true, quiet: true }); else MENU.cats = backup;
      };
    });
  }
  async function moveCat(i, d) {
    const j = i + d; if (j < 0 || j >= MENU.cats.length) return;
    const backup = clone(MENU.cats); [MENU.cats[i], MENU.cats[j]] = [MENU.cats[j], MENU.cats[i]];
    render({ keepScroll: true, quiet: true });
    if (!(await saveMenu("Order save ho gaya"))) { MENU.cats = backup; render({ keepScroll: true, quiet: true }); }
  }

  // --- offers & coupons ---
  OWNER.offers = (box) => {
    box.innerHTML = `<div class="label" style="margin:4px 4px 8px">Home page offers</div>
      <div class="card list">${(CFG.offers || []).map((o, i) => `<div class="orow"><div class="thumb">${o.img ? `<img src="${esc(imgSrc(o.img, true))}" alt="">` : `<div class="illus">${icon("gift")}</div>`}</div><div class="grow"><div class="nm">${esc(o.title)}</div><div class="meta">${esc(o.tag || "Offer")} · ${esc(o.sub)}</div></div>
        <button class="toggle" data-offon="${i}"><span class="switch brand ${o.on ? "on" : ""}"></span></button><button class="iconbtn" data-offedit="${i}" aria-label="Edit">${icon("edit", "sm")}</button></div>`).join("") || `<div class="pad small muted">Koi offer nahi</div>`}</div>
      <button class="btn block ghost" style="margin-top:10px" data-offedit="new">${icon("plus", "sm")}Naya offer</button>
      <div class="label" style="margin:24px 4px 8px">Coupon codes</div>
      <div class="card list">${(CFG.coupons || []).map((k, i) => `<div class="orow"><span class="lic" style="width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:var(--gold-soft);color:var(--gold-ink)">${icon("percent")}</span><div class="grow"><div class="nm">${esc(k.code)}</div><div class="meta">${k.type === "flat" ? rupee(k.value) + " off" : k.value + "% off" + (k.max ? " (max " + rupee(k.max) + ")" : "")} · ${rupee(k.min || 0)}+ order</div></div>
        <button class="toggle" data-cpon="${i}"><span class="switch brand ${k.on !== false ? "on" : ""}"></span></button><button class="iconbtn" data-cpedit="${i}" aria-label="Edit">${icon("edit", "sm")}</button></div>`).join("") || `<div class="pad small muted">Koi coupon nahi</div>`}</div>
      <button class="btn block ghost" style="margin-top:10px" data-cpedit="new">${icon("plus", "sm")}Naya coupon</button>`;
  };
  function editOffer(i) {
    const isNew = i === "new"; const o = isNew ? { id: "o" + Date.now().toString(36), title: "", sub: "", tag: "Offer", itemId: "", cat: "", img: "", on: true } : clone(CFG.offers[i]);
    openSheet(`<h3>${isNew ? "Naya offer" : "Offer edit"}</h3>
      <label class="field"><span>Title</span><input class="input" id="ot" value="${esc(o.title)}" maxlength="70" placeholder="Jaise Momo Platter"></label>
      <label class="field"><span>Detail</span><input class="input" id="os" value="${esc(o.sub)}" maxlength="120" placeholder="Jaise Har momo ke 2-2 piece · ₹319 se"></label>
      <div class="grid2"><label class="field"><span>Tag</span><input class="input" id="og" value="${esc(o.tag)}" maxlength="20" placeholder="Combo / Party"></label>
      <label class="field"><span>Tap karne pe</span><select class="input" id="ol"><option value="">Menu kholo</option>${MENU.cats.map((c) => `<option value="cat:${esc(c.id)}" ${o.cat === c.id ? "selected" : ""}>Category: ${esc(c.n)}</option>`).join("")}${MENU.items.map((m) => `<option value="item:${esc(m.id)}" ${o.itemId === m.id ? "selected" : ""}>${esc(m.n)}</option>`).join("")}</select></label></div>
      ${photoField(o.img)}
      <div class="savebar">${isNew ? "" : `<button class="btn danger" id="odel">${icon("trash", "sm")}</button>`}<button class="btn block grow" id="osave">${icon("check", "sm")}Save karo</button></div>`, (sh, close) => {
      bindPhoto(sh, () => o.img || "", (v) => { o.img = v; });
      $("#osave", sh).onclick = async () => {
        o.title = $("#ot", sh).value.trim(); o.sub = $("#os", sh).value.trim(); o.tag = $("#og", sh).value.trim();
        const l = $("#ol", sh).value; o.itemId = l.startsWith("item:") ? l.slice(5) : ""; o.cat = l.startsWith("cat:") ? l.slice(4) : "";
        if (!o.title) return toast("Title daalo", "info");
        const backup = clone(CFG.offers);
        if (isNew) CFG.offers.push(o); else CFG.offers[i] = o;
        if (await saveConfig("Offer save ho gaya")) { close(); render({ keepScroll: true, quiet: true }); } else CFG.offers = backup;
      };
      if (!isNew) $("#odel", sh).onclick = async () => { const backup = clone(CFG.offers); CFG.offers.splice(i, 1); if (await saveConfig("Offer delete ho gaya")) { close(); render({ keepScroll: true, quiet: true }); } else CFG.offers = backup; };
    });
  }
  function editCoupon(i) {
    const isNew = i === "new"; const k = isNew ? { code: "", type: "pct", value: 10, max: 50, min: 199, on: true } : clone(CFG.coupons[i]);
    openSheet(`<h3>${isNew ? "Naya coupon" : "Coupon edit"}</h3>
      <label class="field"><span>Code</span><input class="input" id="kc" value="${esc(k.code)}" maxlength="20" style="text-transform:uppercase" placeholder="KANAK10"></label>
      <div class="field"><span>Type</span><div class="seg"><button type="button" data-kt="pct" class="${k.type === "pct" ? "on" : ""}">% off</button><button type="button" data-kt="flat" class="${k.type === "flat" ? "on" : ""}">₹ off</button></div></div>
      <div class="grid2"><label class="field"><span>Value</span><input class="input" id="kv" inputmode="numeric" value="${esc(k.value)}"></label><label class="field"><span>Max discount ₹</span><input class="input" id="km" inputmode="numeric" value="${esc(k.max || "")}" placeholder="0 = koi limit nahi"></label></div>
      <label class="field"><span>Minimum order ₹</span><input class="input" id="kn" inputmode="numeric" value="${esc(k.min || "")}"></label>
      <div class="savebar">${isNew ? "" : `<button class="btn danger" id="kdel">${icon("trash", "sm")}</button>`}<button class="btn block grow" id="ksave">${icon("check", "sm")}Save karo</button></div>`, (sh, close) => {
      $$("[data-kt]", sh).forEach((b) => (b.onclick = () => { k.type = b.dataset.kt; $$("[data-kt]", sh).forEach((x) => x.classList.toggle("on", x === b)); }));
      $("#ksave", sh).onclick = async () => {
        k.code = $("#kc", sh).value.toUpperCase().replace(/[^A-Z0-9]/g, ""); if (!k.code) return toast("Code daalo", "info");
        const n = (id) => parseInt($(id, sh).value.replace(/\D/g, "") || "0", 10);
        k.value = n("#kv"); k.max = n("#km"); k.min = n("#kn"); if (!k.value) return toast("Value daalo", "info");
        const backup = clone(CFG.coupons);
        if (isNew) CFG.coupons.push(k); else CFG.coupons[i] = k;
        if (await saveConfig("Coupon save ho gaya")) { close(); render({ keepScroll: true, quiet: true }); } else CFG.coupons = backup;
      };
      if (!isNew) $("#kdel", sh).onclick = async () => { const backup = clone(CFG.coupons); CFG.coupons.splice(i, 1); if (await saveConfig("Coupon delete ho gaya")) { close(); render({ keepScroll: true, quiet: true }); } else CFG.coupons = backup; };
    });
  }

  // --- timing & delivery ---
  OWNER.timing = (box) => {
    const d = CFG.delivery;
    box.innerHTML = `<div class="card pad">
        <div class="label">Cafe timing</div>
        <div class="grid2"><label class="field"><span>Khulta hai</span><input class="input" type="time" id="tto" value="${esc(CFG.open)}"></label><label class="field"><span>Band hota hai</span><input class="input" type="time" id="ttc" value="${esc(CFG.close)}"></label></div>
        <div class="field"><span>Abhi ka status</span><div class="seg"><button data-ov="auto" class="${CFG.override === "auto" ? "on" : ""}">Auto (timing)</button><button data-ov="open" class="${CFG.override === "open" ? "on" : ""}">Khula</button><button data-ov="closed" class="${CFG.override === "closed" ? "on" : ""}">Band</button></div></div>
        <div class="help">${icon("info")}"Band" chuna toh customer order nahi kar payenge (chhutti, maintenance)</div>
        <label class="field"><span>Notice (Home pe dikhega, optional)</span><input class="input" id="ttn" maxlength="140" value="${esc(CFG.notice)}" placeholder="Jaise Aaj 9 baje tak hi khula hai"></label>
      </div>
      <div class="card pad" style="margin-top:12px">
        <div class="label">Order types</div>
        <div class="card list" style="margin-top:10px;box-shadow:none">
          <button class="li" data-tg="delivery"><span class="lic">${icon("bike")}</span><span class="tx"><b>Delivery</b><small>Ghar pe delivery</small></span><span class="switch brand ${d.on ? "on" : ""}"></span></button>
          <button class="li" data-tg="dineIn"><span class="lic">${icon("table")}</span><span class="tx"><b>Dine-in</b><small>Table number ke saath</small></span><span class="switch brand ${CFG.dineIn !== false ? "on" : ""}"></span></button>
          <button class="li" data-tg="takeaway"><span class="lic">${icon("bag")}</span><span class="tx"><b>Takeaway</b><small>Counter se pickup</small></span><span class="switch brand ${CFG.takeaway !== false ? "on" : ""}"></span></button>
        </div>
        <div class="grid2"><label class="field"><span>Delivery charge ₹</span><input class="input" id="tdf" inputmode="numeric" value="${esc(d.fee)}"></label><label class="field"><span>Free delivery ₹ se upar</span><input class="input" id="tdfa" inputmode="numeric" value="${esc(d.freeAbove || "")}" placeholder="0 = kabhi nahi"></label></div>
        <label class="field"><span>Minimum order (delivery) ₹</span><input class="input" id="tdm" inputmode="numeric" value="${esc(d.minOrder || "")}"></label>
        <label class="field"><span>Delivery area</span><input class="input" id="tda" maxlength="160" value="${esc(d.area)}" placeholder="Jaise Govindpur 3 km tak"></label>
      </div>
      <button class="btn block" style="margin-top:16px" data-act="savetiming">${icon("check", "sm")}Save karo</button>`;
    $$("[data-ov]", box).forEach((b) => (b.onclick = () => { $$("[data-ov]", box).forEach((x) => x.classList.toggle("on", x === b)); }));
    $$("[data-tg]", box).forEach((b) => (b.onclick = () => $(".switch", b).classList.toggle("on")));
  };
  async function saveTiming() {
    const box = $("#obody"); const n = (id) => parseInt(($(id, box).value || "0").replace(/\D/g, "") || "0", 10);
    const backup = clone(CFG);
    CFG.open = $("#tto", box).value || CFG.open; CFG.close = $("#ttc", box).value || CFG.close;
    CFG.override = $("[data-ov].on", box).dataset.ov; CFG.notice = $("#ttn", box).value.trim();
    CFG.delivery = { on: $('[data-tg="delivery"] .switch', box).classList.contains("on"), fee: n("#tdf"), freeAbove: n("#tdfa"), minOrder: n("#tdm"), area: $("#tda", box).value.trim() };
    CFG.dineIn = $('[data-tg="dineIn"] .switch', box).classList.contains("on"); CFG.takeaway = $('[data-tg="takeaway"] .switch', box).classList.contains("on");
    if (!(await saveConfig("Timing & delivery save ho gaya"))) CFG = backup;
  }

  // --- cafe info ---
  OWNER.info = (box) => {
    box.innerHTML = `<div class="card pad">
      <label class="field" style="margin-top:0"><span>Cafe ka naam</span><input class="input" id="fn" maxlength="60" value="${esc(CFG.name)}"></label>
      <label class="field"><span>Tagline</span><input class="input" id="ftg" maxlength="90" value="${esc(CFG.tagline)}"></label>
      <label class="field"><span>Order WhatsApp number (orders yahan aayenge)</span><input class="input" id="fwa" inputmode="numeric" maxlength="13" value="${esc(String(CFG.whatsapp || "").replace(/^91(?=\d{10}$)/, ""))}" placeholder="10 digit"></label>
      <div class="help">${icon("chat")}Customer ka order isi WhatsApp number pe jaata hai</div>
      <label class="field"><span>Call number</span><input class="input" id="fph" inputmode="tel" maxlength="16" value="${esc(CFG.phone)}"></label>
      <label class="field"><span>Address</span><textarea class="input" id="fad" rows="2" maxlength="200">${esc(CFG.address)}</textarea></label>
      <label class="field"><span>Google Maps link</span><input class="input" id="fmp" maxlength="400" value="${esc(CFG.maps)}"></label>
      <label class="field"><span>Instagram (bina @)</span><input class="input" id="fig" maxlength="40" value="${esc(CFG.instagram)}"></label>
      </div><button class="btn block" style="margin-top:16px" data-act="saveinfo">${icon("check", "sm")}Save karo</button>`;
  };
  async function saveInfo() {
    const box = $("#obody"); const v = (id) => $(id, box).value.trim();
    let wa = v("#fwa").replace(/\D/g, ""); if (wa.length === 10) wa = "91" + wa;
    if (!/^91[6-9]\d{9}$/.test(wa)) return toast("WhatsApp number 10 digit ka sahi daalo", "info");
    const backup = clone(CFG);
    Object.assign(CFG, { name: v("#fn") || CFG.name, tagline: v("#ftg"), whatsapp: wa, phone: v("#fph"), address: v("#fad"), maps: v("#fmp"), instagram: v("#fig").replace(/^@/, "") });
    if (!(await saveConfig("Cafe info save ho gaya"))) CFG = backup;
  }

  // --- security ---
  OWNER.security = (box) => {
    box.innerHTML = `<div class="card pad"><div class="label">Password badlo</div>
      <label class="field"><span>Purana password</span><input class="input" type="password" id="spo" autocomplete="current-password"></label>
      <label class="field"><span>Naya password</span><input class="input" type="password" id="spn" autocomplete="new-password" placeholder="Kam se kam 6 characters"></label>
      <label class="field"><span>Naya password dobara</span><input class="input" type="password" id="spn2" autocomplete="new-password"></label>
      <button class="btn block" style="margin-top:16px" data-act="changepw">${icon("key", "sm")}Password badlo</button></div>
      <div class="help" style="margin-top:12px">${icon("shield")}Password server pe sirf encrypted (hash) form mein save hota hai — kisi code ya file mein nahi.</div>
      <button class="btn block ghost" style="margin-top:16px" data-act="ownerlogout">${icon("logout", "sm")}Owner logout</button>`;
  };
  async function changePw() {
    const box = $("#obody"); const o = $("#spo", box).value, n1 = $("#spn", box).value, n2 = $("#spn2", box).value;
    if (n1.length < 6) return toast("Naya password kam se kam 6 characters", "info");
    if (n1 !== n2) return toast("Dono naye password same nahi hain", "info");
    try { await api("/owner/change-password", { owner: true, body: { old: o, password: n1 } }); toast("Password badal gaya", "shield"); ["#spo", "#spn", "#spn2"].forEach((id) => ($(id, box).value = "")); }
    catch (e) { ownerFail(e); }
  }
  async function ownerLogout() {
    try { await api("/owner/logout", { owner: true, body: {} }); } catch (e) {}
    ownerToken = null; LS.del("owner"); ownerOrders = null; toast("Owner logout ho gaya", "logout"); go("#/settings");
  }

  // ---------- remote data ----------
  let fetching = false;
  async function fetchRemote(force) {
    if (fetching && !force) return; fetching = true;
    try {
      const r = await api("/menu", { timeout: 8000 });
      online = true;
      let changed = false;
      if (r.menu && Array.isArray(r.menu.items) && (r.menu.v > MENU_V || (force && r.menu.v >= MENU_V))) { MENU = { cats: r.menu.cats, items: r.menu.items }; MENU_V = r.menu.v; LS.set("menu", MENU); LS.set("menuV", MENU_V); changed = true; }
      if (r.config && (!CFG.at || String(r.config.at || "") >= CFG.at)) { const next = mergeCfg(window.APP_SEED_CONFIG, r.config); if (JSON.stringify(next) !== JSON.stringify(CFG)) { CFG = next; LS.set("config", r.config); changed = true; } }
      if (changed && !sheetClose && current.name !== "owner") render({ keepScroll: true, quiet: true });
      else if (changed && current.name === "owner" && force) render({ keepScroll: true, quiet: true });
    } catch (e) { online = false; }
    finally { fetching = false; }
  }

  // ---------- events ----------
  document.addEventListener("click", (e) => {
    const a = (sel) => e.target.closest(sel);
    let el;
    if ((el = a("[data-add]"))) { e.stopPropagation(); const m = item(el.dataset.add); if (!m) return; if (hasHF(m) && !cartQty(m.id)) return openItem(m.id, true); if (hasHF(m)) { const last = cart.filter((c) => c.id === m.id).pop(); addToCart(m.id, last ? last.v : "f"); } else addToCart(m.id); refreshSides(m.id); if (!hasHF(m) && cartQty(m.id) === 1) toast(`${m.n} cart mein`); return; }
    if ((el = a("[data-dec]"))) { e.stopPropagation(); decItem(el.dataset.dec); refreshSides(el.dataset.dec); return; }
    if ((el = a("[data-cq]"))) { const [k, d] = el.dataset.cq.split("|"); changeQty(k, Number(d)); render({ keepScroll: true, quiet: true }); return; }
    if ((el = a("[data-open]"))) { openItem(el.dataset.open); return; }
    if ((el = a("[data-cat]"))) { const c = el.dataset.cat; history.replaceState(null, "", c === "all" ? "#/menu" : "#/menu?cat=" + encodeURIComponent(c)); current.params = c === "all" ? {} : { cat: c }; $$(".menutools .chip").forEach((x) => x.classList.toggle("on", x === el)); drawMenuList(c); el.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" }); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    if ((el = a("[data-offer]"))) { const o = (CFG.offers || []).find((x) => x.id === el.dataset.offer); if (!o) return; if (o.itemId && item(o.itemId)) return openItem(o.itemId); if (o.cat) return go("#/menu?cat=" + encodeURIComponent(o.cat)); if (/KANAK|code/i.test(o.title)) { const m = o.title.match(/[A-Z]{3,}\d+/); if (m) { checkout.coupon = m[0]; saveCheckout(); toast(`Coupon ${m[0]} cart mein lag jayega`, "tag"); } } return go("#/menu"); }
    if ((el = a("[data-photo]"))) { openSheet(`<div style="margin:-10px -20px 0;border-radius:28px 28px 0 0;overflow:hidden"><img src="${esc(imgSrc(el.dataset.photo))}" alt="" style="width:100%;max-height:70vh;object-fit:cover"></div>`); return; }
    if ((el = a("[data-type]"))) { checkout.type = el.dataset.type; saveCheckout(); render({ keepScroll: true, quiet: true }); return; }
    if ((el = a("[data-settheme]"))) { prefs.theme = el.dataset.settheme; LS.set("prefs", prefs); applyTheme(); render({ keepScroll: true, quiet: true }); return; }
    if ((el = a("[data-setlang]"))) { prefs.lang = el.dataset.setlang; LS.set("prefs", prefs); document.documentElement.lang = prefs.lang === "en" ? "en" : "hi-Latn"; render({ keepScroll: true, quiet: true }); return; }
    if ((el = a("[data-reorder]"))) { reorder(el.dataset.reorder); return; }
    if ((el = a("[data-ost]"))) { const [id, s] = el.dataset.ost.split("|"); setOrderStatus(id, s); return; }
    if ((el = a("[data-odel]"))) { const id = el.dataset.odel; confirmSheet("Order hatayein?", "#" + id + " list se hat jaayega.", "Hatao", true).then(async (ok) => { if (!ok) return; try { await api("/owner/order-delete", { owner: true, body: { id } }); ownerOrders = (ownerOrders || []).filter((x) => x.id !== id); toast("Order hata diya"); render({ keepScroll: true, quiet: true }); } catch (err) { ownerFail(err); } }); return; }
    if ((el = a("[data-stock]"))) { toggleStock(el.dataset.stock); return; }
    if ((el = a("[data-edit]"))) { editItem(el.dataset.edit); return; }
    if ((el = a("[data-icat]"))) { itemCat = el.dataset.icat; render({ keepScroll: true, quiet: true }); return; }
    if ((el = a("[data-cedit]"))) { editCat(el.dataset.cedit === "new" ? "new" : Number(el.dataset.cedit)); return; }
    if ((el = a("[data-cmove]"))) { const [i, d] = el.dataset.cmove.split("|").map(Number); moveCat(i, d); return; }
    if ((el = a("[data-offedit]"))) { editOffer(el.dataset.offedit === "new" ? "new" : Number(el.dataset.offedit)); return; }
    if ((el = a("[data-offon]"))) { const i = Number(el.dataset.offon); CFG.offers[i].on = !CFG.offers[i].on; $(".switch", el).classList.toggle("on", CFG.offers[i].on); saveConfig(CFG.offers[i].on ? "Offer ON" : "Offer OFF").then((ok) => { if (!ok) { CFG.offers[i].on = !CFG.offers[i].on; render({ keepScroll: true, quiet: true }); } }); return; }
    if ((el = a("[data-cpedit]"))) { editCoupon(el.dataset.cpedit === "new" ? "new" : Number(el.dataset.cpedit)); return; }
    if ((el = a("[data-cpon]"))) { const i = Number(el.dataset.cpon); const k = CFG.coupons[i]; k.on = k.on === false; $(".switch", el).classList.toggle("on", k.on); saveConfig(k.on ? "Coupon ON" : "Coupon OFF"); return; }
    if ((el = a("[data-act]"))) {
      const act = el.dataset.act;
      const ACT = {
        share: doShare, install: doInstall, qr: showQR, about: showAbout, login: () => openLogin(), place: placeOrder,
        vegtoggle: () => { prefs.veg = !prefs.veg; LS.set("prefs", prefs); if (current.name === "menu") { $$(".menutools .switch").forEach((s) => s.classList.toggle("on", prefs.veg)); drawMenuList(current.params.cat || "all"); } toast(prefs.veg ? "Sirf veg dikh raha hai" : "Veg + non-veg dono", "leaf"); },
        clearcart: async () => { if (await confirmSheet("Cart khaali karein?", "Saare items hat jaayenge.", "Haan, hatao", true)) { cart = []; saveCart(); render({ quiet: true }); } },
        coupon: () => { const i = $("#ccoupon"); if (i) checkout.coupon = i.value.trim().toUpperCase(); saveCheckout(); render({ keepScroll: true, quiet: true }); },
        pollstatus: () => pollStatus(true),
        editprofile: () => openLogin(),
        logout: async () => { if (await confirmSheet("Logout karein?", "Is phone se aapka naam aur number hat jaayega. Order history rahegi.", "Logout", true)) { user = null; LS.del("user"); render({ quiet: true }); toast("Logout ho gaya", "logout"); } },
        ownerlogin: openOwnerLogin, ownerlogout: ownerLogout,
        ownerrefresh: async () => { ownerOrders = null; await fetchRemote(true); render({ quiet: true, keepScroll: true }); toast("Latest data aa gaya", "refresh"); },
        newitem: () => editItem(null), savetiming: saveTiming, saveinfo: saveInfo, changepw: changePw,
      };
      if (ACT[act]) ACT[act]();
    }
  });
  document.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.matches("[data-open]")) { e.preventDefault(); openItem(e.target.dataset.open); } if (e.key === "Escape" && sheetClose) sheetClose(); });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") fetchRemote(); });
  window.addEventListener("online", () => fetchRemote());
  window.addEventListener("hashchange", () => { if (sheetClose) sheetClose(true); render(); });

  // ---------- init ----------
  function init() {
    applyTheme();
    document.documentElement.lang = prefs.lang === "en" ? "en" : "hi-Latn";
    const sp = new URLSearchParams(location.search);
    if (sp.get("table")) { checkout.type = "dinein"; checkout.table = sp.get("table").replace(/\D/g, "").slice(0, 4); saveCheckout(); }
    $("#nav").innerHTML = [["home", "home"], ["menu", "menu"], ["cart", "bag"], ["orders", "receipt"], ["settings", "settings"]].map(([k, ic]) => `<a href="#/${k}" data-tab="${k}">${icon(ic)}<span data-l="${k}">${t(k)}</span>${k === "cart" ? '<span class="badge hide" id="cartBadge">0</span>' : ""}</a>`).join("");
    updateBadge();
    render();
    fetchRemote();
    setInterval(() => { if (document.visibilityState === "visible") fetchRemote(); }, 60000);
    if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
  }
  init();
})();
