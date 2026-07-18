/**
 * Full browser sweep. Loads every page as a real signed-in user and reports
 * anything a status-code check would miss: runtime console errors, hydration
 * failures, React error boundaries, invalid nesting, and pages that render
 * nothing useful.
 *
 *   node tests/sweep.mjs [--json out.json]
 */
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.TEST_EMAIL ?? "admin@firstline.com";
const PASSWORD = process.env.TEST_PASSWORD ?? "Admin@12345";

const APP_ROUTES = [
  "/dashboard", "/reports",
  "/me/profile", "/me/leaves", "/me/requests", "/me/security", "/notifications",
  "/hr", "/hr/employees", "/hr/contracts", "/hr/leaves", "/hr/requests", "/hr/custody",
  "/hr/licenses", "/hr/payroll", "/hr/attendance", "/hr/leave-types", "/hr/departments",
  "/hr/tasks", "/hr/complaints",
  "/fleet", "/fleet/vehicles", "/fleet/authorizations", "/fleet/maintenance", "/fleet/accidents",
  "/ops", "/ops/orders", "/ops/projects", "/ops/accounts",
  "/finance", "/finance/transactions",
  "/procurement", "/procurement/orders", "/procurement/suppliers", "/procurement/inventory",
  "/procurement/movements", "/procurement/warehouses",
  "/crm", "/crm/companies", "/crm/contacts", "/crm/deals", "/crm/pipeline",
  "/sales", "/sales/targets",
  "/cms", "/cms/articles", "/cms/clients", "/cms/jobs", "/cms/submissions", "/cms/seo",
  "/admin/users", "/admin/roles", "/admin/audit",
];

const SITE_ROUTES = ["/", "/about", "/services", "/articles", "/careers", "/faq", "/contact", "/privacy", "/terms"];

/** Detail pages need a real id; discovered at runtime from the list APIs. */
const DETAIL_SOURCES = [
  { api: "/api/hr/employees", path: (id) => `/hr/employees/${id}` },
  { api: "/api/fleet/vehicles", path: (id) => `/fleet/vehicles/${id}` },
  { api: "/api/crm/companies", path: (id) => `/crm/companies/${id}` },
  { api: "/api/ops/accounts", path: (id) => `/ops/accounts/${id}` },
  { api: "/api/ops/orders", path: (id) => `/ops/orders/${id}` },
  { api: "/api/procurement/orders", path: (id) => `/procurement/orders/${id}` },
  { api: "/api/crm/deals", path: (id) => `/crm/deals/${id}` },
  { api: "/api/crm/contacts", path: (id) => `/crm/contacts/${id}` },
];

const IGNORE = [
  /Download the React DevTools/i,
  /favicon/i,
  /\[Fast Refresh\]/i,
];

async function login(page) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 25000 });
}

async function checkPage(page, url) {
  const errors = [];
  const failedRequests = [];
  const onConsole = (m) => {
    if (m.type() !== "error") return;
    const text = m.text();
    if (IGNORE.some((re) => re.test(text))) return;
    errors.push(text.slice(0, 160));
  };
  const onFailed = (req) => failedRequests.push(`${req.method()} ${req.url().replace(BASE, "")}`);
  const onResponse = (res) => {
    const u = res.url().replace(BASE, "");
    if (res.status() >= 500 && u.startsWith("/api")) failedRequests.push(`${res.status()} ${u}`);
  };
  page.on("console", onConsole);
  page.on("requestfailed", onFailed);
  page.on("response", onResponse);

  let status = 0;
  try {
    const res = await page.goto(`${BASE}${url}`, { waitUntil: "networkidle", timeout: 30000 });
    status = res?.status() ?? 0;
  } catch (e) {
    errors.push(`NAVIGATION: ${e.message.slice(0, 100)}`);
  }

  const dom = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      nestedAnchors: document.querySelectorAll("a a").length,
      nestedButtons: document.querySelectorAll("button button").length,
      // Next.js error boundary / crash markers
      crashed: /Application error|Unhandled Runtime Error|something went wrong/i.test(text),
      chars: text.trim().length,
      hasMain: Boolean(document.querySelector("main, [role='main']")),
    };
  });

  page.off("console", onConsole);
  page.off("requestfailed", onFailed);
  page.off("response", onResponse);

  const problems = [];
  if (status >= 400) problems.push(`http ${status}`);
  if (dom.crashed) problems.push("error boundary rendered");
  if (dom.nestedAnchors) problems.push(`${dom.nestedAnchors} nested <a>`);
  if (dom.nestedButtons) problems.push(`${dom.nestedButtons} nested <button>`);
  if (dom.chars < 120) problems.push(`near-empty page (${dom.chars} chars)`);
  for (const e of errors) problems.push(`console: ${e}`);
  for (const f of [...new Set(failedRequests)]) problems.push(`request: ${f}`);

  return { url, status, problems };
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await login(page);

// Resolve one real id per detail route.
const detailRoutes = [];
for (const src of DETAIL_SOURCES) {
  try {
    const data = await page.evaluate(
      async (api) => (await fetch(`${api}?pageSize=1`)).json(),
      src.api,
    );
    if (data?.rows?.[0]?._id) detailRoutes.push(src.path(data.rows[0]._id));
  } catch {
    /* list empty — nothing to check */
  }
}

const results = [];
for (const url of [...APP_ROUTES, ...detailRoutes]) results.push(await checkPage(page, url));

// Public site is checked signed-out, the way visitors see it.
const anon = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const anonPage = await anon.newPage();
for (const url of SITE_ROUTES) results.push(await checkPage(anonPage, url));

await browser.close();

const bad = results.filter((r) => r.problems.length);
console.log(`\nchecked ${results.length} pages — ${bad.length} with problems\n`);
for (const r of bad) {
  console.log(`✗ ${r.url}`);
  for (const p of r.problems) console.log(`    ${p}`);
}
if (!bad.length) console.log("all clean");

const jsonArg = process.argv.indexOf("--json");
if (jsonArg > -1 && process.argv[jsonArg + 1]) {
  const { writeFileSync } = await import("node:fs");
  writeFileSync(process.argv[jsonArg + 1], JSON.stringify(results, null, 2));
}
process.exit(bad.length ? 1 : 0);
