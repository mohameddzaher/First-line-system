/**
 * Edit round-trip. Opens a row's edit form, saves it untouched, and asserts the
 * record is byte-identical afterwards. This is the regression guard for the
 * class of bug where a PATCH silently rewrites fields the form didn't send.
 *
 *   node tests/edit-roundtrip.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.TEST_EMAIL ?? "admin@firstline.com";
const PASSWORD = process.env.TEST_PASSWORD ?? "Admin@12345";

/** Fields that legitimately change on every save. */
const VOLATILE = new Set(["updatedAt", "__v"]);

const TARGETS = [
  { name: "inventory", url: "/procurement/inventory", api: "/api/procurement/inventory" },
  { name: "employees", url: "/hr/employees", api: "/api/hr/employees" },
  { name: "vehicles", url: "/fleet/vehicles", api: "/api/fleet/vehicles" },
  { name: "articles", url: "/cms/articles", api: "/api/cms/articles" },
  { name: "leave-types", url: "/hr/leave-types", api: "/api/hr/leave-types" },
  { name: "departments", url: "/hr/departments", api: "/api/hr/departments" },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto(`${BASE}/login`);
await page.fill('input[type="email"]', EMAIL);
await page.fill('input[type="password"]', PASSWORD);
await page.click('button[type="submit"]');
await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 25000 });

const snapshot = (api, id) =>
  page.evaluate(async ([a, i]) => (await fetch(`${a}/${i}`)).json(), [api, id]);

const results = [];
for (const target of TARGETS) {
  const problems = [];
  const list = await page.evaluate(
    async (api) => (await fetch(`${api}?pageSize=1`)).json(),
    target.api,
  );
  const id = list?.rows?.[0]?._id;
  if (!id) {
    results.push({ name: target.name, skipped: "no rows" });
    continue;
  }

  const before = await snapshot(target.api, id);
  await page.goto(`${BASE}${target.url}`, { waitUntil: "networkidle" });

  // Open the row's edit action, then save without changing anything.
  const editBtn = page.getByRole("button", { name: /تعديل|Edit/ }).first();
  if (!(await editBtn.count())) {
    results.push({ name: target.name, skipped: "no edit control" });
    continue;
  }
  try {
    await editBtn.click({ timeout: 8000 });
    await page.waitForTimeout(900);
    const dialog = page.locator('[role="dialog"]').first();
    await dialog.getByRole("button", { name: /^حفظ$|^Save$|تحديث|Update/ }).last().click({ timeout: 8000 });
    await page.waitForTimeout(2000);
  } catch (e) {
    problems.push(`could not save: ${e.message.split("\n")[0].slice(0, 70)}`);
  }

  const after = await snapshot(target.api, id);
  for (const key of Object.keys(before)) {
    if (VOLATILE.has(key)) continue;
    const b = JSON.stringify(before[key]);
    const a = JSON.stringify(after[key]);
    if (b !== a) problems.push(`${key}: ${b} → ${a}`);
  }

  results.push({ name: target.name, problems });
}

await browser.close();

console.log("\nedit round-trip (open edit form, save untouched, diff the record)\n");
let failed = 0;
for (const r of results) {
  if (r.skipped) {
    console.log(`- ${r.name.padEnd(14)} skipped (${r.skipped})`);
  } else if (r.problems.length) {
    failed++;
    console.log(`✗ ${r.name.padEnd(14)} ${r.problems.length} field(s) changed by a no-op save`);
    for (const p of r.problems) console.log(`      ${p}`);
  } else {
    console.log(`✓ ${r.name.padEnd(14)} unchanged`);
  }
}
console.log(failed ? `\n${failed} target(s) lose data on a no-op save` : "\nno data lost on a no-op save");
process.exit(failed ? 1 : 0);
