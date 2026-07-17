/**
 * Demo data seed — populates every module with realistic, internally-consistent
 * sample records so the system looks alive on first run. Idempotent-ish: it wipes
 * the demo collections first, then re-inserts. Does NOT touch the super admin,
 * leave types, departments, or projects (those come from `npm run seed`).
 *
 *   npm run seed          # run this first (admin + reference data)
 *   npm run seed:demo     # then this (sample data)
 *
 * To start clean for real data, run `npm run seed:demo -- --wipe-only`.
 */
import { readFileSync } from "node:fs";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const i = line.indexOf("=");
  if (i > 0 && !line.trim().startsWith("#")) {
    process.env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"|"$/g, "");
  }
}

const oid = () => new mongoose.Types.ObjectId();
const daysFromNow = (d) => new Date(Date.now() + d * 86400000);
const wordmark = (name, color = "#16233d") =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='40'><rect width='160' height='40' rx='6' fill='${color}'/><text x='80' y='26' font-family='Arial' font-size='16' font-weight='bold' fill='white' text-anchor='middle'>${name}</text></svg>`,
  );

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
  const db = mongoose.connection.db;
  console.log("Connected to", mongoose.connection.name);

  const DEMO = [
    "employees", "contracts", "leaves", "custodies", "licenses", "vehicles", "accidents",
    "thirdpartyaccounts", "warehouses", "inventoryitems", "purchaseorders",
    "companies", "contacts", "deals", "salestargets",
    "articles", "jobs", "clientlogos", "submissions",
  ];
  for (const c of DEMO) await db.collection(c).deleteMany({});
  // Remove demo logins but keep the super admin.
  await db.collection("users").deleteMany({ email: { $ne: "admin@firstline.com" } });
  console.log("Cleared demo collections.");

  if (process.argv.includes("--wipe-only")) {
    console.log("Wiped only. Done.");
    await mongoose.disconnect();
    return;
  }

  const dept = Object.fromEntries((await db.collection("departments").find().toArray()).map((d) => [d.nameAr, d._id]));
  const proj = Object.fromEntries((await db.collection("projects").find().toArray()).map((p) => [p.nameAr, p._id]));
  const leaveTypes = Object.fromEntries((await db.collection("leavetypes").find().toArray()).map((l) => [l.code, l._id]));

  // ── Employees ──────────────────────────────────────────────
  const emp = {};
  const employees = [
    ["محمد أحمد عبد الفتاح", "Mohamed Ahmed", "20250101", "2611730538", "مصر", false, "إدارة", "3PL", "active", true, [{ type: "iqama", number: "2611730538", expiryDate: daysFromNow(40) }, { type: "passport", number: "A34710307", expiryDate: daysFromNow(-10) }]],
    ["عامر سهيل شوكت", "Amer Suhail", "20250021", "2569021492", "باكستان", false, "سائق", "كيتا", "active", true, [{ type: "iqama", number: "2569021492", expiryDate: daysFromNow(120) }]],
    ["راشد حسن علي", "Rashid Hassan", "20250082", "2608472185", "الهند", false, "سائق", "هنقرستيشن", "active", true, [{ type: "iqama", expiryDate: daysFromNow(20) }, { type: "driving_license", expiryDate: daysFromNow(200) }]],
    ["نوره علي حسن", "Noura Ali", "34677930", "1074048974", "السعودية", true, "سعودة", "سعودة", "active", false, []],
    ["كاشم الدين", "Kashim Uddin", "2020073", "2560883809", "بنجلاديش", false, "سائق", "أمازون", "on_leave", true, [{ type: "iqama", expiryDate: daysFromNow(-5) }]],
    ["أحمد رمضان محمد", "Ahmed Ramadan", "20250138", "2582221335", "مصر", false, "إدارة", "إدارة", "active", false, [{ type: "iqama", expiryDate: daysFromNow(300) }]],
  ];
  for (const [nameAr, nameEn, num, id, nat, saudi, job, project, status, driver, docs] of employees) {
    const _id = oid();
    emp[num] = _id;
    await db.collection("employees").insertOne({
      _id, nameAr, nameEn, employeeNumber: num, idType: saudi ? "national_id" : "iqama", idNumber: id,
      nationality: nat, isSaudi: saudi, jobTitle: job, department: dept[job === "سائق" ? "النقل الثقيل" : job === "سعودة" ? "3PL" : "إدارة"] ?? null,
      project: proj[project] ?? null, status, isDriver: driver, sponsorshipType: "company",
      hireDate: daysFromNow(-400 - Math.floor(Math.random() * 300)),
      email: `${nameEn.toLowerCase().replace(/ /g, ".")}@example.com`,
      basicSalary: 3000 + Math.floor(Math.random() * 3000), housingAllowance: 800, transportAllowance: 400,
      iban: "SA" + Math.floor(1e13 + Math.random() * 9e13), bank: "INMA",
      documents: docs.map((d) => ({ _id: oid(), ...d })),
      createdAt: new Date(), updatedAt: new Date(),
    });
  }
  console.log("Employees:", Object.keys(emp).length);

  // ── Contracts (drive the leave balance) ────────────────────
  for (const num of ["20250101", "20250021", "34677930", "20250138"]) {
    await db.collection("contracts").insertOne({
      _id: oid(), employee: emp[num], type: "fixed", startDate: daysFromNow(-200),
      endDate: daysFromNow(165), annualLeaveDays: 30, status: "active", basicSalary: 4000,
      createdAt: new Date(), updatedAt: new Date(),
    });
  }

  // ── Leaves ─────────────────────────────────────────────────
  await db.collection("leaves").insertMany([
    { _id: oid(), employee: emp["20250021"], leaveType: leaveTypes.annual, startDate: daysFromNow(10), endDate: daysFromNow(17), days: 8, status: "pending", balanceAtRequest: 12, createdAt: new Date(), updatedAt: new Date() },
    { _id: oid(), employee: emp["2020073"], leaveType: leaveTypes.annual, startDate: daysFromNow(-3), endDate: daysFromNow(10), days: 14, status: "approved", balanceAtRequest: 15, reviewedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
    { _id: oid(), employee: emp["20250082"], leaveType: leaveTypes.sick, startDate: daysFromNow(-30), endDate: daysFromNow(-28), days: 3, status: "rejected", createdAt: new Date(), updatedAt: new Date() },
  ]);

  // ── Warehouses + Inventory ─────────────────────────────────
  const whJeddah = oid(), whRiyadh = oid();
  await db.collection("warehouses").insertMany([
    { _id: whJeddah, name: "مستودع جدة الرئيسي", location: "جدة", isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { _id: whRiyadh, name: "مستودع الرياض", location: "الرياض", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ]);
  await db.collection("inventoryitems").insertMany([
    { _id: oid(), name: "خوذة أمان", sku: "HLM-001", category: "معدات سلامة", warehouse: whJeddah, quantity: 45, reorderLevel: 20, unitCost: 55, createdAt: new Date(), updatedAt: new Date() },
    { _id: oid(), name: "حقيبة توصيل حرارية", sku: "BAG-002", category: "معدات توصيل", warehouse: whJeddah, quantity: 12, reorderLevel: 15, unitCost: 120, createdAt: new Date(), updatedAt: new Date() },
    { _id: oid(), name: "زي رسمي", sku: "UNI-003", category: "أزياء", warehouse: whRiyadh, quantity: 0, reorderLevel: 10, unitCost: 90, createdAt: new Date(), updatedAt: new Date() },
    { _id: oid(), name: "لابتوب Dell", sku: "LPT-004", category: "أجهزة", warehouse: whJeddah, quantity: 8, reorderLevel: 3, unitCost: 3200, createdAt: new Date(), updatedAt: new Date() },
    { _id: oid(), name: "شريحة اتصال", sku: "SIM-005", category: "اتصالات", warehouse: whRiyadh, quantity: 200, reorderLevel: 50, unitCost: 25, createdAt: new Date(), updatedAt: new Date() },
  ]);

  // ── Custody (some assigned, some in stock) ─────────────────
  await db.collection("custodies").insertMany([
    { _id: oid(), name: "لابتوب Dell", type: "laptop", brand: "Dell", serial: "DL55123", condition: "good", status: "assigned", employee: emp["20250101"], assignedDate: daysFromNow(-100), history: [{ action: "assigned", employee: emp["20250101"], date: daysFromNow(-100) }], createdAt: new Date(), updatedAt: new Date() },
    { _id: oid(), name: "هاتف iPhone", type: "phone", brand: "Apple", serial: "IP99321", condition: "new", status: "assigned", employee: emp["20250138"], assignedDate: daysFromNow(-50), history: [{ action: "assigned", employee: emp["20250138"], date: daysFromNow(-50) }], createdAt: new Date(), updatedAt: new Date() },
    { _id: oid(), name: "حقيبة توصيل", type: "tools", serial: "BG001", condition: "good", status: "in_stock", employee: null, warehouse: whJeddah, history: [], createdAt: new Date(), updatedAt: new Date() },
  ]);

  // ── Vehicles + authorizations (+ linked custody) ───────────
  const vehicles = [
    ["1586 ب ق ب", "car", "Toyota Camry", "20250101", "3PL"],
    ["4563 ل ا", "motorcycle", "Honda", "20250021", "B2C"],
    ["2706 أ ص س", "heavy_truck", "Mercedes Actros", "20250082", "النقل الثقيل"],
    ["5487 ل ا", "car", "Hyundai", null, null],
    ["3447 ا ط ح", "heavy_truck", "Volvo", null, null],
  ];
  for (const [plate, type, model, num, deptName] of vehicles) {
    const vid = oid();
    let currentAuth = null, auths = [];
    if (num) {
      const cid = oid();
      const now = daysFromNow(-120);
      await db.collection("custodies").insertOne({
        _id: cid, name: `${type === "motorcycle" ? "دراجة آلية" : type === "heavy_truck" ? "شاحنة" : "سيارة"} ${plate}`,
        type: type === "motorcycle" ? "motorcycle" : "vehicle", serial: plate, condition: "good", status: "assigned",
        employee: emp[num], assignedDate: now, vehicle: vid, history: [{ action: "assigned", employee: emp[num], date: now }],
        createdAt: new Date(), updatedAt: new Date(),
      });
      currentAuth = { employee: emp[num], startDate: now, authorizationType: "تفويض قيادة" };
      auths = [{ _id: oid(), employee: emp[num], startDate: now, endDate: null, authorizationType: "تفويض قيادة", custody: cid }];
    }
    await db.collection("vehicles").insertOne({
      _id: vid, plateNumber: plate, type, makeModel: model, status: num ? "authorized" : "available",
      department: deptName ? dept[deptName] ?? null : null, currentAuthorization: currentAuth, authorizations: auths,
      registrationExpiry: daysFromNow(200), insuranceExpiry: daysFromNow(90),
      createdAt: new Date(), updatedAt: new Date(),
    });
  }
  console.log("Vehicles:", vehicles.length);

  // ── Licenses ───────────────────────────────────────────────
  await db.collection("licenses").insertMany([
    { _id: oid(), name: "سجل النشاط - النقل الثقيل", category: "بلدي", durationLabel: "سنوي", expiryDate: daysFromNow(-15), location: "جدة", isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { _id: oid(), name: "التأمين للمركبات", category: "تأمين", durationLabel: "سنوي", expiryDate: daysFromNow(11), location: "جدة", isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { _id: oid(), name: "نقل البضائع عبر الدراجة الآلية", category: "النقل", durationLabel: "6 أشهر", expiryDate: daysFromNow(45), location: "جدة", isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { _id: oid(), name: "التأمين الطبي", category: "تأمين", durationLabel: "سنوي", expiryDate: daysFromNow(180), location: "الرياض", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ]);

  // ── Third-party accounts + rider assignments ───────────────
  const accounts = [["كيتا", "keeta_001", "20250021", "morning"], ["كيتا", "keeta_002", "20250082", "full"], ["هنقرستيشن", "hs_101", "2020073", "evening"]];
  for (const [projName, username, num, shift] of accounts) {
    await db.collection("thirdpartyaccounts").insertOne({
      _id: oid(), project: proj[projName], username, status: "active",
      assignments: [{ _id: oid(), employee: emp[num], shift, startDate: daysFromNow(-60), endDate: null, active: true }],
      history: [{ action: "assigned", employee: emp[num], shift, date: daysFromNow(-60) }],
      createdAt: new Date(), updatedAt: new Date(),
    });
  }
  // A few idle accounts to make the numbers realistic.
  for (let i = 3; i < 8; i++) {
    await db.collection("thirdpartyaccounts").insertOne({ _id: oid(), project: proj["كيتا"], username: `keeta_0${i}0`, status: "idle", assignments: [], history: [], createdAt: new Date(), updatedAt: new Date() });
  }

  // ── CRM: companies, contacts, deals ────────────────────────
  const co = {};
  const companies = [
    ["Keeta", "كيتا", "customer", "active", "التوصيل"], ["HungerStation", "هنقرستيشن", "customer", "active", "التوصيل"],
    ["Amazon", "أمازون", "customer", "active", "التجارة الإلكترونية"], ["Ninja", "نينجا", "customer", "prospect", "التوصيل"],
    ["United Supplies Co.", "شركة التوريدات المتحدة", "vendor", "active", "توريدات"], ["Gulf Motors", "موتورز الخليج", "vendor", "active", "مركبات"],
  ];
  for (const [name, nameAr, kind, status, industry] of companies) {
    const _id = oid(); co[name] = _id;
    await db.collection("companies").insertOne({ _id, name, nameAr, kind, status, industry, city: "جدة", phone: "+96612" + Math.floor(1e6 + Math.random() * 9e6), email: `info@${name.toLowerCase().replace(/[^a-z]/g, "")}.com`, createdAt: new Date(), updatedAt: new Date() });
  }
  await db.collection("contacts").insertMany([
    { _id: oid(), name: "خالد العتيبي", company: co["Keeta"], title: "مدير الشراكات", email: "khalid@keeta.com", phone: "+966500000001", createdAt: new Date(), updatedAt: new Date() },
    { _id: oid(), name: "Sara Ahmed", company: co["Amazon"], title: "Operations Lead", email: "sara@amazon.com", phone: "+966500000002", createdAt: new Date(), updatedAt: new Date() },
    { _id: oid(), name: "محمد الغامدي", company: co["HungerStation"], title: "مدير العمليات", email: "m@hungerstation.com", phone: "+966500000003", createdAt: new Date(), updatedAt: new Date() },
  ]);
  await db.collection("deals").insertMany([
    { _id: oid(), title: "عقد توصيل كيتا 2026", company: co["Keeta"], stage: "won", value: 850000, probability: 100, closedDate: new Date(), expectedCloseDate: daysFromNow(-10), createdAt: new Date(), updatedAt: new Date() },
    { _id: oid(), title: "توسّع أمازون - الرياض", company: co["Amazon"], stage: "negotiation", value: 1200000, probability: 60, expectedCloseDate: daysFromNow(30), createdAt: new Date(), updatedAt: new Date() },
    { _id: oid(), title: "شراكة نينجا", company: co["Ninja"], stage: "proposal", value: 400000, probability: 40, expectedCloseDate: daysFromNow(45), createdAt: new Date(), updatedAt: new Date() },
    { _id: oid(), title: "تجديد هنقرستيشن", company: co["HungerStation"], stage: "qualified", value: 600000, probability: 30, expectedCloseDate: daysFromNow(60), createdAt: new Date(), updatedAt: new Date() },
  ]);

  // ── Purchase order (received → stock already counted above) ─
  await db.collection("purchaseorders").insertOne({
    _id: oid(), orderNumber: "PO-2026-001", supplier: co["United Supplies Co."], warehouse: whJeddah, status: "approved",
    orderDate: daysFromNow(-5), lines: [{ description: "حقائب توصيل حرارية", quantity: 50, unitPrice: 120 }],
    subtotal: 6000, vat: 900, total: 6900, createdAt: new Date(), updatedAt: new Date(),
  });

  // ── Sales targets ──────────────────────────────────────────
  const admin = await db.collection("users").findOne({ email: "admin@firstline.com" });
  await db.collection("salestargets").insertMany([
    { _id: oid(), owner: admin._id, period: "2026-Q3", targetAmount: 2000000, createdAt: new Date(), updatedAt: new Date() },
    { _id: oid(), owner: admin._id, period: "2026-Q4", targetAmount: 2500000, createdAt: new Date(), updatedAt: new Date() },
  ]);

  // ── Website: articles, jobs, client logos ──────────────────
  await db.collection("articles").insertMany([
    { _id: oid(), slug: "last-mile-delivery-ksa", title_ar: "مستقبل توصيل الميل الأخير في السعودية", title_en: "The Future of Last-Mile Delivery in KSA", excerpt_ar: "كيف تعيد التقنية تشكيل قطاع التوصيل في المملكة.", excerpt_en: "How technology is reshaping delivery in the Kingdom.", body_ar: "يشهد قطاع التوصيل في المملكة نموًا متسارعًا مدفوعًا بالتحول الرقمي وارتفاع الطلب على الخدمات الفورية.\nنستعرض في هذا المقال أبرز الاتجاهات.", body_en: "The delivery sector in the Kingdom is growing rapidly.", published: true, publishedAt: daysFromNow(-10), views: 124, tags: ["logistics"], createdAt: new Date(), updatedAt: new Date() },
    { _id: oid(), slug: "fleet-management-tips", title_ar: "خمس ممارسات لإدارة أسطول فعّالة", title_en: "5 Practices for Effective Fleet Management", excerpt_ar: "نصائح عملية لإدارة أسطول المركبات.", excerpt_en: "Practical tips for managing your vehicle fleet.", body_ar: "إدارة الأسطول تتطلب متابعة دقيقة للتفويضات والصيانة والتأمين.", body_en: "Fleet management requires careful tracking.", published: true, publishedAt: daysFromNow(-25), views: 89, tags: ["fleet"], createdAt: new Date(), updatedAt: new Date() },
    { _id: oid(), slug: "saudi-logistics-vision-2030", title_ar: "اللوجستيات ورؤية 2030", title_en: "Logistics and Vision 2030", excerpt_ar: "دور القطاع اللوجستي في تحقيق رؤية المملكة.", excerpt_en: "The role of logistics in the Kingdom's vision.", body_ar: "تولي رؤية 2030 اهتمامًا كبيرًا بالقطاع اللوجستي كركيزة للنمو الاقتصادي.", body_en: "Vision 2030 places great importance on logistics.", published: true, publishedAt: daysFromNow(-40), views: 210, tags: ["vision2030"], createdAt: new Date(), updatedAt: new Date() },
  ]);
  await db.collection("jobs").insertMany([
    { _id: oid(), title_ar: "مندوب توصيل", title_en: "Delivery Rider", department: "العمليات", location_ar: "جدة", location_en: "Jeddah", type: "full_time", description_ar: "مطلوب مناديب توصيل بدراجات آلية لمناطق جدة. يشترط رخصة قيادة سارية.", description_en: "Delivery riders needed for Jeddah.", published: true, createdAt: new Date(), updatedAt: new Date() },
    { _id: oid(), title_ar: "سائق شاحنة ثقيلة", title_en: "Heavy Truck Driver", department: "النقل الثقيل", location_ar: "الرياض", location_en: "Riyadh", type: "full_time", description_ar: "مطلوب سائقو شاحنات ثقيلة برخصة سارية وخبرة لا تقل عن سنتين.", description_en: "Heavy truck drivers needed.", published: true, createdAt: new Date(), updatedAt: new Date() },
    { _id: oid(), title_ar: "أخصائي موارد بشرية", title_en: "HR Specialist", department: "الموارد البشرية", location_ar: "جدة", location_en: "Jeddah", type: "full_time", description_ar: "أخصائي موارد بشرية للتعامل مع منصات العمل السعودية والإقامات.", description_en: "HR specialist familiar with Saudi platforms.", published: true, createdAt: new Date(), updatedAt: new Date() },
  ]);
  const brands = [["Keeta", "#ffd100"], ["HungerStation", "#ff5a00"], ["Amazon", "#232f3e"], ["Ninja", "#1a1a2e"], ["ToYou", "#00b8a9"]];
  await db.collection("clientlogos").insertMany(brands.map(([name, color], i) => ({ _id: oid(), name, logo: wordmark(name, color), order: i, active: true, createdAt: new Date(), updatedAt: new Date() })));

  // ── A couple of public submissions ─────────────────────────
  await db.collection("submissions").insertMany([
    { _id: oid(), type: "contact", name: "عبدالله السالم", email: "abdullah@example.com", phone: "+966555000111", subject: "استفسار عن الشراكة", message: "نرغب في مناقشة إمكانية التعاون في خدمات التوصيل بمنطقة الرياض.", status: "new", createdAt: daysFromNow(-1), updatedAt: new Date() },
    { _id: oid(), type: "newsletter", email: "subscriber@example.com", status: "new", createdAt: daysFromNow(-2), updatedAt: new Date() },
  ]);

  // ── Link two logins to employee profiles ───────────────────
  const hash = await bcrypt.hash("Manager@123", 12);
  await db.collection("users").insertMany([
    { firstName: "Mohamed", lastName: "Ahmed", email: "hr.manager@firstline.com", passwordHash: hash, role: "hr_manager", employee: emp["20250101"], extraPermissions: [], deniedPermissions: [], assignedCustomers: [], isActive: true, sessionVersion: 1, createdAt: new Date(), updatedAt: new Date() },
    { firstName: "Ahmed", lastName: "Ramadan", email: "fleet.manager@firstline.com", passwordHash: hash, role: "fleet_manager", employee: emp["20250138"], extraPermissions: [], deniedPermissions: [], assignedCustomers: [], isActive: true, sessionVersion: 1, createdAt: new Date(), updatedAt: new Date() },
  ]);

  console.log("\n  ✓ Demo data seeded across all modules.");
  console.log("  Logins:");
  console.log("    admin@firstline.com / Admin@12345        (super admin)");
  console.log("    hr.manager@firstline.com / Manager@123   (HR manager, linked to employee)");
  console.log("    fleet.manager@firstline.com / Manager@123 (Fleet manager)\n");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Demo seed failed:", err.message);
  process.exit(1);
});
