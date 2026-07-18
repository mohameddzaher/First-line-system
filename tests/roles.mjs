/**
 * Role sweep. Signs in as every role and checks the three things that actually
 * break for non-admins: they land somewhere they can see, the sidebar offers
 * only pages they may open, and every link the sidebar offers really loads.
 *
 * Creates its own throwaway users and deletes them at the end.
 *
 *   node tests/roles.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const ADMIN_EMAIL = process.env.TEST_EMAIL ?? "admin@firstline.com";
const ADMIN_PASSWORD = process.env.TEST_PASSWORD ?? "Admin@12345";
const PASSWORD = "RoleSweep@2026";

const ROLES = [
  "employee",
  "hr_officer",
  "hr_manager",
  "fleet_manager",
  "ops_manager",
  "finance_manager",
  "procurement_manager",
  "crm_manager",
  "sales_manager",
  "admin",
];

const browser = await chromium.launch();

// ── Set up: create one throwaway user per role via the admin API ──────────
const admin = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const adminPage = await admin.newPage();
await adminPage.goto(`${BASE}/login`);
await adminPage.fill('input[type="email"]', ADMIN_EMAIL);
await adminPage.fill('input[type="password"]', ADMIN_PASSWORD);
await adminPage.click('button[type="submit"]');
await adminPage.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 25000 });

const created = [];
for (const role of ROLES) {
  const email = `sweep_${role}@test.local`;
  const res = await adminPage.evaluate(
    async ({ email, role, password }) => {
      const r = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: "Sweep",
          lastName: role,
          email,
          password,
          role,
          isActive: true,
          assignedCustomers: [],
          extraPermissions: [],
          deniedPermissions: [],
        }),
      });
      return { status: r.status, body: await r.json() };
    },
    { email, role, password: PASSWORD },
  );
  if (res.status === 201) created.push({ role, email, id: res.body._id });
  else console.log(`  ! could not create ${role}: ${res.status} ${JSON.stringify(res.body).slice(0, 80)}`);
}

// ── Sweep each role ──────────────────────────────────────────────────────
const report = [];
for (const user of created) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  const problems = [];
  const consoleErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !/DevTools|favicon|Fast Refresh|MONGOOSE/i.test(m.text())) {
      consoleErrors.push(m.text().slice(0, 100));
    }
  });

  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');

  let landing = "(never left login)";
  try {
    await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 20000 });
    await page.waitForLoadState("networkidle");
    landing = new URL(page.url()).pathname;
  } catch {
    problems.push("login did not navigate anywhere");
  }

  // The landing page must actually render, not an error boundary.
  const landingOk = await page.evaluate(
    () => !/Application error|Unhandled Runtime Error/i.test(document.body.innerText),
  );
  if (!landingOk) problems.push(`landing ${landing} rendered an error`);

  // Expand every sidebar group so all links are in the DOM.
  const groupButtons = page.locator("aside button, nav button");
  const groupCount = await groupButtons.count();
  for (let i = 0; i < groupCount; i++) {
    try {
      await groupButtons.nth(i).click({ timeout: 1500 });
      await page.waitForTimeout(120);
    } catch {
      /* not a disclosure button */
    }
  }

  const links = await page.evaluate(() =>
    [...document.querySelectorAll("aside a[href^='/'], nav a[href^='/']")]
      .map((a) => a.getAttribute("href"))
      .filter((h, i, arr) => h && !h.startsWith("/#") && arr.indexOf(h) === i),
  );

  // Every offered link must load — a sidebar entry the role can't open is a bug.
  const denied = [];
  for (const href of links) {
    const res = await page.goto(`${BASE}${href}`, { waitUntil: "domcontentloaded", timeout: 20000 });
    const status = res?.status() ?? 0;
    const finalPath = new URL(page.url()).pathname;
    const errored = await page.evaluate(
      () => /Application error|Unhandled Runtime Error/i.test(document.body.innerText),
    );
    if (status >= 400 || errored) denied.push(`${href} → ${status}${errored ? " (error boundary)" : ""}`);
    else if (finalPath !== href && !href.startsWith(finalPath)) denied.push(`${href} → redirected to ${finalPath}`);
  }
  if (denied.length) problems.push(`sidebar links that don't work: ${denied.join(", ")}`);
  if (consoleErrors.length) problems.push(`console: ${[...new Set(consoleErrors)][0]}`);

  report.push({ role: user.role, landing, navLinks: links.length, problems });
  await ctx.close();
}

// ── Tear down ────────────────────────────────────────────────────────────
for (const user of created) {
  await adminPage.evaluate(
    async (id) => fetch(`/api/admin/users/${id}`, { method: "DELETE" }),
    user.id,
  );
}
await browser.close();

console.log(`\n${report.length} roles swept\n`);
for (const r of report) {
  const mark = r.problems.length ? "✗" : "✓";
  console.log(`${mark} ${r.role.padEnd(22)} lands on ${r.landing.padEnd(16)} ${r.navLinks} nav links`);
  for (const p of r.problems) console.log(`      ${p}`);
}
const failed = report.filter((r) => r.problems.length).length;
console.log(failed ? `\n${failed} role(s) with problems` : "\nevery role lands correctly and every nav link works");
process.exit(failed ? 1 : 0);
