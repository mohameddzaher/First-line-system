/**
 * Imports the real fleet dataset (data/fleet-import.json) into the system,
 * building the full cross-module graph:
 *   vehicle  +  driver (employee)  +  authorization/custody  +  platform account
 *
 * Wipes the previous demo business data first (keeps super admin, leave types,
 * departments, site settings). Idempotent-ish: re-running wipes and re-imports.
 *
 *   npm run import:fleet
 */
import { readFileSync } from "node:fs";
import mongoose from "mongoose";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const i = line.indexOf("=");
  if (i > 0 && !line.trim().startsWith("#")) process.env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"|"$/g, "");
}

const oid = () => new mongoose.Types.ObjectId();
const now = new Date();

// ── helpers ────────────────────────────────────────────────
const PLACEHOLDER = new Set(["موقفه", "موقوفه", "—", "-", "", "لا يوجد", "null", "غير معروف"]);
function clean(v) {
  if (v === null || v === undefined) return null;
  let s = String(v).trim();
  if (typeof v === "number" && Number.isInteger(v)) s = String(v); // avoid 2598516116.0
  if (s.endsWith(".0")) s = s.slice(0, -2);
  return PLACEHOLDER.has(s) ? null : s;
}
function num(v) {
  const s = clean(v);
  if (!s) return null;
  const n = Number(String(s).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/**
 * Normalise a platform/app name to a base project. Strict whitelist — the source
 * "التطبيق" column sometimes holds a person's name or a status by mistake, and we
 * must not turn those into projects.
 */
function normProject(app) {
  const a = clean(app);
  if (!a) return null;
  if (a.includes("كيتا") || a.includes("كييتا") || a.toLowerCase().includes("keeta")) return { ar: "كيتا", en: "Keeta" };
  if (a.includes("نينجا") || a.toLowerCase().includes("ninja")) return { ar: "نينجا", en: "Ninja" };
  if (a.includes("هنقر")) return { ar: "هنقرستيشن", en: "HungerStation" };
  if (a.includes("تويو") || a.includes("تو يو") || a.toLowerCase().includes("toyou")) return { ar: "تو يو", en: "ToYou" };
  if (a.includes("طرود")) return { ar: "طرود", en: "Parcels" };
  return null; // unknown / junk app value — ignore
}

/** Contract text -> sponsorship + service tier. */
function parseContract(c) {
  const s = clean(c) || "";
  const sponsorship = s.includes("حر") ? "freelancer" : "company";
  return sponsorship;
}
function tierFrom(...texts) {
  return texts.some((t) => (clean(t) || "").includes("أسرع") || (clean(t) || "").includes("اسرع")) ? "express" : "standard";
}

/** Work-status text -> vehicle status enum. */
function mapStatus(ws, hasRider) {
  const s = clean(ws) || "";
  if (s.includes("صيان")) return "maintenance";
  if (s.includes("بدون لوح")) return "no_plate";
  if (s.includes("محتجز")) return "impounded";
  if (s.includes("مسحوب")) return "withdrawn";
  if (s.includes("مسروق")) return "stolen";
  if (s.includes("تلفيات") || s.includes("تلف")) return "out_of_service";
  if (s.includes("موقف")) return "parked";
  if (s.includes("جاهز")) return "available";
  if (s.includes("يعمل")) return hasRider ? "authorized" : "available";
  return hasRider ? "authorized" : "available";
}

/** Saudi national IDs start with 1, resident iqama with 2. */
function idMeta(id) {
  const s = clean(id);
  if (!s) return { idType: "iqama", isSaudi: false };
  return s.startsWith("1") ? { idType: "national_id", isSaudi: true } : { idType: "iqama", isSaudi: false };
}

// Normalise a raw row (columns differ per sheet) into a common shape.
function normalizeRow(r, vehicleType) {
  const plate = clean(r["رقم اللوحة"]) || clean(r["لوحة المركبة"]) || clean(r["رقم اللوحه"]);
  if (!plate) return null;
  const contract = clean(r["نوع العقد"]);
  const app = r["التطبيق"];
  const isBike = vehicleType === "motorcycle";
  return {
    plate,
    plateLatin: clean(r["Plate#"]),
    type: vehicleType,
    make: clean(r["الماركة"]) || clean(r["نوع المركبة"]) || clean(r["نوع المركبه"]),
    model: clean(r["الطراز"]) || clean(r["موديل المركبة"]) || (isBike ? null : clean(r["موديل المركبه"])),
    year: num(r["سنة الصنع"]) || (isBike ? num(r["موديل المركبه"]) : null),
    color: clean(r["اللون"]) || clean(r["لون المركبة"]),
    city: clean(r["المدينة"]) || clean(r["المدينه"]),
    status: clean(r["حالة العمل"]) || clean(r["الحالة"]),
    riderName: clean(r["اسم المندوب"]),
    riderId: clean(r["رقم الهوية"]) || clean(r["رقم الإقامة"]),
    app,
    userNum: clean(r["رقم اليوزر"]),
    contract,
    sponsorship: parseContract(contract),
    tier: tierFrom(contract, app),
    chassis: clean(r["رقم الهيكل"]),
    ownership: clean(r["حاله الملكيه"]) || clean(r["حالة الملكية"]),
    purchasePrice: num(r["مبلغ الشراء"]),
    conditionNote: clean(r["حاله المركبه"]) || clean(r["حالة المركبة"]),
  };
}

function sheetRows(sheet) {
  if (!sheet) return [];
  const tables = sheet.tables || [];
  return tables.flatMap((t) => t.rows || []);
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
  const db = mongoose.connection.db;
  console.log("Connected to", mongoose.connection.name);

  const data = JSON.parse(readFileSync(new URL("../data/fleet-import.json", import.meta.url), "utf8"));
  const S = data.sheets;

  // Priority order; dedupe vehicles by plate. Skip "السيارات العاملة" (subset of the main sheet).
  const sources = [
    ["بيانات السيارات", "car"],
    ["سيارات كيا", "car"],
    ["سيارات الخط الاسرع", "car"],
    ["سيارات الخط الاول", "car"],
    ["دبابات الشركة", "motorcycle"],
    ["الجاهزة والصيانة والادارة", "car"],
  ];

  // ── wipe demo business data (keep admin, leave types, departments, settings, website) ──
  for (const c of [
    "employees", "vehicles", "custodies", "thirdpartyaccounts", "accidents", "contracts", "leaves",
    "companies", "deals", "contacts", "salestargets", "inventoryitems", "warehouses", "purchaseorders", "submissions",
  ]) {
    await db.collection(c).deleteMany({});
  }
  await db.collection("users").deleteMany({ email: { $ne: "admin@firstline.com" } });
  // Reset projects too — the seed's demo projects (e.g. Amazon) and any junk from a
  // prior run get cleared; real projects are recreated from the whitelist below.
  await db.collection("projects").deleteMany({});
  console.log("Wiped demo business data.");

  // ── projects (create on demand from the whitelist) ──
  const projByAr = new Map();
  async function projectId(app) {
    const p = normProject(app);
    if (!p) return null;
    if (projByAr.has(p.ar)) return projByAr.get(p.ar);
    const _id = oid();
    await db.collection("projects").insertOne({ _id, nameAr: p.ar, nameEn: p.en, isActive: true, createdAt: now, updatedAt: now });
    projByAr.set(p.ar, _id);
    return _id;
  }

  const empByIdNum = new Map();   // idNumber -> employee _id
  const acctByKey = new Map();    // `${projectId}|${username}` -> account doc (in-memory)
  const seenPlates = new Set();

  const employees = [];
  const vehicles = [];
  const custodies = [];
  const accounts = [];

  let assigned = 0, unassigned = 0, skipped = 0;

  for (const [sheetName, vtype] of sources) {
    for (const raw of sheetRows(S[sheetName])) {
      const row = normalizeRow(raw, vtype);
      if (!row) { skipped++; continue; }
      const plateKey = row.plate.replace(/\s+/g, "");
      if (seenPlates.has(plateKey)) { skipped++; continue; }
      seenPlates.add(plateKey);

      const hasRider = Boolean(row.riderId && row.riderName);
      let empId = null;

      // Employee (driver)
      if (hasRider) {
        if (empByIdNum.has(row.riderId)) {
          empId = empByIdNum.get(row.riderId);
        } else {
          empId = oid();
          const { idType, isSaudi } = idMeta(row.riderId);
          employees.push({
            _id: empId, nameAr: row.riderName, idType, idNumber: row.riderId,
            nationality: isSaudi ? "السعودية" : "غير محدد", isSaudi,
            status: "active", isDriver: true, sponsorshipType: row.sponsorship,
            workLocation: row.city || undefined, documents: [],
            createdAt: now, updatedAt: now,
          });
          empByIdNum.set(row.riderId, empId);
        }
      }

      const projId = await projectId(row.app);
      const vehId = oid();
      const status = mapStatus(row.status, hasRider);

      // Custody + authorization when a rider owns the vehicle.
      let currentAuth = null, auths = [];
      if (hasRider) {
        const cid = oid();
        custodies.push({
          _id: cid,
          name: `${vtype === "motorcycle" ? "دراجة آلية" : "سيارة"} ${row.plate}`,
          type: vtype === "motorcycle" ? "motorcycle" : "vehicle",
          serial: row.plate, condition: "good", status: "assigned",
          employee: empId, assignedDate: now, vehicle: vehId,
          history: [{ action: "assigned", employee: empId, date: now }],
          createdAt: now, updatedAt: now,
        });
        currentAuth = { employee: empId, startDate: now, authorizationType: "تفويض قيادة" };
        auths = [{ _id: oid(), employee: empId, startDate: now, endDate: null, authorizationType: "تفويض قيادة", custody: cid }];
        assigned++;
      } else {
        unassigned++;
      }

      vehicles.push({
        _id: vehId, plateNumber: row.plate, plateLatin: row.plateLatin || undefined,
        type: vtype, make: row.make || undefined, makeModel: row.model || undefined,
        year: row.year || undefined, color: row.color || undefined, status,
        city: row.city || undefined, chassisNumber: row.chassis || undefined,
        ownership: row.ownership || undefined, purchasePrice: row.purchasePrice || undefined,
        serviceTier: row.tier, conditionNote: row.conditionNote || undefined,
        project: projId, department: null,
        currentAuthorization: currentAuth, authorizations: auths,
        createdAt: now, updatedAt: now,
      });

      // Platform account + assignment
      if (hasRider && projId && row.userNum) {
        const key = `${projId}|${row.userNum}`;
        if (acctByKey.has(key)) {
          acctByKey.get(key).assignments.push({ _id: oid(), employee: empId, shift: "full", startDate: now, endDate: null, active: true });
        } else {
          const acct = {
            _id: oid(), project: projId, username: row.userNum, status: "active",
            assignments: [{ _id: oid(), employee: empId, shift: "full", startDate: now, endDate: null, active: true }],
            history: [{ action: "assigned", employee: empId, shift: "full", date: now }],
            createdAt: now, updatedAt: now,
          };
          acctByKey.set(key, acct);
          accounts.push(acct);
        }
      }
    }
  }

  // ── bulk insert ──
  const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));
  for (const [name, docs] of [["employees", employees], ["vehicles", vehicles], ["custodies", custodies], ["thirdpartyaccounts", accounts]]) {
    for (const part of chunk(docs, 500)) if (part.length) await db.collection(name).insertMany(part, { ordered: false });
    console.log(`  inserted ${docs.length} ${name}`);
  }

  console.log("\n  ✓ Fleet import complete");
  console.log(`    vehicles: ${vehicles.length}  (authorized ${assigned}, unassigned ${unassigned})`);
  console.log(`    drivers:  ${employees.length}`);
  console.log(`    accounts: ${accounts.length}`);
  console.log(`    skipped rows (dupe/blank plate): ${skipped}`);
  console.log(`    projects: ${projByAr.size}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
