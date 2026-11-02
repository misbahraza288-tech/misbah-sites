/* Demo mode sample data (login ke bina dashboard dekhne ke liye). Asli data nahi. */
(function () {
  const now = Date.now(), iso = (m) => new Date(now - m * 60000).toISOString();
  const agents = [
    { name: "help", emoji: "👋", title: "Help / Agents list", description: "Saare agents aur commands ki list", commands: ["start", "help", "agents"], examples: ["hi"] },
    { name: "video", emoji: "🎬", title: "Video Trim + Smart Edit", description: "Trim, captions, silence cut, zoom — GitHub Actions", commands: ["video", "trim", "edit"], examples: ["Video bhejo + caption: edit: captions + music"] },
    { name: "site", emoji: "🏗️", title: "Site Builder (client apps)", description: "Client ka mobile app/website banata hai → link Telegram pe", commands: ["site", "sites", "site_edit"], examples: ["/site Royal Bakers | bakery | Govindpur | 9876543210"] },
    { name: "reel", emoji: "🎬", title: "Reel Maker (AI voice + captions)", description: "Topic/trending pe 30-40 sec Hinglish reel", commands: ["reel", "reels"], examples: ["/reel trending"] },
    { name: "reminder", emoji: "⏰", title: "Reminder + Notes", description: "Yaad dilata hai (IST) aur notes sambhalta hai", commands: ["yaad", "remind", "note", "notes"], examples: ["yaad dilana kal 7 baje padhai"] },
    { name: "research", emoji: "🔎", title: "Research Agent", description: "Web pe dhundh ke Hinglish summary + sources", commands: ["research", "search"], examples: ["research karo India ke best free AI tools 2026"] },
    { name: "coding", emoji: "💻", title: "Coding Helper", description: "Code likhta hai aur GitHub mein commit karta hai", commands: ["code"], examples: ["code likho PHP login page"] },
    { name: "insta", emoji: "📸", title: "Insta Caption + Reel Ideas", description: "Hook, caption, 5 hashtags, 3 reel ideas", commands: ["caption", "ideas"], examples: ["caption do mera naya AI tool reel"] },
    { name: "briefing", emoji: "☀️", title: "Daily Briefing", description: "Subah ka plan: mausam, reminders, AI news", commands: ["briefing"], examples: ["briefing do"] },
    { name: "chat", emoji: "🧠", title: "Brain Chat (general)", description: "Koi bhi sawaal", commands: ["chat", "ask"], examples: ["Photosynthesis 3 line mein samjhao"] },
  ];
  const log = [
    { at: iso(4), agent: "site", input: "/site Royal Bakers | bakery | Govindpur", status: "ok", via: "telegram" },
    { at: iso(25), agent: "reel", input: "/reel trending", status: "ok", via: "dashboard" },
    { at: iso(70), agent: "research", input: "research karo free AI tools 2026", status: "ok", via: "telegram" },
    { at: iso(130), agent: "reminder", input: "yaad dilana kal 7 baje padhai", status: "ok", via: "telegram" },
    { at: iso(300), agent: "chat", input: "Tum kiya kiay kar sakte ho", status: "ok", via: "telegram" },
    { at: iso(1500), agent: "insta", input: "caption do Pulsar rain edit", status: "ok", via: "telegram" },
    { at: iso(2900), agent: "coding", input: "code likho PHP login page", status: "ok", via: "telegram" },
  ];
  const leads = [
    { id: "L1", name: "Ravi Kumar", phone: "9876500011", business: "Ravi Mobile Shop", msg: "Shop ka app chahiye", status: "new", source: "lead-form", at: iso(40) },
    { id: "L2", name: "Sharma ji", phone: "9876500022", business: "Sharma Sweets", msg: "Menu online karna hai", status: "contacted", source: "manual", at: iso(600) },
    { id: "L3", name: "Pooja", phone: "9876500033", business: "Glow Beauty Parlour", msg: "Booking app", status: "interested", source: "instagram", at: iso(1400) },
    { id: "L4", name: "Kanak Cafe", phone: "7488236001", business: "Kanak Cafe & Restaurant", msg: "Demo bheja", status: "interested", source: "walk-in", at: iso(200) },
    { id: "L5", name: "Arif", phone: "9876500055", business: "Fit Zone Gym", msg: "Website", status: "client", source: "referral", at: iso(4000) },
  ];
  const runs = [
    { id: 1, name: "Site Builder", status: "completed", conclusion: "success", event: "workflow_dispatch", at: iso(4), title: "Site Builder", url: "#" },
    { id: 2, name: "Reel Maker", status: "completed", conclusion: "success", event: "workflow_dispatch", at: iso(25), title: "Reel Maker", url: "#" },
    { id: 3, name: "Deploy Worker", status: "completed", conclusion: "success", event: "push", at: iso(60), title: "v2 agents", url: "#" },
    { id: 4, name: "Daily Briefing", status: "completed", conclusion: "success", event: "schedule", at: iso(700), title: "Daily Briefing", url: "#" },
  ];
  const flows = [{ id: "fdemo1", name: "Daily Gemini briefing → Telegram", on: true, lastRun: iso(700), lastOk: true, nodes: [{ id: "t", type: "schedule", x: 40, y: 90, config: { every: "day", at: "08:00" } }, { id: "g", type: "gemini", x: 300, y: 90, config: { prompt: "Aaj ke liye 4 line ka plan + 1 AI tip do" } }, { id: "s", type: "telegram", x: 560, y: 90, config: { text: "☀️ Good morning!\n{{last}}" } }], edges: [{ from: "t", to: "g" }, { from: "g", to: "s" }] },
    { id: "fdemo2", name: "New lead form → Telegram alert + WhatsApp", on: true, lastRun: iso(40), lastOk: true, nodes: [{ id: "t", type: "lead", x: 40, y: 140, config: {} }, { id: "a", type: "telegram", x: 300, y: 50, config: { text: "🔥 Naya lead! {{lead.name}}" } }, { id: "w", type: "whatsapp", x: 300, y: 230, config: { phone: "{{lead.phone}}" } }, { id: "sh", type: "sheet", x: 560, y: 140, config: {} }], edges: [{ from: "t", to: "a" }, { from: "t", to: "w" }, { from: "a", to: "sh" }] }];
  const sites = [
    { slug: "kanak-cafe", name: "Kanak Cafe & Restaurant", type: "cafe", area: "GT Road, Govindpur", url: "https://misbahraza288-tech.github.io/misbah-sites/kanak-cafe/", sample: false, updated: iso(60), old_url: "x" },
    { slug: "royal-bakers", name: "Royal Bakers", type: "bakery", area: "Govindpur, Dhanbad", url: "https://misbahraza288-tech.github.io/misbah-sites/royal-bakers/", sample: true, updated: iso(5) },
  ];
  window.MDC_DEMO = async function (path, body) {
    await new Promise((r) => setTimeout(r, 150));
    const p = path.split("?")[0];
    if (p === "/api/state") return { name: "Misbah Digital Computer", version: "2.0.0", models: ["gemini-3.5-flash-lite"], agents, log, reminders: [], notes: 2, leads: leads.length, leadsByStatus: { new: 1, contacted: 1, interested: 2, client: 1 }, automations: 2, automationsOn: 2 };
    if (p === "/api/profile") return { name: "Misbah", title: "Founder · Misbah Digital", handle: "@misbah_creator", city: "Govindpur, Dhanbad", avatar: "M", plan: "Free" };
    if (p === "/api/agents") return agents;
    if (p === "/api/sites") return sites;
    if (p === "/api/runs") return runs;
    if (p === "/api/reels") return [{ tag: "reel-1", title: "🎬 Tech Stocks Mein Bhari Giraawat", at: iso(25), notes: "Topic: nasdaq index\nDuration: 33.6s · Voice: Madhur", url: "#", assets: [{ id: 1, name: "reel.mp4", size: 6550346 }] }];
    if (p === "/api/apps") return { secrets: { TELEGRAM_BOT_TOKEN: true, GEMINI_API_KEY: true, GH_TOKEN: true, DASHBOARD_KEY: true, TELEGRAM_WEBHOOK_SECRET: true, ALLOWED_CHAT_ID: true, TAVILY_API_KEY: false, SHEETS_WEBHOOK_URL: false }, repo: "misbahraza288-tech/misbah-digital-computer", models: ["gemini-3.5-flash-lite", "gemini-3.8-flash"] };
    if (p === "/api/leads") return leads;
    if (p === "/api/automations") return { flows, templates: [], hookBase: "https://worker/hook/" };
    if (p === "/api/automation-runs") return [{ id: "fdemo2", name: "New lead form → Telegram alert + WhatsApp", at: iso(40), ok: true, ms: 840, trigger: "lead", steps: [{ type: "telegram", ok: true }, { type: "whatsapp", ok: true }, { type: "sheet", ok: true }] }];
    if (p === "/api/reminders") return [{ id: 1, text: "padhai", due: new Date(now + 36e5 * 10).toISOString(), done: false }];
    if (p === "/api/notes") return [{ id: 1, text: "Kanak cafe owner se kal milna", at: iso(200) }, { id: 2, text: "Royal Bakers ka asli menu lena", at: iso(30) }];
    if (p === "/api/workflows") return [{ name: "Deploy Worker", file: "deploy-worker.yml", state: "active" }, { name: "Site Builder", file: "site-builder.yml", state: "active" }, { name: "Reel Maker", file: "reel.yml", state: "active" }, { name: "Video Trim + Caption", file: "video-trim.yml", state: "active" }, { name: "Daily Briefing", file: "daily-briefing.yml", state: "active" }];
    if (p === "/api/chat") return { agent: "chat", reply: "👀 Demo mode hai — asli jawab ke liye apni key se login karo." };
    throw new Error("Demo mode: ye kaam asli login pe chalega");
  };
})();
