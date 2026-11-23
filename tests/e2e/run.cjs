/* eslint-disable @typescript-eslint/no-require-imports */
/* End-to-end checks against a local production build with a mocked Supabase.
 *
 *   npm run build   (with the two NEXT_PUBLIC_SUPABASE_* values below)
 *   npm run test:e2e
 *
 * Supabase is intercepted in the browser, so no real project or data is touched.
 */
const { spawn } = require("node:child_process");
const { existsSync, mkdirSync } = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const PORT = Number(process.env.E2E_PORT || 3100);
const BASE = `http://localhost:${PORT}`;
const SUPA = "https://e2e-test.supabase.co";
const SHOTS = process.env.E2E_SHOTS || path.join(__dirname, "screenshots");
const ROOT = path.join(__dirname, "..", "..");
const ENV = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: SUPA, NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key", PORT: String(PORT) };

// ── Fake backend state ────────────────────────────────────────────────────────
const USER = { id: "u-1", email: "trainer@example.com", aud: "authenticated", role: "authenticated", user_metadata: { full_name: "Mario Trainer", plan: "free" }, app_metadata: {} };
const TOKEN = "tok".repeat(20);
function inDays(n) { return new Date(Date.now() + n * 86_400_000).toISOString(); }
function freshState() {
  const clients = Array.from({ length: 30 }, (_, i) => ({
    id: `c${i + 1}`, user_id: USER.id, name: `Cliente ${String(i + 1).padStart(2, "0")}`, email: `c${i + 1}@example.com`,
    status: "attivo", goal: "ipertrofia", level: "intermedio", start_date: "2026-09-01", created_at: "2026-09-01T10:00:00Z", deleted_at: null,
  }));
  const ex = (id, name, day, order, sets, extra = {}) => ({ id, name, day, order, sets, targetReps: "8-10", ...extra });
  const plan = {
    id: "p1", client_id: "c1", user_id: USER.id, name: "Scheda Ipertrofia", description: null, phase_id: null,
    days_per_week: 3, total_weeks: 8, rest_seconds: 90, active: true, share_token: TOKEN, day_labels: null, supplements: null,
    created_at: "2026-10-01T10:00:00Z",
    // orders interleaved across days on purpose (regression: reorder must stay inside the day)
    exercises: [
      ex("e1", "Panca Piana con bilanciere", 1, 0, 2),
      ex("e4", "Squat con bilanciere", 2, 1, 3),
      ex("e2", "Croci ai Cavi", 1, 2, 3),
      ex("e5", "Leg Extension", 2, 3, 3),
      ex("e3", "Tricipiti al cavo con corda", 1, 4, 3),
    ],
  };
  const profile = { id: USER.id, full_name: "Mario Trainer", plan: "free", premium_status: "none", trial_ends_at: inDays(10) };
  return { clients, plan, profile, patches: [], logUpserts: [], suspended: false };
}
let state = freshState();

function jwt() {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: USER.id, role: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;
}
function sessionCookie() {
  const session = { access_token: jwt(), refresh_token: "r", token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: USER };
  return "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url");
}

async function mockSupabase(context) {
  await context.route(`${SUPA}/**`, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const json = (body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body), headers: { "access-control-allow-origin": "*" } });
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" } });
    const p = url.pathname;
    if (p === "/auth/v1/user") return json(USER);
    if (p.startsWith("/auth/v1/")) return json({});
    if (p === "/rest/v1/rpc/get_portal_data") {
      const { p_token } = req.postDataJSON();
      if (p_token !== TOKEN) return json({ error: "not_found" });
      if (state.suspended) return json({ error: "suspended" });
      return json({ plan: state.plan, logs: [], diets: [], trainer_name: "Mario Trainer" });
    }
    if (p === "/rest/v1/rpc/upsert_exercise_log") { state.logUpserts.push(req.postDataJSON()); return json({ id: `log-${state.logUpserts.length}` }); }
    if (p.startsWith("/rest/v1/rpc/")) return json(null);
    const table = p.replace("/rest/v1/", "");
    if (req.method() === "GET") {
      if (table === "profiles") {
        const single = (req.headers()["accept"] || "").includes("vnd.pgrst.object");
        return json(single ? state.profile : [state.profile]);
      }
      if (table === "clients") return json(state.clients);
      if (table === "workout_plans") return json([state.plan]);
      return json([]);
    }
    if (table === "workout_plans" && req.method() === "PATCH") {
      const patch = req.postDataJSON();
      state.patches.push(patch);
      Object.assign(state.plan, patch);
      return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*" } });
    }
    return json([], 201);
  });
}

// ── Tiny test harness ─────────────────────────────────────────────────────────
const results = [];
async function check(name, fn) {
  try { await fn(); results.push({ name, ok: true }); console.log(`  ok   ${name}`); }
  catch (err) { results.push({ name, ok: false, err }); console.log(`  FAIL ${name}\n       ${String(err.message || err).split("\n").slice(0, 6).join("\n       ")}`); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

async function waitForServer() {
  for (let i = 0; i < 80; i++) {
    try { const r = await fetch(`${BASE}/offline.html`); if (r.ok) return; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("server did not start");
}

async function newPage(browser, opts, errors, { auth = true } = {}) {
  const context = await browser.newContext({ locale: "it-IT", ...opts });
  await mockSupabase(context);
  const cookies = [{ name: "x-visual-qa", value: "1", url: BASE }];
  if (auth) cookies.push({ name: "sb-e2e-test-auth-token", value: sessionCookie(), url: BASE });
  await context.addCookies(cookies);
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(`${page.url()} :: ${e.message}`));
  return { context, page };
}

const MOBILE = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 };
const DESKTOP = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };
const shot = (page, name) => page.screenshot({ path: path.join(SHOTS, `${name}.png`) });
const dayOrder = (day) => state.plan.exercises.filter((e) => e.day === day).sort((a, b) => a.order - b.order).map((e) => e.id);

(async () => {
  mkdirSync(SHOTS, { recursive: true });
  if (!existsSync(path.join(ROOT, ".next", "BUILD_ID"))) throw new Error("Run `npm run build` first");
  // A leftover server from an older build would make every check meaningless
  const busy = await fetch(`${BASE}/offline.html`).then(() => true, () => false);
  if (busy) throw new Error(`Port ${PORT} is already in use: stop the running server first`);
  const server = spawn("npx", ["next", "start", "-p", String(PORT)], { cwd: ROOT, env: ENV, stdio: "ignore", detached: true });
  // Use a pre-installed Chromium when the bundled one is not downloaded
  const chromiumPath = process.env.PW_CHROMIUM_PATH || (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);
  const launch = chromiumPath ? { executablePath: chromiumPath } : {};
  let browser;
  const errors = [];
  try {
    await waitForServer();
    browser = await chromium.launch(launch);

    // ── Static / PWA endpoints ───────────────────────────────────────────────
    console.log("PWA e pagine pubbliche");
    await check("manifest valido con icone raggiungibili", async () => {
      const r = await fetch(`${BASE}/manifest.webmanifest`);
      assert(r.ok, `manifest status ${r.status}`);
      const m = await r.json();
      assert(m.display === "standalone" && m.start_url && m.name && m.short_name, "campi mancanti");
      assert(m.icons.some((i) => i.sizes === "512x512" && i.purpose === "maskable"), "manca icona maskable 512");
      for (const icon of m.icons) {
        const ir = await fetch(BASE + icon.src);
        assert(ir.ok && ir.headers.get("content-type") === "image/png", `icona ${icon.src}`);
      }
    });
    await check("service worker, pagina offline, assetlinks, privacy", async () => {
      const sw = await fetch(`${BASE}/sw.js`);
      assert(sw.ok && /no-cache/.test(sw.headers.get("cache-control") || ""), "sw.js non servito senza cache");
      assert((await fetch(`${BASE}/offline.html`)).ok, "offline.html");
      const al = await fetch(`${BASE}/.well-known/assetlinks.json`);
      assert(al.ok && Array.isArray(await al.json()), "assetlinks.json");
      for (const gone of ["/api/fitness-scan", "/api/photo/pin", "/api/photo/view-token"]) {
        assert((await fetch(BASE + gone, { method: "POST" })).status === 404, `${gone} deve essere rimosso`);
      }
      const pr = await fetch(`${BASE}/privacy`);
      assert(pr.ok && (await pr.text()).includes("Eliminazione dell"), "privacy");
    });
    await check("eliminazione account: rifiutata senza conferma e senza login", async () => {
      const a = await fetch(`${BASE}/api/account/delete`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
      assert(a.status === 400, `senza conferma: ${a.status}`);
      const b = await fetch(`${BASE}/api/account/delete`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ confirm: "ELIMINA" }) });
      assert(b.status === 401, `senza login: ${b.status}`);
      const c = await fetch(`${BASE}/api/account/delete`, { method: "POST", headers: { "content-type": "application/json", origin: "https://evil.example" }, body: JSON.stringify({ confirm: "ELIMINA" }) });
      assert(c.status === 403, `cross-origin: ${c.status}`);
    });

    // ── Trainer, mobile ──────────────────────────────────────────────────────
    console.log("Trainer da telefono (390x844)");
    let { context, page } = await newPage(browser, MOBILE, errors);

    await check("link diretto al cliente con cache vuota: nessun crash", async () => {
      await page.goto(`${BASE}/dashboard/clienti/c1`);
      await page.getByText("Cliente 01").first().waitFor({ timeout: 15000 });
      const tabs = (await page.getByRole("button").allInnerTexts()).join(" | ");
      assert(/Schede/.test(tabs) && /Misurazioni/.test(tabs), "schede cliente mancanti");
      assert(!/Fitness Scan|Foto/.test(tabs), "foto e scanner AI devono essere rimossi");
      assert(errors.length === 0, `errori JS: ${errors.join(" | ")}`);
    });

    await check("ultimi giorni di prova: avviso con conto alla rovescia, richiudibile", async () => {
      state.profile = { ...state.profile, trial_ends_at: inDays(2) };
      await page.goto(`${BASE}/dashboard/clienti`);
      const notice = page.getByTestId("payment-notice");
      await notice.waitFor({ timeout: 15000 });
      const text = await notice.innerText();
      assert(/sospesi/.test(text) && /non vengono cancellati/.test(text), "testo avviso");
      assert(/Mancano 2 giorni/.test(text), "conto alla rovescia");
      await shot(page, "01-avviso-pagamento-mobile");
      const box = await notice.boundingBox();
      assert(box.height < 844 * 0.5, "l'avviso deve restare piccolo");
      await notice.getByRole("button", { name: "Ho capito" }).click();
      await notice.waitFor({ state: "detached" });
      await page.reload();
      await page.locator('a[href="/dashboard/clienti/c30"]').waitFor();
      assert(await page.getByTestId("payment-notice").count() === 0, "non deve riapparire lo stesso giorno");
      state.profile = { ...state.profile, trial_ends_at: inDays(10) };
    });

    await check("elenco clienti: 30 clienti e la pagina scorre fino in fondo", async () => {
      assert(await page.locator('a[href^="/dashboard/clienti/c"]').count() === 30, "numero clienti");
      const css = await page.evaluate(() => ({ html: getComputedStyle(document.documentElement).overflowX, body: getComputedStyle(document.body).overflowX, blur: getComputedStyle(document.querySelector(".card-luxury")).backdropFilter }));
      assert(css.html === "visible" && css.body === "clip", `overflow html/body: ${css.html}/${css.body}`);
      assert(css.blur === "none", "le card non devono avere blur su mobile");
      // Real finger swipes (raw touch events), until the end of the list
      const cdp = await context.newCDPSession(page);
      const scrollInfo = () => page.evaluate(() => ({ y: Math.round(scrollY), max: document.documentElement.scrollHeight - innerHeight }));
      for (let n = 0; n < 40; n++) {
        const before = await scrollInfo();
        if (before.max - before.y < 5) break;
        await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 195, y: 700 }] });
        for (let k = 1; k <= 12; k++) {
          await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 195, y: 700 - k * 50 }] });
          await page.waitForTimeout(12);
        }
        await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
        await page.waitForTimeout(350);
        const after = await scrollInfo();
        assert(after.y > before.y, `lo scorrimento si blocca a ${after.y}/${after.max}`);
      }
      const end = await scrollInfo();
      assert(end.max - end.y < 5, `fine elenco non raggiunta: ${end.y}/${end.max}`);
      assert(await page.locator('a[href="/dashboard/clienti/c30"]').isVisible(), "ultimo cliente non visibile");
      await shot(page, "02-elenco-clienti-mobile");
    });

    await check("vista Scheda: rinomina giorno da telefono", async () => {
      await page.goto(`${BASE}/dashboard/clienti/c1/schede/p1`);
      await page.getByRole("button", { name: 'Rinomina "Giorno 1"' }).click();
      await page.getByLabel("Nome del giorno").fill("Push");
      await page.getByRole("button", { name: "Salva", exact: true }).click();
      await page.getByRole("button", { name: "Push", exact: true }).waitFor();
      await page.waitForFunction(() => true);
      await page.waitForTimeout(300);
      assert(state.plan.day_labels && state.plan.day_labels["1"] === "Push", `day_labels salvato: ${JSON.stringify(state.plan.day_labels)}`);
    });

    await check("vista Scheda: riordino esercizi da telefono (solo nel giorno)", async () => {
      assert(dayOrder(1).join() === "e1,e2,e3", "ordine iniziale");
      await page.getByRole("button", { name: "Sposta giu" }).first().click();
      await page.waitForTimeout(400);
      assert(dayOrder(1).join() === "e2,e1,e3", `dopo giu: ${dayOrder(1)}`);
      assert(dayOrder(2).join() === "e4,e5", `giorno 2 intatto: ${dayOrder(2)}`);
      const names = await page.locator("span.uppercase.font-bold").allInnerTexts();
      assert(/croci/i.test(names[0]), `prima card: ${names[0]}`);
      await shot(page, "03-scheda-riordino-mobile");
    });

    await check("vista Avanzato: rinomina, riordino e progressione da telefono", async () => {
      await page.getByRole("button", { name: "Avanzato" }).click();
      await page.getByRole("button", { name: 'Rinomina "Push"' }).click();
      await page.getByLabel("Nome del giorno").fill("Push A");
      await page.getByRole("button", { name: "Salva", exact: true }).click();
      await page.getByRole("button", { name: /Push A \(3\)/ }).waitFor();
      await page.getByRole("button", { name: "Sposta su" }).nth(1).click(); // e1 back to the top
      await page.waitForTimeout(400);
      assert(dayOrder(1).join() === "e1,e2,e3", `dopo su: ${dayOrder(1)}`);

      // Trainer's request: from week 3 the 2-set exercise becomes 3 sets
      await page.getByRole("button", { name: "Modifica esercizio" }).first().click();
      const editor = page.getByTestId("progression-editor");
      await editor.getByRole("button", { name: "Aggiungi" }).click();
      const step = editor.getByTestId("progression-step");
      assert(await step.getByLabel("Settimana di inizio").inputValue() === "3", "settimana proposta = 3");
      assert(await step.getByLabel("Serie").inputValue() === "3", "serie proposte = 3");
      await shot(page, "04-editor-progressione-mobile");
      await page.getByRole("button", { name: "Salva", exact: true }).click();
      await page.getByTestId("progression-chips").first().waitFor();
      assert(/Sett\. 3\+: 3 serie/.test(await page.getByTestId("progression-chips").first().innerText()), "chip progressione");
      await page.waitForTimeout(400);
      const saved = state.plan.exercises.find((e) => e.id === "e1");
      assert(saved.sets === 2 && saved.progressions?.length === 1 && saved.progressions[0].fromWeek === 3 && saved.progressions[0].sets === 3,
        `salvato: ${JSON.stringify(saved)}`);

      const card = page.locator(".card-luxury").first();
      assert(/2 × 8-10 rep/.test(await card.innerText()), "settimana 1: 2 serie");
      const next = page.locator("p", { hasText: /^Settimana \d+$/ }).locator("xpath=../../button[last()]");
      await next.click(); await next.click();
      await page.getByText("Settimana 3").waitFor();
      assert(/3 × 8-10 rep/.test(await card.innerText()), "settimana 3: 3 serie");
      await shot(page, "05-avanzato-settimana3-mobile");
    });
    await context.close();

    // ── Client portal, mobile ────────────────────────────────────────────────
    console.log("Cliente (link condiviso)");
    ({ context, page } = await newPage(browser, MOBILE, errors, { auth: false }));
    await check("il cliente vede 2 serie in settimana 1-2 e 3 serie dalla settimana 3", async () => {
      await page.goto(`${BASE}/scheda/${TOKEN}`);
      await page.getByRole("button", { name: "Push A" }).waitFor({ timeout: 15000 });
      const card = page.locator("div.rounded-2xl", { has: page.locator('span.uppercase:has-text("Panca Piana")') }).last();
      const setRows = () => card.getByText(/^Serie \d+$/).count();
      assert(await setRows() === 2, `settimana 1: ${await setRows()} serie`);
      assert(await page.getByTestId("progression-active").count() === 0, "nessun banner in settimana 1");
      const next = page.locator("span", { hasText: /^Settimana \d+$/ }).locator("xpath=../../button[last()]");
      await next.click();
      assert(await setRows() === 2, "settimana 2: 2 serie");
      await next.click();
      await page.getByText("Settimana 3", { exact: true }).waitFor();
      assert(await setRows() === 3, `settimana 3: ${await setRows()} serie`);
      assert(/Progressione dalla settimana 3: 3 serie/.test(await page.getByTestId("progression-active").first().innerText()), "banner progressione");
      await shot(page, "06-portale-cliente-settimana3");
    });
    await check("link non valido: messaggio chiaro, nessun crash", async () => {
      await page.goto(`${BASE}/scheda/token-sbagliato`);
      await page.getByText("Scheda non trovata").waitFor({ timeout: 15000 });
    });
    await context.close();

    // ── Plans: demo vs Premium ───────────────────────────────────────────────
    console.log("Piani: prova gratuita di 14 giorni e Premium");
    ({ context, page } = await newPage(browser, MOBILE, errors, { auth: false }));
    await check("homepage: prova di 14 giorni, nessun prezzo, contatto commerciale", async () => {
      await page.goto(`${BASE}/`);
      await page.locator("#prova").waitFor({ timeout: 15000 });
      const text = await page.locator("body").innerText();
      assert(!/€\s*\d|\d\s*€|\/\s*mese/.test(text), "nessun prezzo in homepage");
      assert(/14 giorni/.test(text), "prova di 14 giorni");
      assert(await page.locator('a[href="/contatti"]').count() >= 2, "CTA team commerciale");
      await shot(page, "09-homepage-mobile");
    });
    await check("registrazione: un solo percorso, prova gratuita", async () => {
      await page.goto(`${BASE}/register`);
      const box = page.getByTestId("trial-box");
      await box.waitFor();
      assert(/14 giorni/.test(await box.innerText()) && /1 cliente/.test(await box.innerText()), "descrizione prova");
      assert(!/€/.test(await page.locator("body").innerText()), "nessun prezzo nella registrazione");
      await page.getByRole("button", { name: "Inizia la prova gratuita" }).waitFor();
      await shot(page, "10-registrazione-prova-mobile");
      assert((await fetch(`${BASE}/termini`)).ok, "/termini");
    });
    await check("contatti: il form invia la richiesta al team commerciale", async () => {
      let lead = null;
      await page.route("**/api/contact", (route) => { lead = route.request().postDataJSON(); return route.fulfill({ status: 200, contentType: "application/json", body: "{\"ok\":true}" }); });
      await page.goto(`${BASE}/contatti`);
      await page.getByLabel("Nome e cognome").fill("Luca Bianchi");
      await page.getByLabel("Email").fill("luca@example.com");
      await page.getByRole("button", { name: "6-15" }).click();
      await page.getByRole("checkbox").check();
      await page.getByRole("button", { name: "Contatta il team commerciale" }).click();
      await page.getByTestId("contact-sent").waitFor();
      assert(lead && lead.email === "luca@example.com" && lead.clients === "6-15" && lead.consent === true, "dati inviati");
      await shot(page, "10b-contatti-mobile");
    });
    await context.close();

    await check("API piani: richieste senza login o da altri siti rifiutate", async () => {
      const post = (url, body, headers = {}) => fetch(BASE + url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
      assert((await post("/api/premium/request", {})).status === 401, "richiesta premium senza login");
      assert((await post("/api/premium/request", {}, { origin: "https://evil.example" })).status === 403, "richiesta premium cross-site");
      assert((await fetch(`${BASE}/api/admin/premium`)).status === 401, "elenco admin senza login");
      assert((await post("/api/contact", { name: "x", email: "x@example.com", consent: true }, { origin: "https://evil.example" })).status === 403, "contatto cross-site");
      assert((await post("/api/contact", { name: "", email: "no" })).status === 422, "contatto non valido");
      assert((await post("/api/admin/premium", { userId: USER.id, action: "approve" })).status === 401, "approvazione senza login");
    });

    const allClients = state.clients;
    state.clients = allClients.slice(0, 1);
    ({ context, page } = await newPage(browser, MOBILE, errors));
    await check("demo: con un cliente il secondo e' bloccato e propone Premium", async () => {
      await page.goto(`${BASE}/dashboard/clienti`);
      await page.locator('a[href="/dashboard/clienti/c1"]').waitFor({ timeout: 15000 });
      const banner = await page.getByTestId("plan-banner").innerText();
      assert(/Prova gratuita/.test(banner) && /10 giorni rimasti/.test(banner) && /1\/1 cliente/.test(banner), `banner prova: ${banner}`);
      assert(await page.getByTestId("payment-notice").count() === 0, "nessun avviso di scadenza a 10 giorni dalla fine");
      await page.getByRole("button", { name: "Nuovo cliente" }).click();
      const dialog = page.getByTestId("upgrade-dialog");
      await dialog.waitFor();
      assert(/un solo cliente/.test(await dialog.innerText()), "messaggio limite");
      await shot(page, "11-limite-demo-mobile");
      await dialog.getByRole("link", { name: "Passa a Premium" }).click();
      await page.waitForURL("**/dashboard/abbonamento");
    });
    await check("abbonamento: richiesta Premium inviata e mostrata in attesa", async () => {
      assert(await page.getByTestId("current-plan").innerText() === "Prova gratuita", "piano attuale");
      await page.getByTestId("trial-ends").waitFor();
      assert(!/€/.test(await page.locator("main").innerText()), "nessun prezzo nella pagina abbonamento");
      await page.getByTestId("payment-methods").waitFor();
      await page.route("**/api/premium/request", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "pending" }) }));
      await page.getByRole("button", { name: "Richiedi Premium" }).click();
      await page.getByTestId("premium-pending").waitFor();
      await shot(page, "12-abbonamento-in-attesa-mobile");
      await page.goto(`${BASE}/dashboard`);
    });
    await context.close();

    state.profile = { ...state.profile, plan: "premium", premium_status: "approved" };
    ({ context, page } = await newPage(browser, MOBILE, errors));
    await check("Premium: nessun limite, nessun banner, dati invariati", async () => {
      await page.goto(`${BASE}/dashboard/clienti`);
      await page.locator('a[href="/dashboard/clienti/c1"]').waitFor({ timeout: 15000 });
      assert(await page.getByTestId("plan-banner").count() === 0, "banner demo visibile a un Premium");
      await page.getByRole("button", { name: "Nuovo cliente" }).click();
      await page.getByPlaceholder(/Mario Rossi|Nome/).first().waitFor();
      assert(await page.getByTestId("upgrade-dialog").count() === 0, "Premium bloccato dal limite demo");
      await page.goto(`${BASE}/dashboard/abbonamento`);
      await page.getByTestId("premium-active").waitFor();
    });
    await context.close();
    state.clients = allClients;
    state.profile = { ...state.profile, plan: "free", premium_status: "none" };

    state.profile = { ...state.profile, trial_ends_at: inDays(-1) };
    state.suspended = true;
    ({ context, page } = await newPage(browser, MOBILE, errors));
    await check("prova scaduta: pannello sospeso, abbonamento raggiungibile", async () => {
      await page.goto(`${BASE}/dashboard/clienti`);
      await page.getByTestId("account-suspended").waitFor({ timeout: 15000 });
      assert(await page.locator('a[href="/dashboard/clienti/c1"]').count() === 0, "clienti nascosti");
      await shot(page, "13-account-sospeso-mobile");
      await page.getByRole("link", { name: "Attiva Premium" }).click();
      await page.waitForURL("**/dashboard/abbonamento");
      await page.getByTestId("checkout").waitFor();
    });
    await check("prova scaduta: il link del cliente mostra un messaggio chiaro", async () => {
      await page.goto(`${BASE}/scheda/${TOKEN}`);
      await page.getByText("non è al momento disponibile").waitFor({ timeout: 15000 });
    });
    await context.close();
    state.suspended = false;
    state.profile = { ...state.profile, trial_ends_at: inDays(10) };

    ({ context, page } = await newPage(browser, DESKTOP, errors));
    await check("super user: elenco richieste e approvazione Premium", async () => {
      const trainers = [
        { id: "11111111-1111-4111-8111-111111111111", name: "Davide", email: "davide@example.com", createdAt: "2026-10-01T10:00:00Z", plan: "free", premiumStatus: "pending", requestedAt: "2026-11-14T10:00:00Z", decidedAt: null, clients: 12 },
        { id: "22222222-2222-4222-8222-222222222222", name: "Anna", email: "anna@example.com", createdAt: "2026-11-01T10:00:00Z", plan: "free", premiumStatus: "none", requestedAt: null, decidedAt: null, clients: 1 },
      ];
      let approved = null;
      await page.route("**/api/admin/premium", (route) => {
        if (route.request().method() === "GET") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ trainers }) });
        approved = route.request().postDataJSON();
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, plan: "premium", premiumStatus: "approved" }) });
      });
      page.on("dialog", (d) => d.accept());
      await page.goto(`${BASE}/admin/premium`);
      const rows = page.getByTestId("trainer-row");
      await rows.first().waitFor({ timeout: 15000 });
      assert(await rows.count() === 1 && /davide@example.com/.test(await rows.first().innerText()), "solo le richieste in attesa");
      await shot(page, "13-super-user-desktop");
      await rows.first().getByRole("button", { name: "Approva Premium" }).click();
      await page.getByRole("status").waitFor();
      assert(approved && approved.action === "approve" && approved.userId === trainers[0].id, `richiesta inviata: ${JSON.stringify(approved)}`);
      await page.getByRole("button", { name: /^Premium \(1\)/ }).click();
      assert(/Revoca/.test(await rows.first().innerText()), "il trainer approvato risulta Premium");
      await page.unroute("**/api/admin/premium");
    });
    await check("super user: senza autorizzazione il pannello resta chiuso", async () => {
      await page.goto(`${BASE}/admin/premium`);
      await page.getByText(/Accedi con le credenziali del super user|non è autorizzato/).waitFor({ timeout: 15000 });
      assert(await page.getByTestId("trainer-row").count() === 0, "dati visibili senza autorizzazione");
    });
    await context.close();

    // ── Trainer, desktop ─────────────────────────────────────────────────────
    console.log("Trainer da PC (1440x900)");
    ({ context, page } = await newPage(browser, DESKTOP, errors));
    await check("tabella Avanzato: progressione visibile, pagine principali senza errori", async () => {
      await page.goto(`${BASE}/dashboard/clienti/c1/schede/p1`);
      await page.getByRole("button", { name: "Avanzato" }).click();
      await page.getByTestId("progression-chips").first().waitFor({ timeout: 15000 });
      await shot(page, "07-avanzato-desktop");
      for (const p of ["/dashboard", "/dashboard/clienti", "/dashboard/fasi", "/dashboard/diete", "/dashboard/misurazioni", "/dashboard/intake", "/dashboard/preventivi", "/dashboard/export", "/dashboard/account", "/dashboard/abbonamento", "/", "/login", "/register", "/privacy", "/termini"]) {
        const r = await page.goto(BASE + p);
        assert(r.status() < 400, `${p} -> ${r.status()}`);
        await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
      }
    });
    await check("indicazioni alimentari: avviso, porzioni a testo libero, niente grammi ne generatore", async () => {
      await page.goto(`${BASE}/dashboard/clienti/c1`);
      await page.getByRole("button", { name: /Alimentazione/ }).first().click();
      await page.getByRole("button", { name: /Crea le prime indicazioni/ }).click();
      const text = await page.getByTestId("diet-disclaimer").innerText();
      assert(/non sono una dieta né una prescrizione di grammature/.test(text), "avviso mancante");
      await page.getByRole("button", { name: "Aggiungi pasto" }).click();
      await page.getByRole("button", { name: "Aggiungi alimento" }).click();
      assert(await page.getByLabel("Porzione indicativa").count() === 1, "campo porzione mancante");
      const body = await page.locator("body").innerText();
      assert(!/Generatore automatico|Grammi \(range\)/.test(body), "grammature o generatore ancora presenti");
      assert(await page.getByPlaceholder("g min").count() === 0, "campo grammi ancora presente");
      await shot(page, "09-indicazioni-alimentari-desktop");
    });
    await check("pagina Account: eliminazione bloccata finche non si scrive ELIMINA", async () => {
      await page.goto(`${BASE}/dashboard/account`);
      const btn = page.getByRole("button", { name: /Elimina definitivamente/ });
      assert(await btn.isDisabled(), "bottone attivo senza conferma");
      await page.getByLabel(/Per confermare/).fill("elimina");
      assert(await btn.isEnabled(), "bottone non attivo dopo conferma");
      await shot(page, "08-account-desktop");
    });
    await check("service worker registrato", async () => {
      await page.goto(`${BASE}/privacy`);
      const ok = await page.evaluate(async () => { const r = await navigator.serviceWorker.ready; return !!r.active; });
      assert(ok, "service worker non attivo");
    });
    await context.close();

    // ── Optional: Play Store screenshots (STORE_SHOTS=1), 1080x1920 ───────────
    if (process.env.STORE_SHOTS) {
      const out = path.join(ROOT, "android", "store");
      state.profile = { ...state.profile, plan: "premium", premium_status: "approved" };
      ({ context, page } = await newPage(browser, { viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true }, errors));
      const snap = async (url, file, ready) => {
        await page.goto(BASE + url);
        await ready();
        await page.waitForTimeout(1200);
        await page.screenshot({ path: path.join(out, file) });
      };
      await snap("/dashboard/clienti", "screenshot-1-clienti.png", () => page.locator('a[href="/dashboard/clienti/c1"]').waitFor());
      await snap("/dashboard/clienti/c1/schede/p1", "screenshot-2-scheda.png", () => page.getByRole("button", { name: "Avanzato" }).waitFor());
      await snap(`/scheda/${TOKEN}`, "screenshot-3-portale-cliente.png", () => page.getByText("Settimana 1").first().waitFor());
      await snap("/dashboard/abbonamento", "screenshot-4-abbonamento.png", () => page.getByTestId("premium-active").waitFor());
      await context.close();
      state.profile = { ...state.profile, plan: "free", premium_status: "none" };
      console.log(`  screenshot per lo store salvati in ${out}`);
    }

    await check("nessun errore JavaScript non gestito in tutto il percorso", async () => {
      assert(errors.length === 0, errors.join(" | "));
    });
  } finally {
    if (browser) await browser.close();
    try { process.kill(-server.pid, "SIGKILL"); } catch { /* already stopped */ }
  }
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} controlli superati`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
