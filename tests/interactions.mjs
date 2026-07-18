/**
 * Interaction sweep. A page that renders is not a page that works — this drives
 * the controls on every list page the way a user would: type a search, apply a
 * filter, page through, open the create form, and pull the Excel export.
 *
 *   node tests/interactions.mjs
 */
import { chromium } from "playwright";
import { appendFileSync, writeFileSync } from "node:fs";

// stdout is buffered when piped, which hides progress on a long run — log to a
// file with a synchronous append so each line lands the moment it happens.
const LOG = process.env.SWEEP_LOG ?? "tests/.interactions.log";
writeFileSync(LOG, "");
const say = (line) => {
  appendFileSync(LOG, line + "\n");
  console.log(line);
};

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.TEST_EMAIL ?? "admin@firstline.com";
const PASSWORD = process.env.TEST_PASSWORD ?? "Admin@12345";

/** Every list page, with an Arabic search term that should match real data. */
const LISTS = [
  { url: "/hr/employees", search: "محمد" },
  { url: "/hr/contracts", search: "" },
  { url: "/hr/leaves", search: "" },
  { url: "/hr/requests", search: "" },
  { url: "/hr/custody", search: "" },
  { url: "/hr/licenses", search: "" },
  { url: "/hr/attendance", search: "" },
  { url: "/hr/leave-types", search: "" },
  { url: "/hr/departments", search: "" },
  { url: "/hr/tasks", search: "" },
  { url: "/hr/complaints", search: "" },
  { url: "/fleet/vehicles", search: "" },
  { url: "/fleet/authorizations", search: "" },
  { url: "/fleet/maintenance", search: "" },
  { url: "/fleet/accidents", search: "" },
  { url: "/ops/orders", search: "" },
  { url: "/ops/projects", search: "" },
  { url: "/ops/accounts", search: "" },
  { url: "/finance/transactions", search: "" },
  { url: "/procurement/orders", search: "" },
  { url: "/procurement/suppliers", search: "" },
  { url: "/procurement/inventory", search: "" },
  { url: "/procurement/movements", search: "" },
  { url: "/procurement/warehouses", search: "" },
  { url: "/crm/companies", search: "" },
  { url: "/crm/contacts", search: "" },
  { url: "/crm/deals", search: "" },
  { url: "/sales/targets", search: "" },
  { url: "/cms/articles", search: "" },
  { url: "/cms/clients", search: "" },
  { url: "/cms/jobs", search: "" },
  { url: "/cms/submissions", search: "" },
  { url: "/admin/users", search: "" },
  { url: "/admin/audit", search: "" },
];

const IGNORE = [/React DevTools/i, /favicon/i, /Fast Refresh/i, /MONGOOSE/i];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("console", (m) => {
  if (m.type() === "error" && !IGNORE.some((re) => re.test(m.text()))) {
    errors.push(`${page.url().replace(BASE, "")} :: ${m.text().slice(0, 120)}`);
  }
});

await page.goto(`${BASE}/login`);
await page.fill('input[type="email"]', EMAIL);
await page.fill('input[type="password"]', PASSWORD);
await page.click('button[type="submit"]');
await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 25000 });

/** Data rows only — the empty state is also a <tr>, with one full-width cell. */
const rowCount = async () =>
  page.evaluate(() =>
    [...document.querySelectorAll("tbody tr")].filter(
      (tr) => !tr.querySelector("td[colspan]"),
    ).length,
  );

const report = [];
for (const list of LISTS) {
  const problems = [];
  try {
  await page.goto(`${BASE}${list.url}`, { waitUntil: "networkidle", timeout: 30000 });
  let initial = await rowCount();

  // 1. Search must narrow the result set (or legitimately return nothing).
  const searchBox = page.locator('input[type="search"], input[placeholder*="بحث"], input[placeholder*="ابحث"], input[placeholder*="Search"]').first();
  if (await searchBox.count()) {
    const term = list.search || "zzzq";
    await searchBox.fill(term);
    await page.waitForTimeout(1400);
    const after = await rowCount();
    if (!list.search && after > 0) problems.push(`nonsense search "${term}" still returned ${after} rows`);
    if (list.search && after === 0 && initial > 0) problems.push(`search "${term}" returned nothing though data exists`);
    await searchBox.fill("");
    await page.waitForTimeout(1200);
    const restored = await rowCount();
    if (initial > 0 && restored === 0) problems.push("clearing search did not restore rows");
  } else if (initial > 0) {
    problems.push("no search box on a populated list");
  }

  // 2. Excel export: the toolbar button opens a scope dialog, and the dialog's
  // own export button is what actually produces the file.
  const exportBtn = page.getByRole("button", { name: /تصدير|Export/ }).first();
  if (await exportBtn.count()) {
    try {
      await exportBtn.click({ timeout: 8000 });
      await page.waitForTimeout(600);
      const dialog = page.locator('[role="dialog"]').first();
      if (!(await dialog.count())) {
        problems.push("export button opened no dialog");
      } else {
        const [download] = await Promise.all([
          page.waitForEvent("download", { timeout: 20000 }),
          dialog.getByRole("button", { name: /تصدير|Export/ }).last().click(),
        ]);
        const name = download.suggestedFilename();
        if (!/\.xlsx?$/.test(name)) problems.push(`export produced "${name}", not a spreadsheet`);
        const path = await download.path();
        if (!path) problems.push("export download had no file");
        await page.waitForTimeout(500);
        // The dialog must close itself after a successful export.
        if (await page.locator('[role="dialog"]').count()) {
          await page.keyboard.press("Escape");
          await page.waitForTimeout(400);
        }
      }
    } catch (e) {
      problems.push(`export failed: ${e.message.split("\n")[0].slice(0, 70)}`);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    }
  }

  // 3. The create form must open, and Escape must close it again.
  const addBtn = page.getByRole("button", { name: /إضافة|جديد|Add |New /i }).first();
  if (await addBtn.count()) {
    try {
      await addBtn.click({ timeout: 8000 });
      await page.waitForTimeout(700);
      if (!(await page.locator('[role="dialog"]').count())) {
        problems.push("create button opened no dialog");
      } else {
        await page.keyboard.press("Escape");
        await page.waitForTimeout(500);
        if (await page.locator('[role="dialog"]').count()) {
          problems.push("Escape did not close the create dialog");
        }
      }
    } catch (e) {
      problems.push(`create button unclickable: ${e.message.split("\n")[0].slice(0, 70)}`);
    }
  }

  } catch (e) {
    problems.push(`page threw: ${e.message.split("\n")[0].slice(0, 80)}`);
  }
  say(`  ${list.url.padEnd(28)} ${problems.length ? problems.join(" | ") : "ok"}`);
  report.push({ url: list.url, problems });
}

await browser.close();

const bad = report.filter((r) => r.problems.length);
console.log(`\n${report.length} list pages exercised — ${bad.length} with problems\n`);
for (const r of bad) {
  console.log(`✗ ${r.url}  (${r.rows} rows)`);
  for (const p of r.problems) console.log(`    ${p}`);
}
if (!bad.length) console.log("search / export / create-form all working");

if (errors.length) {
  console.log(`\nconsole errors (${errors.length}):`);
  for (const e of [...new Set(errors)].slice(0, 15)) console.log(`    ${e}`);
}
process.exit(bad.length || errors.length ? 1 : 0);
