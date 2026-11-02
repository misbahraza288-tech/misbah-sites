/* Cafe App v2 (Misbah Digital cafe template) — vanilla JS, offline PWA. Config: data.js */
(function () {
  "use strict";
  const CFG0 = window.KANAK_CONFIG;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const app = $("#app");
  const K = (CFG0.STORAGE_KEY || "kanak2") + "_";
  const store = {
    get(k, d) { try { const v = localStorage.getItem(K + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(K + k, JSON.stringify(v)); } catch (e) {} },
    del(k) { localStorage.removeItem(K + k); }
  };
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const rs = (n) => "₹" + Math.round(n).toLocaleString("en-IN");

  // ---------- state ----------
  const CFG = Object.assign({}, CFG0, store.get("cfg", {}));
  let MENU = store.get("menu", null) || JSON.parse(JSON.stringify(window.KANAK_MENU));
  let OFFERS = store.get("offers", null) || JSON.parse(JSON.stringify(window.KANAK_OFFERS));
  let cart = store.get("cart", []); // [{key,id,v,q}]
  let prefs = Object.assign({ theme: "dark", lang: "hi", notif: false, veg: "all" }, store.get("prefs", {}));
  let checkout = Object.assign({ mode: "delivery", name: "", phone: "", addr: "", note: "", coupon: "" }, store.get("checkout", {}));
  const saveMenu = () => store.set("menu", MENU);
  const saveCart = () => { store.set("cart", cart); updateBadge(); };
  const savePrefs = () => store.set("prefs", prefs);

  // ---------- i18n ----------
  const T = {
    hi: { tab_home: "Home", tab_menu: "Menu", tab_cart: "Cart", tab_orders: "Orders", tab_more: "More",
      open: "Abhi khula hai", closed: "Abhi band hai", order_now: "Order karo", offers: "Aaj ke offers", best: "Bestsellers", all: "Sab dekho",
      cats: "Kya khana hai?", search: "Momo, roll, pizza search karo…", veg: "Veg", nonveg: "Non-veg", allf: "Sab",
      add: "ADD", cart_empty: "Cart khali hai", cart_empty2: "Kuch tasty add karo 😋", go_menu: "Menu dekho",
      delivery: "Delivery", pickup: "Pickup", name: "Aapka naam", phone: "Mobile number", addr: "Address (gali, landmark)", note: "Note (optional) — kam teekha etc.",
      coupon: "Coupon code", apply: "Lagao", bill: "Bill", items_total: "Items total", dfee: "Delivery charge", discount: "Discount", topay: "Total",
      send_wa: "WhatsApp pe Order bhejo", my_orders: "Mere orders", no_orders: "Abhi tak koi order nahi", reorder: "Phir se order",
      placed: "Placed", preparing: "Ban raha hai", ready: "Ready", done: "Delivered",
      settings: "Settings", gallery: "Gallery", about: "About & Contact", review: "Google pe review do", owner: "Owner login", share: "App share karo", install: "App install karo",
      dark: "Dark mode", lang: "Language", notif: "Notifications", clear: "Data saaf karo", version: "App version",
      cart_bar: "Cart dekho", added: "Cart mein add ho gaya ✓", menu_note: "Prices menu card ke hisaab se · badal sakte hain" },
    en: { tab_home: "Home", tab_menu: "Menu", tab_cart: "Cart", tab_orders: "Orders", tab_more: "More",
      open: "Open now", closed: "Closed now", order_now: "Order now", offers: "Today's offers", best: "Bestsellers", all: "See all",
      cats: "What would you like?", search: "Search momos, rolls, pizza…", veg: "Veg", nonveg: "Non-veg", allf: "All",
      add: "ADD", cart_empty: "Your cart is empty", cart_empty2: "Add something tasty 😋", go_menu: "Browse menu",
      delivery: "Delivery", pickup: "Pickup", name: "Your name", phone: "Mobile number", addr: "Address (street, landmark)", note: "Note (optional) — less spicy etc.",
      coupon: "Coupon code", apply: "Apply", bill: "Bill", items_total: "Items total", dfee: "Delivery fee", discount: "Discount", topay: "Total",
      send_wa: "Send order on WhatsApp", my_orders: "My orders", no_orders: "No orders yet", reorder: "Order again",
      placed: "Placed", preparing: "Preparing", ready: "Ready", done: "Delivered",
      settings: "Settings", gallery: "Gallery", about: "About & Contact", review: "Review us on Google", owner: "Owner login", share: "Share app", install: "Install app",
      dark: "Dark mode", lang: "Language", notif: "Notifications", clear: "Clear data", version: "App version",
      cart_bar: "View cart", added: "Added to cart ✓", menu_note: "Prices as per menu card · may change" }
  };
  const t = (k) => (T[prefs.lang] && T[prefs.lang][k]) || T.hi[k] || k;
  function applyLang() { $$("[data-i]").forEach((el) => (el.textContent = t(el.dataset.i))); document.documentElement.lang = prefs.lang === "en" ? "en" : "hi-Latn"; }
  function applyTheme() {
    document.documentElement.dataset.theme = prefs.theme;
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = prefs.theme === "dark" ? "#16120e" : "#fbf6ee";
  }

  // ---------- helpers ----------
  const item = (id) => MENU.find((m) => m.id === id);
  const catOf = (id) => window.KANAK_CATS.find((c) => c.id === id) || { e: "🍽️", n: "" };
  const hasHF = (m) => m.h != null;
  const priceOf = (m, v) => (hasHF(m) ? (v === "h" ? m.h : m.f) : m.p);
  const minPrice = (m) => (hasHF(m) ? m.h : m.p);
  const varLabel = (m, v) => (!hasHF(m) ? "" : m.c === "combo" ? (v === "h" ? "2 log" : "4 log") : (v === "h" ? "Half" : "Full"));
  function photo(m, size) {
    if (m.img) return `<img src="img/${m.img}${size === "s" ? "-s" : ""}.webp" alt="${esc(m.n)}" loading="lazy">`;
    return `<div class="emo">${catOf(m.c).e}<small>${esc(CFG.SHORT_NAME.split(" ")[0].toUpperCase())}</small></div>`;
  }
  const vdot = (m) => `<span class="vdot ${m.v ? "" : "nv"}" title="${m.v ? "Veg" : "Non-veg"}"></span>`;
  function toast(msg) { const el = $("#toast"); el.textContent = msg; el.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove("show"), 2200); }
  function mins(hm) { const [h, m] = String(hm).split(":").map(Number); return h * 60 + (m || 0); }
  function fmt12(hm) { let [h, m] = String(hm).split(":").map(Number); const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return `${h}:${String(m || 0).padStart(2, "0")} ${ap}`; }
  function isOpen() { const d = new Date(); const n = d.getHours() * 60 + d.getMinutes(); const o = mins(CFG.OPEN_TIME), c = mins(CFG.CLOSE_TIME); return c > o ? n >= o && n < c : n >= o || n < c; }
  const timings = () => `${fmt12(CFG.OPEN_TIME)} – ${fmt12(CFG.CLOSE_TIME)}`;
  const waLink = (num, text) => { const n = String(num).replace(/\D/g, ""); const q = []; if (n) q.push("phone=" + n); if (text) q.push("text=" + encodeURIComponent(text)); return "https://api.whatsapp.com/send" + (q.length ? "?" + q.join("&") : ""); }; // wa.me redirect emoji tod deta hai, isliye api.whatsapp.com
  const appUrl = () => location.href.split("#")[0].replace(/index\.html$/, "");

  // ---------- cart ----------
  const cartQty = (id) => cart.filter((c) => c.id === id).reduce((a, c) => a + c.q, 0);
  function addToCart(id, v, q = 1) {
    const m = item(id); if (!m || m.out) return;
    v = hasHF(m) ? (v || "f") : "";
    const key = id + ":" + v; const ex = cart.find((c) => c.key === key);
    if (ex) ex.q += q; else cart.push({ key, id, v, q });
    cart = cart.filter((c) => c.q > 0); saveCart();
    const b = $("#cartBadge"); b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump");
  }
  function changeKey(key, d) { const c = cart.find((x) => x.key === key); if (!c) return; c.q += d; cart = cart.filter((x) => x.q > 0); saveCart(); }
  function changeItem(id, d) { // from list steppers: last variant
    const lines = cart.filter((c) => c.id === id); if (!lines.length) return addToCart(id);
    changeKey(lines[lines.length - 1].key, d);
  }
  const cartCount = () => cart.reduce((a, c) => a + c.q, 0);
  function totals() {
    const sub = cart.reduce((a, c) => { const m = item(c.id); return a + (m ? priceOf(m, c.v) * c.q : 0); }, 0);
    const fee = checkout.mode === "delivery" && sub > 0 && sub < Number(CFG.FREE_DELIVERY_ABOVE) ? Number(CFG.DELIVERY_FEE) : 0;
    let disc = 0, cmsg = "";
    const code = (checkout.coupon || "").trim().toUpperCase();
    if (code) {
      const cp = (store.get("coupons", null) || window.KANAK_COUPONS).find((x) => x.code === code);
      if (!cp) cmsg = "❌ Ye coupon valid nahi hai";
      else if (sub < cp.min) cmsg = `⚠️ ${code}: kam se kam ${rs(cp.min)} ka order chahiye`;
      else { disc = cp.type === "pct" ? Math.min(Math.round((sub * cp.value) / 100), cp.max || 1e9) : cp.value; cmsg = `✅ ${code} laga — ${rs(disc)} bache`; }
    }
    return { sub, fee, disc, total: Math.max(0, sub + fee - disc), cmsg };
  }
  function updateBadge() { const n = cartCount(); const b = $("#cartBadge"); b.hidden = !n; b.textContent = n; }

  // ---------- router ----------
  const routes = { home: Home, menu: Menu, cart: Cart, orders: Orders, more: More, gallery: Gallery, about: About, settings: Settings, owner: Owner };
  const subs = { gallery: "more", about: "more", settings: "more", owner: "more" };
  let current = "";
  function route() {
    const h = (location.hash || "#/home").replace(/^#\/?/, "");
    const [name, arg] = h.split("/");
    const r = routes[name] ? name : "home";
    current = r;
    $$(".tabbar a").forEach((a) => a.classList.toggle("on", a.dataset.tab === (subs[r] || r)));
    $("#backBtn").hidden = !subs[r]; $("#topLogo").hidden = !!subs[r];
    $("#topTitle").textContent = subs[r] ? ({ gallery: t("gallery"), about: t("about"), settings: t("settings"), owner: "Owner Panel" })[r] : CFG.SHORT_NAME;
    renderStatusLine(!!subs[r]);
    const old = $(".cartbar"); if (old) old.remove();
    routes[r](arg);
    app.firstElementChild && app.firstElementChild.classList.toggle("sub", !!subs[r]);
    if (["home", "menu"].includes(r) && cartCount()) showCartBar();
    window.scrollTo(0, 0);
  }
  function renderStatusLine(sub) {
    const el = $("#topSub");
    if (sub) { el.className = "status-line"; el.textContent = CFG.CAFE_NAME; return; }
    const o = isOpen(); el.className = "status-line" + (o ? "" : " closed");
    el.innerHTML = `<span class="dot"></span>${o ? t("open") : t("closed")} · ${timings().replace(/ (AM|PM)/g, "$1").replace(" – ", "–")}`;
  }
  function showCartBar() {
    const s = totals(); const a = document.createElement("a"); a.href = "#/cart"; a.className = "cartbar";
    a.innerHTML = `<span>${cartCount()} item · ${rs(s.sub)}</span><span>${t("cart_bar")} →</span>`; document.body.appendChild(a);
  }
  function rerenderKeepScroll() { const y = window.scrollY; const old = $(".cartbar"); if (old) old.remove(); routes[current](); if (["home", "menu"].includes(current) && cartCount()) showCartBar(); window.scrollTo(0, y); }

  // ---------- pages ----------
  function addBtn(m) {
    if (m.out) return `<span class="small muted">Abhi khatam</span>`;
    const q = cartQty(m.id);
    if (q && !hasHF(m)) return `<span class="stepper" data-stop><button data-dec="${m.id}" aria-label="Kam karo">−</button><span>${q}</span><button data-inc="${m.id}" aria-label="Aur add karo">+</button></span>`;
    return `<button class="add" data-add="${m.id}">${q ? q + " ✓" : t("add")}${hasHF(m) ? "" : ""}</button>`;
  }
  function priceTxt(m) { return hasHF(m) ? `${rs(m.h)} <s style="text-decoration:none">/ ${rs(m.f)}</s>` : rs(m.p); }

  function Home() {
    const o = isOpen();
    const best = MENU.filter((m) => m.best && !m.out).sort((a, b) => (b.img ? 1 : 0) - (a.img ? 1 : 0)).slice(0, 8);
    const offers = OFFERS.filter((x) => x.on);
    app.innerHTML = `<div class="page">
      <section class="hero" aria-label="Photos">
        <a class="gbadge" href="${CFG.REVIEW_URL}" target="_blank" rel="noopener"><span class="g">G</span><span class="st">★</span> ${CFG.GOOGLE_RATING} · ${CFG.GOOGLE_REVIEWS} reviews</a>
        <div class="hero-track" id="heroTrack">${window.KANAK_HERO.map((s) => `<div class="slide"><img src="${s.img}" alt="${esc(s.title)}"><div class="cap"><b>${esc(s.title)}</b><span>${esc(s.sub)}</span></div></div>`).join("")}</div>
        <div class="hero-dots" id="heroDots">${window.KANAK_HERO.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}</div>
        <a class="btn gold hero-cta" href="#/menu">${t("order_now")} →</a>
      </section>
      <div class="status-card">
        <div class="big">${o ? "🟢" : "🔴"}</div>
        <div style="flex:1"><b>${o ? t("open") : t("closed")} <span class="pill ${o ? "open" : "closed"}">${o ? "OPEN" : "CLOSED"}</span></b>
        <span class="small muted">${timings()} · ${esc(CFG.OPEN_DAYS)}</span></div>
        <a class="btn ghost sm" href="tel:${CFG.CAFE_PHONE}">📞 Call</a>
      </div>
      <h2 class="sec">${t("cats")}</h2>
      <div class="chips">${window.KANAK_CATS.map((c) => `<a class="cat-tile" href="#/menu/${c.id}"><div class="e">${c.e}</div>${esc(c.n.split(" ·")[0])}</a>`).join("")}</div>
      <h2 class="sec">${t("offers")} 🔥</h2>
      <div class="offers">${offers.map((x) => `<div class="offer" role="button" tabindex="0" data-offer="${x.id}"><span class="tag">${esc(x.tag || "OFFER")}</span><b>${esc(x.title)}</b><span>${esc(x.sub)}</span><div class="ic">${x.itemId && item(x.itemId) ? catOf(item(x.itemId).c).e : "🎁"}</div></div>`).join("") || `<p class="muted">Aaj koi offer nahi.</p>`}</div>
      <h2 class="sec">${t("best")} ⭐ <a href="#/menu">${t("all")} →</a></h2>
      <div class="grid">${best.map((m) => `<article class="pcard" data-open="${m.id}"><div class="ph">${photo(m, "s")}<span class="ribbon">BESTSELLER</span></div><div class="bd"><div class="nm">${vdot(m)} ${esc(m.n)}</div><div class="row"><span class="price">${rs(minPrice(m))}${hasHF(m) ? "+" : ""}</span>${addBtn(m)}</div></div></article>`).join("")}</div>
      <div class="card" style="margin-top:20px"><h4>${esc(CFG.SHORT_NAME)} ke baare mein ✨</h4>
        <div class="muted small">Log yahan aate hain in cheezon ke liye:</div>
        <div class="tagrow">${CFG.KNOWN_FOR.map((k) => `<span>😋 ${esc(k)}</span>`).join("")}</div>
        <div class="tagrow">${CFG.SERVICES.map((k) => `<span>✔ ${esc(k)}</span>`).join("")}</div>
        <a class="btn gold block" style="margin-top:14px" href="#/menu">${t("order_now")} — poora menu dekho</a>
      </div>
      <p class="made">Made with ❤️ by <a href="${waLink(CFG.MADE_BY_WHATSAPP, "Hi Misbah, mujhe bhi aisa app chahiye")}" target="_blank" rel="noopener">${esc(CFG.MADE_BY)}</a></p>
    </div>`;
    startHero();
  }
  let heroTimer;
  function startHero() {
    clearInterval(heroTimer);
    const tr = $("#heroTrack"); if (!tr) return; const dots = $$("#heroDots i");
    const idx = () => Math.round(tr.scrollLeft / tr.clientWidth);
    tr.addEventListener("scroll", () => { const i = idx(); dots.forEach((d, k) => d.classList.toggle("on", k === i)); }, { passive: true });
    heroTimer = setInterval(() => { if (!document.body.contains(tr)) return clearInterval(heroTimer); const n = (idx() + 1) % dots.length; tr.scrollTo({ left: n * tr.clientWidth, behavior: "smooth" }); }, 3500);
  }

  let menuQuery = "";
  function Menu(cat) {
    const q = menuQuery.trim().toLowerCase();
    const list = MENU.filter((m) => (prefs.veg === "all" || (prefs.veg === "veg" ? m.v : !m.v)) && (!q || (m.n + " " + catOf(m.c).n).toLowerCase().includes(q)));
    const secs = window.KANAK_CATS.map((c) => ({ c, items: list.filter((m) => m.c === c.id).sort((x, y) => (y.img ? 1 : 0) - (x.img ? 1 : 0)) })).filter((s) => s.items.length);
    app.innerHTML = `<div class="page">
      <div class="menu-tools">
        <label class="search"><span aria-hidden="true">🔍</span><input id="q" type="search" placeholder="${t("search")}" value="${esc(menuQuery)}" aria-label="Search"></label>
        <div class="filters">
          <button class="chip ${prefs.veg === "all" ? "on" : ""}" data-veg="all">${t("allf")}</button>
          <button class="chip ${prefs.veg === "veg" ? "on" : ""}" data-veg="veg"><span class="vdot"></span> ${t("veg")}</button>
          <button class="chip ${prefs.veg === "nonveg" ? "on" : ""}" data-veg="nonveg"><span class="vdot nv"></span> ${t("nonveg")}</button>
        </div>
        <div class="chips" id="catChips">${secs.map((s) => `<button class="chip" data-jump="${s.c.id}">${s.c.e} ${esc(s.c.n)}</button>`).join("")}</div>
      </div>
      ${secs.map((s) => `<section class="cat-sec" id="cat-${s.c.id}"><h3>${s.c.e} ${esc(s.c.n)} <small>${s.items.length}</small></h3>
        ${s.items.map((m) => `<article class="item ${m.out ? "oos" : ""}" data-open="${m.id}">
          <div class="ph">${photo(m, "s")}</div>
          <div class="info">
            ${m.best ? `<span class="best">★ BESTSELLER</span>` : ""}
            <div class="nm">${vdot(m)} ${esc(m.n)}</div>
            <div class="ds">${m.d ? esc(m.d) : hasHF(m) ? "Half / Full" : "&nbsp;"}</div>
            <div class="act"><span class="price">${priceTxt(m)}</span>${addBtn(m)}</div>
          </div></article>`).join("")}</section>`).join("") || `<div class="empty"><div class="e">🔍</div>Kuch nahi mila. Doosra naam try karo.</div>`}
      <p class="note">📋 ${t("menu_note")} · Menu: cafe ke menu card (Google photo) se</p>
    </div>`;
    const qi = $("#q");
    qi.addEventListener("input", () => { menuQuery = qi.value; clearTimeout(Menu._t); Menu._t = setTimeout(() => { Menu(); const n = $("#q"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); if (cartCount() && !$(".cartbar")) showCartBar(); }, 180); });
    if (cat) setTimeout(() => { const el = $("#cat-" + cat); if (el) el.scrollIntoView({ behavior: "smooth" }); }, 60);
  }

  function openItem(id) {
    const m = item(id); if (!m) return;
    let v = hasHF(m) ? "f" : ""; let q = 1;
    const sheet = $("#sheet");
    const draw = () => {
      sheet.innerHTML = `<button class="x" data-close aria-label="Band karo">✕</button>
        <div class="sph ph">${photo(m)}</div>
        <div class="sbody">
          ${m.best ? `<span class="best">★ BESTSELLER</span>` : ""}
          <h3>${vdot(m)} ${esc(m.n)}</h3>
          <div class="muted small">${m.d ? esc(m.d) : esc(catOf(m.c).n)}</div>
          ${m.img ? `<div class="small" style="margin-top:6px;color:var(--gold)">📸 Asli photo — ${esc(CFG.SHORT_NAME)}</div>` : ""}
          ${hasHF(m) ? ["h", "f"].map((k) => `<div class="opt ${v === k ? "on" : ""}" data-v="${k}"><span>${varLabel(m, k)}</span><b>${rs(priceOf(m, k))}</b></div>`).join("") : `<div class="price" style="font-size:22px;margin-top:10px">${rs(m.p)}</div>`}
          ${m.out ? `<p class="muted">Abhi khatam hai 😔</p>` : `<div class="foot">
            <span class="stepper"><button data-q="-1" aria-label="Kam">−</button><span>${q}</span><button data-q="1" aria-label="Zyada">+</button></span>
            <button class="btn gold" style="flex:1" data-addsheet>Add · ${rs(priceOf(m, v) * q)}</button></div>`}
          <p class="note">${t("menu_note")}</p>
        </div>`;
    };
    draw(); $("#sheetWrap").hidden = false;
    sheet.onclick = (e) => {
      const o = e.target.closest("[data-v]"); if (o) { v = o.dataset.v; draw(); return; }
      const qq = e.target.closest("[data-q]"); if (qq) { q = Math.max(1, q + Number(qq.dataset.q)); draw(); return; }
      if (e.target.closest("[data-addsheet]")) { addToCart(m.id, v, q); closeSheet(); toast(t("added")); rerenderKeepScroll(); }
    };
  }
  function openSheet(html) { $("#sheet").innerHTML = `<div class="grab"></div><div class="sbody">${html}</div>`; $("#sheet").onclick = null; $("#sheetWrap").hidden = false; }
  function closeSheet() { $("#sheetWrap").hidden = true; }

  function Cart() {
    if (!cart.length) {
      app.innerHTML = `<div class="page"><div class="empty"><div class="e">🛒</div><h3>${t("cart_empty")}</h3><p>${t("cart_empty2")}</p><a class="btn gold" href="#/menu">${t("go_menu")}</a></div></div>`; return;
    }
    const s = totals(); const d = checkout.mode === "delivery";
    app.innerHTML = `<div class="page">
      <div class="card" style="margin-top:0"><h4>🛒 ${cartCount()} item</h4>
        ${cart.map((c) => { const m = item(c.id); if (!m) return ""; return `<div class="citem">${vdot(m)}<div class="nm">${esc(m.n)}<small>${varLabel(m, c.v) ? varLabel(m, c.v) + " · " : ""}${rs(priceOf(m, c.v))}</small></div>
          <span class="stepper"><button data-ck="${c.key}" data-d="-1" aria-label="Kam">−</button><span>${c.q}</span><button data-ck="${c.key}" data-d="1" aria-label="Zyada">+</button></span>
          <b style="min-width:58px;text-align:right">${rs(priceOf(m, c.v) * c.q)}</b></div>`; }).join("")}
        <a href="#/menu" class="small" style="color:var(--gold);font-weight:700;text-decoration:none;display:inline-block;margin-top:8px">+ Aur add karo</a>
      </div>
      <div class="card"><div class="seg"><button class="${d ? "on" : ""}" data-mode="delivery">🛵 ${t("delivery")}</button><button class="${d ? "" : "on"}" data-mode="pickup">🏃 ${t("pickup")}</button></div>
        <div class="small muted" style="margin-top:8px">${d ? `Delivery ${rs(CFG.DELIVERY_FEE)} · ${rs(CFG.FREE_DELIVERY_ABOVE)}+ pe FREE (sample)` : "Cafe pe aake le jaao · GT Road, Bich Bazar"}</div></div>
      <div class="card"><h4>📋 Details</h4>
        <label class="field"><span>${t("name")}</span><input id="f_name" autocomplete="name" value="${esc(checkout.name)}" placeholder="Jaise: Rahul"></label>
        <label class="field"><span>${t("phone")}</span><input id="f_phone" inputmode="numeric" maxlength="10" autocomplete="tel" value="${esc(checkout.phone)}" placeholder="10 digit"></label>
        ${d ? `<label class="field"><span>${t("addr")}</span><textarea id="f_addr" rows="2" placeholder="Ghar no., gali, landmark — Govindpur">${esc(checkout.addr)}</textarea></label>` : ""}
        <label class="field"><span>${t("note")}</span><input id="f_note" value="${esc(checkout.note)}"></label>
      </div>
      <div class="card"><h4>🎟️ ${t("coupon")}</h4>
        <div class="coupon"><div class="field" style="flex:1;margin:0"><input id="f_coupon" value="${esc(checkout.coupon)}" placeholder="${esc((window.KANAK_COUPONS[0] || {}).code || "COUPON")}" aria-label="${t("coupon")}"></div><button class="btn ghost sm" id="applyCp">${t("apply")}</button></div>
        <div class="small" style="margin-top:8px" id="cpMsg">${s.cmsg || `Try karo: <b>${esc((window.KANAK_COUPONS[0] || {}).code || "")}</b> (demo)`}</div></div>
      <div class="card bill"><h4>🧾 ${t("bill")}</h4>
        <div class="r"><span>${t("items_total")}</span><span>${rs(s.sub)}</span></div>
        ${d ? `<div class="r"><span>${t("dfee")}</span><span>${s.fee ? rs(s.fee) : "FREE"}</span></div>` : ""}
        ${s.disc ? `<div class="r disc"><span>${t("discount")}</span><span>−${rs(s.disc)}</span></div>` : ""}
        <div class="r tot"><span>${t("topay")}</span><span>${rs(s.total)}</span></div></div>
      <button class="btn wa block" id="sendWa" style="margin-top:16px;min-height:56px;font-size:17px">🟢 ${t("send_wa")}</button>
      <p class="note">Order seedha cafe ke WhatsApp pe jaayega · Payment: Cash / UPI on delivery</p>
    </div>`;
    const bind = (id, k) => { const el = $("#" + id); if (el) el.addEventListener("input", () => { checkout[k] = el.value; store.set("checkout", checkout); }); };
    bind("f_name", "name"); bind("f_phone", "phone"); bind("f_addr", "addr"); bind("f_note", "note"); bind("f_coupon", "coupon");
    $("#applyCp").onclick = () => { checkout.coupon = $("#f_coupon").value.trim().toUpperCase(); store.set("checkout", checkout); rerenderKeepScroll(); };
    $("#sendWa").onclick = placeOrder;
  }

  function placeOrder() {
    const d = checkout.mode === "delivery";
    const ph = (checkout.phone || "").replace(/\D/g, "");
    if (!checkout.name.trim()) { toast("Apna naam likho 🙂"); $("#f_name").focus(); return; }
    if (ph.length !== 10) { toast("10 digit mobile number daalo"); $("#f_phone").focus(); return; }
    if (d && checkout.addr.trim().length < 5) { toast("Address thoda detail mein likho"); $("#f_addr").focus(); return; }
    const s = totals();
    const orders = store.get("orders", []);
    const no = "K" + (1001 + orders.length + Math.floor(Math.random() * 9));
    const lines = cart.map((c) => { const m = item(c.id); return { n: m.n + (varLabel(m, c.v) ? ` (${varLabel(m, c.v)})` : ""), q: c.q, p: priceOf(m, c.v) }; });
    const order = { no, at: Date.now(), name: checkout.name.trim(), phone: ph, mode: checkout.mode, addr: d ? checkout.addr.trim() : "", note: checkout.note.trim(), lines, sub: s.sub, fee: s.fee, disc: s.disc, coupon: s.disc ? checkout.coupon.toUpperCase() : "", total: s.total, status: "placed" };
    let msg = `🍽️ *Naya Order — ${CFG.SHORT_NAME}*\nOrder: #${no}\n\n`;
    lines.forEach((l) => (msg += `• ${l.q} × ${l.n} — ₹${l.p * l.q}\n`));
    msg += `\nItems: ₹${s.sub}`;
    if (s.fee) msg += `\nDelivery: ₹${s.fee}`;
    if (s.disc) msg += `\nCoupon ${order.coupon}: −₹${s.disc}`;
    msg += `\n*Total: ₹${s.total}*\n\n👤 ${order.name}\n📞 ${ph}\n${d ? "🛵 Delivery: " + order.addr : "🏃 Pickup (cafe se)"}`;
    if (order.note) msg += `\n📝 ${order.note}`;
    msg += `\n\n(${CFG.SHORT_NAME} app se bheja)`;
    orders.unshift(order); store.set("orders", orders);
    cart = []; saveCart(); checkout.coupon = ""; checkout.note = ""; store.set("checkout", checkout);
    window.open(waLink(CFG.WHATSAPP_NUMBER, msg), "_blank");
    if (prefs.notif) notify("Order bhej diya ✅", `#${no} · ${rs(s.total)} — cafe confirm karega`);
    location.hash = "#/orders"; setTimeout(() => toast(`Order #${no} WhatsApp pe bheja ✅`), 300);
  }

  const STEPS = ["placed", "preparing", "ready", "done"];
  const STEP_IC = { placed: "📝", preparing: "👨‍🍳", ready: "🛍️", done: "✅" };
  function Orders() {
    const orders = store.get("orders", []);
    if (!orders.length) { app.innerHTML = `<div class="page"><div class="empty"><div class="e">🧾</div><h3>${t("no_orders")}</h3><p>Pehla order karo — yahan live status dikhega.</p><a class="btn gold" href="#/menu">${t("order_now")}</a></div></div>`; return; }
    app.innerHTML = `<div class="page"><h2 class="sec" style="margin-top:4px">${t("my_orders")}</h2>
      ${orders.map((o, i) => { const si = STEPS.indexOf(o.status); return `<div class="ocard"><div class="hd"><b>#${o.no}</b><span class="small muted">${new Date(o.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span></div>
        <div class="small muted" style="margin-top:4px">${o.lines.map((l) => `${l.q}× ${esc(l.n)}`).join(", ")}</div>
        <div class="track">${STEPS.map((s, k) => `<div class="st ${k <= si ? "done" : ""} ${k === si && s !== "done" ? "now" : ""}"><i>${STEP_IC[s]}</i>${t(s)}</div>`).join("")}</div>
        <div class="hd"><span>${o.mode === "delivery" ? "🛵 Delivery" : "🏃 Pickup"} · <b class="price">${rs(o.total)}</b></span><button class="btn ghost sm" data-reorder="${i}">↻ ${t("reorder")}</button></div></div>`; }).join("")}
      <p class="note">Status cafe update karta hai (demo: Owner panel se badal ke dekho)</p></div>`;
  }

  function More() {
    app.innerHTML = `<div class="page">
      <div class="profile"><img src="img/logo.webp" alt=""><div><b>${esc(CFG.CAFE_NAME)}</b><span>★ ${CFG.GOOGLE_RATING} Google · GT Road, Govindpur</span></div></div>
      <div class="list">
        ${li("#/gallery", "📸", t("gallery"), "Cafe aur khane ki asli photos")}
        ${li("#/about", "📍", t("about"), "Call, WhatsApp, Map, Instagram")}
        ${li(CFG.REVIEW_URL, "⭐", t("review"), "Accha laga? 5 star do 🙏", true)}
      </div>
      <div class="list">
        ${li("#/settings", "⚙️", t("settings"), "Dark mode, language, install, share")}
        <button class="li" data-act="install"><span class="ic">📲</span><span class="tx"><b>${t("install")}</b><small>Phone pe app jaisa — 1 tap</small></span><span class="go">›</span></button>
        <button class="li" data-act="share"><span class="ic">🔗</span><span class="tx"><b>${t("share")}</b><small>Doston ko bhejo · QR code</small></span><span class="go">›</span></button>
      </div>
      <div class="list">${li("#/owner", "🔐", t("owner"), "Sirf cafe owner ke liye")}</div>
      <p class="made">v${CFG.APP_VERSION} · Made with ❤️ by <a href="${waLink(CFG.MADE_BY_WHATSAPP, "Hi Misbah, mujhe bhi aisa app chahiye")}" target="_blank" rel="noopener">${esc(CFG.MADE_BY)}</a></p>
    </div>`;
  }
  function li(href, ic, title, sub, ext) { return `<a class="li" href="${href}" ${ext ? 'target="_blank" rel="noopener"' : ""}><span class="ic">${ic}</span><span class="tx"><b>${title}</b><small>${sub}</small></span><span class="go">›</span></a>`; }

  function Gallery() {
    app.innerHTML = `<div class="page"><div class="gallery">${window.KANAK_GALLERY.map((g) => `<button data-lb="img/${g}.webp" aria-label="Photo badi karo"><img src="img/${g}${g === "menu-cover" ? "" : "-s"}.webp" alt="Kanak Cafe photo" loading="lazy"></button>`).join("")}</div>
    <p class="note">Photos: ${esc(CFG.SHORT_NAME)} ki Google listing se</p></div>`;
  }
  function About() {
    app.innerHTML = `<div class="page">
      <div class="profile"><img src="img/logo.webp" alt=""><div><b>${esc(CFG.CAFE_NAME)}</b><span>${esc(CFG.TAGLINE)}</span></div></div>
      <div class="infogrid">
        <div class="card"><small class="muted">Google</small><b>★ ${CFG.GOOGLE_RATING} (${CFG.GOOGLE_REVIEWS})</b></div>
        <div class="card"><small class="muted">Timing</small><b>${timings()}</b></div>
        <div class="card"><small class="muted">Kharcha</small><b>${esc(CFG.PRICE_RANGE)}</b></div>
        <div class="card"><small class="muted">Din</small><b>${esc(CFG.OPEN_DAYS)}</b></div>
      </div>
      <div class="card"><h4>📍 Address</h4><div class="muted">${esc(CFG.ADDRESS)}</div><div class="small muted" style="margin-top:6px">🅿️ Free street parking</div></div>
      <div class="list">
        ${li("tel:" + CFG.CAFE_PHONE, "📞", "Call karo", CFG.CAFE_PHONE.replace("+91", "+91 "))}
        ${li(waLink(CFG.WHATSAPP_NUMBER, "Hi Kanak Cafe!"), "💬", "WhatsApp", "Order / table booking", true)}
        ${li(CFG.MAPS_URL, "🗺️", "Google Maps pe raasta", "GT Road, Bich Bazar", true)}
        ${li("https://instagram.com/" + CFG.INSTAGRAM, "📷", "Instagram", "@" + CFG.INSTAGRAM, true)}
        ${li(CFG.REVIEW_URL, "⭐", t("review"), "Aapka review hum ko aage badhata hai", true)}
      </div>
      <div class="card"><h4>Services</h4><div class="tagrow">${CFG.SERVICES.map((k) => `<span>✔ ${esc(k)}</span>`).join("")}</div></div>
    </div>`;
  }

  // ---------- install / share ----------
  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferredPrompt = e; });
  window.addEventListener("appinstalled", () => { deferredPrompt = null; toast("App install ho gaya 🎉"); });
  const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  async function doInstall() {
    if (isStandalone()) { toast("App pehle se install hai ✅"); return; }
    if (deferredPrompt) {
      try { deferredPrompt.prompt(); const r = await deferredPrompt.userChoice; toast(r.outcome === "accepted" ? "Install ho raha hai 🎉" : "Koi baat nahi, baad mein kar lena"); } catch (e) { installHelp(); }
      deferredPrompt = null; return;
    }
    installHelp();
  }
  function installHelp() {
    openSheet(`<h3>📲 ${t("install")}</h3>
      ${isIOS() ? `<p class="muted">iPhone pe (Safari mein kholo):</p><ol><li>Neeche <b>Share</b> button (⬆️) dabao</li><li><b>"Add to Home Screen"</b> chuno</li><li><b>Add</b> dabao — app icon home screen pe aa jaayega</li></ol>`
      : `<p class="muted">Android (Chrome) pe:</p><ol><li>Upar right mein <b>⋮</b> menu dabao</li><li><b>"Install app"</b> ya <b>"Add to Home screen"</b> chuno</li><li><b>Install</b> dabao</li></ol>`}
      <p class="small muted">Install ke baad ye app internet kam hone pe bhi khulta hai (offline ready).</p>
      <button class="btn gold block" data-close>Theek hai</button>`);
  }
  function qrSvg(text) {
    try { const qr = qrcode(0, "M"); qr.addData(text); qr.make(); return qr.createSvgTag({ cellSize: 5, margin: 2, scalable: true }); } catch (e) { return ""; }
  }
  async function copyText(s) {
    try { await navigator.clipboard.writeText(s); toast("Link copy ho gaya ✓"); }
    catch (e) { const ta = document.createElement("textarea"); ta.value = s; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); toast("Link copy ho gaya ✓"); } catch (_) { toast(s); } ta.remove(); }
  }
  async function doShare() {
    const url = appUrl(); const text = `${CFG.CAFE_NAME} ka app 😋 — menu dekho aur WhatsApp pe order karo:`;
    if (navigator.share) { try { await navigator.share({ title: CFG.CAFE_NAME, text, url }); return; } catch (e) { if (e && e.name === "AbortError") return; } }
    shareSheet();
  }
  function shareSheet() {
    const url = appUrl();
    openSheet(`<h3>🔗 ${t("share")}</h3><p class="muted small">Ye QR scan karke koi bhi app khol sakta hai — counter pe laga do!</p>
      <div class="qrbox">${qrSvg(url)}</div>
      <div class="field"><input readonly value="${esc(url)}" aria-label="App link"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <button class="btn ghost" data-act="copy">📋 Copy link</button>
        <a class="btn wa" href="${waLink("", CFG.CAFE_NAME + " ka app: " + url)}" target="_blank" rel="noopener">💬 WhatsApp</a>
      </div>
      ${navigator.share ? `<button class="btn gold block" style="margin-top:8px" data-act="nativeshare">📤 Aur apps mein share</button>` : ""}
      <button class="btn ghost block" style="margin-top:8px" data-close>Band karo</button>`);
  }
  function notify(title, body) {
    try { if ("Notification" in window && Notification.permission === "granted") { navigator.serviceWorker && navigator.serviceWorker.ready.then((r) => r.showNotification(title, { body, icon: "img/icon-192.png" })).catch(() => new Notification(title, { body })); return; } } catch (e) {}
    toast(title + " · " + body);
  }

  function Settings() {
    app.innerHTML = `<div class="page">
      <h2 class="sec" style="margin-top:4px">🎨 Look</h2>
      <div class="list">
        <label class="li"><span class="ic">🌙</span><span class="tx"><b>${t("dark")}</b><small>Raat mein aankhon ko aaram</small></span><span class="switch"><input type="checkbox" id="s_dark" ${prefs.theme === "dark" ? "checked" : ""}><i></i></span></label>
        <div class="li"><span class="ic">🌐</span><span class="tx"><b>${t("lang")}</b><small>Hinglish / English</small></span>
          <span class="seg" style="width:150px"><button class="${prefs.lang === "hi" ? "on" : ""}" data-lang="hi">Hinglish</button><button class="${prefs.lang === "en" ? "on" : ""}" data-lang="en">English</button></span></div>
        <label class="li"><span class="ic">🔔</span><span class="tx"><b>${t("notif")}</b><small>Order update aur offers (demo)</small></span><span class="switch"><input type="checkbox" id="s_notif" ${prefs.notif ? "checked" : ""}><i></i></span></label>
      </div>
      <h2 class="sec">📲 App</h2>
      <div class="list">
        <button class="li" data-act="install"><span class="ic">⬇️</span><span class="tx"><b>${t("install")}</b><small>${isStandalone() ? "Install ho chuka hai ✅" : "Home screen pe icon — Play Store ki zaroorat nahi"}</small></span><span class="go">›</span></button>
        <button class="li" data-act="share"><span class="ic">📤</span><span class="tx"><b>${t("share")}</b><small>WhatsApp, Instagram, kahin bhi</small></span><span class="go">›</span></button>
        <button class="li" data-act="qr"><span class="ic">🔳</span><span class="tx"><b>QR code / Copy link</b><small>Counter pe lagao, scan karke khulega</small></span><span class="go">›</span></button>
      </div>
      <h2 class="sec">🛠️ Data</h2>
      <div class="list">
        <button class="li" data-act="clear"><span class="ic">🗑️</span><span class="tx"><b>${t("clear")}</b><small>Cart, orders, settings reset</small></span><span class="go">›</span></button>
        <div class="li"><span class="ic">ℹ️</span><span class="tx"><b>${t("version")}</b><small>v${CFG.APP_VERSION} · offline ready</small></span></div>
      </div>
      <p class="made">Made with ❤️ by <a href="${waLink(CFG.MADE_BY_WHATSAPP, "Hi Misbah, mujhe bhi aisa app chahiye")}" target="_blank" rel="noopener">${esc(CFG.MADE_BY)}</a><br><span class="small">Aapki dukaan ka bhi app chahiye? WhatsApp karo</span></p>
    </div>`;
    $("#s_dark").onchange = (e) => { prefs.theme = e.target.checked ? "dark" : "light"; savePrefs(); applyTheme(); };
    $("#s_notif").onchange = async (e) => {
      prefs.notif = e.target.checked; savePrefs();
      if (prefs.notif && "Notification" in window && Notification.permission === "default") { try { await Notification.requestPermission(); } catch (_) {} }
      toast(prefs.notif ? "Notifications ON 🔔 (demo)" : "Notifications OFF");
      if (prefs.notif) setTimeout(() => notify(CFG.SHORT_NAME + " 🔥", ((OFFERS.find((o) => o.on) || {}).title || "Aaj ka special") + " — abhi order karo!"), 900);
    };
  }

  // ---------- OWNER PANEL ----------
  let ownerTab = "dash", ownerFilter = "active", pin = "";
  const authed = () => sessionStorage.getItem(K + "owner") === "1";
  function seedOrders() {
    if (store.get("seeded", false)) return;
    const now = Date.now(), day = 864e5; const names = ["Rahul", "Priya", "Aman", "Sana", "Vikash", "Neha", "Arif", "Pooja", "Sohail", "Ritika"];
    const picks = ["i5", "i2", "i58", "i35", "i60", "i1", "i66", "i100"].filter((id) => item(id));
    const seeded = [];
    for (let dd = 6; dd >= 0; dd--) {
      const n = dd === 0 ? 4 : 3 + ((dd * 7) % 5);
      for (let k = 0; k < n; k++) {
        const ids = [picks[(dd + k) % picks.length], picks[(dd * 3 + k + 1) % picks.length]];
        const lines = ids.map((id, j) => { const m = item(id); const v = hasHF(m) ? (j ? "h" : "f") : ""; return { n: m.n + (varLabel(m, v) ? ` (${varLabel(m, v)})` : ""), q: 1 + ((k + j) % 2), p: priceOf(m, v) }; });
        const sub = lines.reduce((a, l) => a + l.p * l.q, 0);
        seeded.push({ no: "S" + (500 + seeded.length), at: now - dd * day - k * 47 * 6e4 - 30 * 6e4, name: names[(dd + k) % names.length], phone: "98" + String(10000000 + ((dd * 13 + k) * 7919) % 89999999).slice(0, 8), mode: k % 2 ? "pickup" : "delivery", addr: k % 2 ? "" : "Govindpur", lines, sub, fee: k % 2 ? 0 : 20, disc: 0, total: sub + (k % 2 ? 0 : 20), status: dd === 0 ? STEPS[k % 3] : "done", sample: true });
      }
    }
    store.set("orders", store.get("orders", []).concat(seeded).sort((a, b) => b.at - a.at)); store.set("seeded", true);
  }
  function Owner() {
    if (!authed()) {
      app.innerHTML = `<div class="page"><div class="pinpad"><div style="font-size:46px">🔐</div><h3 style="margin:6px 0">Owner login</h3><p class="muted small">4 digit PIN daalo (demo PIN: 1234)</p>
        <div class="pindots" id="pd">${[0, 1, 2, 3].map((i) => `<i class="${i < pin.length ? "f" : ""}"></i>`).join("")}</div>
        <div class="keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"].map((k) => k === "" ? "<span></span>" : `<button data-pin="${k}">${k}</button>`).join("")}</div></div></div>`;
      return;
    }
    seedOrders();
    const tabs = [["dash", "📊 Dashboard"], ["orders", "🧾 Orders"], ["menu", "🍽️ Menu"], ["offers", "🔥 Offers"], ["cfg", "⚙️ Settings"]];
    const head = `<div class="otabs"><div class="chips">${tabs.map(([k, n]) => `<button class="chip ${ownerTab === k ? "on" : ""}" data-otab="${k}">${n}</button>`).join("")}</div></div>`;
    const body = { dash: oDash, orders: oOrders, menu: oMenu, offers: oOffers, cfg: oCfg }[ownerTab]();
    app.innerHTML = `<div class="page">${head}${body}<div style="display:flex;gap:8px;margin-top:22px"><button class="btn ghost sm" data-oact="logout" style="flex:1">🚪 Logout</button><button class="btn ghost sm" data-oact="reset" style="flex:1">♻️ Demo reset</button></div></div>`;
    if (ownerTab === "cfg") bindCfg();
  }
  function dayKey(ts) { const d = new Date(ts); return d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate(); }
  function oDash() {
    const orders = store.get("orders", []); const today = dayKey(Date.now());
    const to = orders.filter((o) => dayKey(o.at) === today);
    const earn = to.reduce((a, o) => a + o.total, 0);
    const pend = orders.filter((o) => o.status !== "done").length;
    const days = []; for (let i = 6; i >= 0; i--) { const ts = Date.now() - i * 864e5; const k = dayKey(ts); const os = orders.filter((o) => dayKey(o.at) === k); days.push({ lbl: i ? new Date(ts).toLocaleDateString("en-IN", { weekday: "short" }) : "Aaj", amt: os.reduce((a, o) => a + o.total, 0), today: !i }); }
    const mx = Math.max(1, ...days.map((d) => d.amt));
    const cnt = {}; orders.forEach((o) => o.lines.forEach((l) => (cnt[l.n] = (cnt[l.n] || 0) + l.q)));
    const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 4);
    return `<div class="stats">
      <div class="stat hl"><small>Aaj ki kamai</small><b>${rs(earn)}</b></div>
      <div class="stat"><small>Aaj ke orders</small><b>${to.length}</b></div>
      <div class="stat"><small>Pending</small><b style="color:#f3b54a">${pend}</b></div>
      <div class="stat"><small>Avg order</small><b>${rs(to.length ? earn / to.length : 0)}</b></div></div>
      <div class="card"><h4>📈 Pichhle 7 din ki kamai</h4><div class="chart">${days.map((d) => `<div class="b ${d.today ? "today" : ""}"><em>${d.amt ? "₹" + (d.amt >= 1000 ? (d.amt / 1000).toFixed(1) + "k" : d.amt) : ""}</em><i style="height:${Math.round((d.amt / mx) * 100)}%"></i>${d.lbl}</div>`).join("")}</div></div>
      <div class="card"><h4>🏆 Top items</h4>${top.map(([n, q], i) => `<div class="citem"><b>${i + 1}.</b><div class="nm">${esc(n)}</div><span class="muted">${q} bike</span></div>`).join("") || '<p class="muted">Abhi data nahi</p>'}</div>
      <p class="note">Sample orders (S5xx) demo ke liye daale gaye hain · is phone se kiye asli orders bhi yahan aate hain</p>`;
  }
  function oOrders() {
    const orders = store.get("orders", []);
    const f = orders.map((o, i) => [o, i]).filter(([o]) => ownerFilter === "all" ? true : ownerFilter === "active" ? o.status !== "done" : o.status === "done");
    return `<div class="chips" style="margin-bottom:10px">${[["active", "Chal rahe"], ["done", "Delivered"], ["all", "Sab"]].map(([k, n]) => `<button class="chip ${ownerFilter === k ? "on" : ""}" data-ofil="${k}">${n}</button>`).join("")}</div>
      ${f.map(([o, i]) => `<div class="orow"><div class="hd"><b>#${o.no} · ${esc(o.name)}</b><span class="st-${o.status}" style="font-weight:800">${t(o.status)}</span></div>
        <div class="small muted">${new Date(o.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })} · ${o.mode === "delivery" ? "🛵 " + esc(o.addr || "Delivery") : "🏃 Pickup"}</div>
        <div class="its">${o.lines.map((l) => `${l.q}× ${esc(l.n)}`).join(", ")}</div>
        <div class="hd"><b class="price">${rs(o.total)}</b>
          <select data-ost="${i}" aria-label="Status">${STEPS.map((s) => `<option value="${s}" ${o.status === s ? "selected" : ""}>${t(s)}</option>`).join("")}</select></div>
        <div class="acts"><a class="btn ghost sm" href="tel:${o.phone}">📞 Call</a><a class="btn ghost sm" href="${waLink("91" + o.phone, `Namaste ${o.name}, ${CFG.SHORT_NAME} se — aapka order #${o.no} `)}" target="_blank" rel="noopener">💬 WhatsApp</a>
          ${o.status !== "done" ? `<button class="btn gold sm" data-onext="${i}">Next → ${t(STEPS[Math.min(3, STEPS.indexOf(o.status) + 1)])}</button>` : ""}</div></div>`).join("") || `<div class="empty"><div class="e">✅</div>Koi order nahi</div>`}`;
  }
  let menuEditQ = "";
  function oMenu() {
    const q = menuEditQ.toLowerCase();
    const list = MENU.filter((m) => !q || m.n.toLowerCase().includes(q));
    return `<div class="card" style="margin-top:0"><h4>➕ Naya item add karo</h4>
        <label class="field"><span>Naam</span><input id="n_name" placeholder="Jaise: Kulhad Chai"></label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><label class="field"><span>Price ₹</span><input id="n_price" type="number" inputmode="numeric" placeholder="49"></label>
        <label class="field"><span>Category</span><select id="n_cat">${window.KANAK_CATS.map((c) => `<option value="${c.id}">${esc(c.n)}</option>`).join("")}</select></label></div>
        <label class="li" style="padding:6px 0;min-height:0;border:0"><span class="tx"><b>Veg item</b></span><span class="switch"><input type="checkbox" id="n_veg" checked><i></i></span></label>
        <button class="btn gold block" data-oact="additem">Add karo</button></div>
      <div class="card"><h4>✏️ Price / Stock badlo <small class="muted">(${MENU.length} items)</small></h4>
        <label class="search" style="margin-bottom:6px"><span>🔍</span><input id="me_q" placeholder="Item dhundo" value="${esc(menuEditQ)}"></label>
        ${list.slice(0, 60).map((m) => `<div class="medit">${vdot(m)}<div class="nm">${esc(m.n)}${hasHF(m) ? '<br><small class="muted">Half / Full</small>' : ""}</div>
          ${hasHF(m) ? `<input type="number" data-price="${m.id}" data-k="h" value="${m.h}" aria-label="Half price"><input type="number" data-price="${m.id}" data-k="f" value="${m.f}" aria-label="Full price">` : `<input type="number" data-price="${m.id}" data-k="p" value="${m.p}" aria-label="Price">`}
          <span class="switch" title="Stock mein"><input type="checkbox" data-stock="${m.id}" ${m.out ? "" : "checked"} aria-label="In stock"><i></i></span></div>`).join("")}
        ${list.length > 60 ? `<p class="small muted">Aur ${list.length - 60} items — search karo</p>` : ""}
        <p class="small muted">Badlav turant customer app mein dikhega ✓ (switch off = "Abhi khatam")</p></div>`;
  }
  function oOffers() {
    return `<div class="card" style="margin-top:0"><h4>➕ Naya offer</h4>
      <label class="field"><span>Title</span><input id="of_t" placeholder="Jaise: Weekend Momo Party"></label>
      <label class="field"><span>Detail</span><input id="of_s" placeholder="Jaise: 2 plate pe 1 Cold drink free"></label>
      <button class="btn gold block" data-oact="addoffer">Offer daalo</button></div>
      <div class="card"><h4>🔥 Offers (Home pe dikhte hain)</h4>
      ${OFFERS.map((o) => `<div class="medit"><div class="nm">${esc(o.title)}<br><small class="muted">${esc(o.sub)}</small></div>
        <span class="switch"><input type="checkbox" data-offon="${o.id}" ${o.on ? "checked" : ""} aria-label="Offer on"><i></i></span>
        <button class="icon-btn" data-offdel="${o.id}" aria-label="Delete">🗑️</button></div>`).join("") || '<p class="muted">Koi offer nahi</p>'}</div>`;
  }
  function oCfg() {
    return `<div class="card" style="margin-top:0"><h4>⚙️ Cafe settings</h4>
      <label class="field"><span>Order WhatsApp number (91 ke saath)</span><input id="c_wa" inputmode="numeric" value="${esc(CFG.WHATSAPP_NUMBER)}"></label>
      <label class="field"><span>Call number</span><input id="c_ph" value="${esc(CFG.CAFE_PHONE)}"></label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <label class="field"><span>Khulne ka time</span><input id="c_open" type="time" value="${esc(CFG.OPEN_TIME)}"></label>
        <label class="field"><span>Band hone ka time</span><input id="c_close" type="time" value="${esc(CFG.CLOSE_TIME)}"></label></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <label class="field"><span>Delivery charge ₹</span><input id="c_fee" type="number" value="${esc(CFG.DELIVERY_FEE)}"></label>
        <label class="field"><span>Free delivery above ₹</span><input id="c_free" type="number" value="${esc(CFG.FREE_DELIVERY_ABOVE)}"></label></div>
      <button class="btn gold block" data-oact="savecfg">💾 Save karo</button>
      <p class="small muted">Ye settings is phone pe save hoti hain (demo). Asli app mein Misbah Digital inhe permanent kar dega.</p></div>`;
  }
  function bindCfg() {}

  // ---------- global events ----------
  document.addEventListener("click", (e) => {
    const T_ = e.target;
    const close = T_.closest("[data-close]"); if (close) { closeSheet(); return; }
    const lb = T_.closest("[data-lb]"); if (lb) { const d = document.createElement("div"); d.className = "lightbox"; d.innerHTML = `<img src="${lb.dataset.lb}" alt="Photo">`; d.onclick = () => d.remove(); document.body.appendChild(d); return; }
    const lbx = T_.closest(".lightbox"); if (lbx) { lbx.remove(); return; }
    let el;
    if ((el = T_.closest("[data-add]"))) { e.stopPropagation(); const m = item(el.dataset.add); if (hasHF(m)) openItem(m.id); else { addToCart(m.id); toast(t("added")); rerenderKeepScroll(); } return; }
    if ((el = T_.closest("[data-inc]"))) { changeItem(el.dataset.inc, 1); rerenderKeepScroll(); return; }
    if ((el = T_.closest("[data-dec]"))) { changeItem(el.dataset.dec, -1); rerenderKeepScroll(); return; }
    if (T_.closest("[data-stop]")) return;
    if ((el = T_.closest("[data-open]"))) { openItem(el.dataset.open); return; }
    if ((el = T_.closest("[data-offer]"))) { const o = OFFERS.find((x) => x.id === el.dataset.offer); if (o && o.itemId && item(o.itemId)) openItem(o.itemId); else if (o && o.cat) location.hash = "#/menu/" + o.cat; else { location.hash = "#/menu"; toast("Checkout pe coupon " + ((window.KANAK_COUPONS[0] || {}).code || "") + " lagao 🎟️"); } return; }
    if ((el = T_.closest("[data-veg]"))) { prefs.veg = el.dataset.veg; savePrefs(); Menu(); if (cartCount()) { const o = $(".cartbar"); if (!o) showCartBar(); } return; }
    if ((el = T_.closest("[data-jump]"))) { const s = $("#cat-" + el.dataset.jump); if (s) s.scrollIntoView({ behavior: "smooth" }); $$("#catChips .chip").forEach((c) => c.classList.toggle("on", c === el)); return; }
    if ((el = T_.closest("[data-ck]"))) { changeKey(el.dataset.ck, Number(el.dataset.d)); rerenderKeepScroll(); return; }
    if ((el = T_.closest("[data-mode]"))) { checkout.mode = el.dataset.mode; store.set("checkout", checkout); rerenderKeepScroll(); return; }
    if ((el = T_.closest("[data-reorder]"))) { const o = store.get("orders", [])[Number(el.dataset.reorder)]; if (o) { o.lines.forEach((l) => { const base = l.n.replace(/ \((Half|Full|2 log|4 log)\)$/, ""); const m = MENU.find((x) => x.n === base); if (m) { const v = /\((Half|2 log)\)$/.test(l.n) ? "h" : "f"; addToCart(m.id, v, l.q); } }); location.hash = "#/cart"; toast("Cart mein daal diya ✓"); } return; }
    if ((el = T_.closest("[data-lang]"))) { prefs.lang = el.dataset.lang; savePrefs(); applyLang(); route(); return; }
    if ((el = T_.closest("[data-act]"))) {
      const a = el.dataset.act;
      if (a === "install") doInstall();
      else if (a === "share") doShare();
      else if (a === "qr") shareSheet();
      else if (a === "copy") copyText(appUrl());
      else if (a === "nativeshare") { closeSheet(); doShare(); }
      else if (a === "clear") { if (confirm("Sab data (cart, orders, settings) saaf ho jaayega. Pakka?")) { Object.keys(localStorage).filter((k) => k.startsWith(K)).forEach((k) => localStorage.removeItem(k)); sessionStorage.clear(); toast("Data saaf ✓"); setTimeout(() => location.reload(), 600); } }
      return;
    }
    // owner
    if ((el = T_.closest("[data-pin]"))) {
      const k = el.dataset.pin; if (k === "⌫") pin = pin.slice(0, -1); else if (pin.length < 4) pin += k;
      if (pin.length === 4) {
        if (pin === String(CFG.OWNER_PIN)) { sessionStorage.setItem(K + "owner", "1"); pin = ""; ownerTab = "dash"; Owner(); toast("Welcome boss 👋"); return; }
        Owner(); const pd = $("#pd"); pd.classList.add("err"); pin = ""; setTimeout(Owner, 450); toast("Galat PIN"); return;
      }
      Owner(); return;
    }
    if ((el = T_.closest("[data-otab]"))) { ownerTab = el.dataset.otab; Owner(); return; }
    if ((el = T_.closest("[data-ofil]"))) { ownerFilter = el.dataset.ofil; Owner(); return; }
    if ((el = T_.closest("[data-onext]"))) { const os = store.get("orders", []); const o = os[Number(el.dataset.onext)]; if (o) { o.status = STEPS[Math.min(3, STEPS.indexOf(o.status) + 1)]; store.set("orders", os); toast(`#${o.no} → ${t(o.status)}`); } Owner(); return; }
    if ((el = T_.closest("[data-offdel]"))) { OFFERS = OFFERS.filter((o) => o.id !== el.dataset.offdel); store.set("offers", OFFERS); Owner(); toast("Offer hata diya"); return; }
    if ((el = T_.closest("[data-oact]"))) {
      const a = el.dataset.oact;
      if (a === "logout") { sessionStorage.removeItem(K + "owner"); location.hash = "#/more"; }
      else if (a === "reset") { if (confirm("Demo data reset karein? (menu, offers, orders)")) { ["menu", "offers", "orders", "seeded", "cfg", "coupons"].forEach(store.del); MENU = JSON.parse(JSON.stringify(window.KANAK_MENU)); OFFERS = JSON.parse(JSON.stringify(window.KANAK_OFFERS)); Object.assign(CFG, CFG0); Owner(); toast("Reset ho gaya ✓"); } }
      else if (a === "additem") {
        const n = $("#n_name").value.trim(), p = Number($("#n_price").value);
        if (!n || !(p > 0)) { toast("Naam aur price daalo"); return; }
        MENU.unshift({ id: "x" + Date.now(), c: $("#n_cat").value, n, p, v: $("#n_veg").checked }); saveMenu(); Owner(); toast(`"${n}" menu mein add ✓`);
      } else if (a === "addoffer") {
        const ti = $("#of_t").value.trim(), s = $("#of_s").value.trim(); if (!ti) { toast("Offer ka title likho"); return; }
        OFFERS.unshift({ id: "o" + Date.now(), title: ti, sub: s, tag: "NEW", on: true }); store.set("offers", OFFERS); Owner(); toast("Offer live ✓ Home pe dekho");
      } else if (a === "savecfg") {
        const wa = $("#c_wa").value.replace(/\D/g, ""); if (wa.length < 12) { toast("Number 91 ke saath 12 digit ka hona chahiye"); return; }
        const c = { WHATSAPP_NUMBER: wa, CAFE_PHONE: $("#c_ph").value.trim(), OPEN_TIME: $("#c_open").value || CFG.OPEN_TIME, CLOSE_TIME: $("#c_close").value || CFG.CLOSE_TIME, DELIVERY_FEE: Number($("#c_fee").value) || 0, FREE_DELIVERY_ABOVE: Number($("#c_free").value) || 0 };
        Object.assign(CFG, c); store.set("cfg", Object.assign(store.get("cfg", {}), c)); toast("Settings save ✓"); renderStatusLine(false);
      }
      return;
    }
  });
  document.addEventListener("change", (e) => {
    const el = e.target;
    if (el.dataset.price) { const m = item(el.dataset.price); const v = Number(el.value); if (m && v > 0) { m[el.dataset.k] = v; saveMenu(); toast(`${m.n}: ₹${v} ✓`); } }
    else if (el.dataset.stock) { const m = item(el.dataset.stock); if (m) { m.out = !el.checked; saveMenu(); toast(m.out ? `${m.n}: khatam ❌` : `${m.n}: stock mein ✓`); } }
    else if (el.dataset.ost) { const os = store.get("orders", []); const o = os[Number(el.dataset.ost)]; if (o) { o.status = el.value; store.set("orders", os); toast(`#${o.no} → ${t(o.status)}`); Owner(); } }
    else if (el.dataset.offon) { const o = OFFERS.find((x) => x.id === el.dataset.offon); if (o) { o.on = el.checked; store.set("offers", OFFERS); } }
  });
  document.addEventListener("input", (e) => { if (e.target.id === "me_q") { menuEditQ = e.target.value; clearTimeout(oMenu._t); oMenu._t = setTimeout(() => { Owner(); const n = $("#me_q"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 250); } });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheet(); if (e.key === "Enter" && e.target.matches("[data-offer]")) e.target.click(); });
  $("#backBtn").onclick = () => { location.hash = "#/more"; };
  $("#themeQuick").onclick = () => { prefs.theme = prefs.theme === "dark" ? "light" : "dark"; savePrefs(); applyTheme(); if (current === "settings") Settings(); };
  window.addEventListener("hashchange", route);
  window.addEventListener("storage", () => { MENU = store.get("menu", null) || MENU; });

  // ---------- boot ----------
  applyTheme(); applyLang(); updateBadge(); route();
  setInterval(() => { if (["home", "menu", "cart", "orders", "more"].includes(current)) renderStatusLine(false); }, 60000);
  window.addEventListener("load", () => setTimeout(() => $("#splash").classList.add("gone"), 900));
  setTimeout(() => $("#splash").classList.add("gone"), 2500);
  if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  window.KanakApp = { route, totals, cart: () => cart };
})();
