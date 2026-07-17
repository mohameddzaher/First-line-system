/**
 * Bootstraps the first super admin. Safe to re-run: it updates the existing
 * account rather than creating duplicates.
 *
 *   npm run seed
 */
import { readFileSync } from "node:fs";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Load .env.local without pulling in a dependency.
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const i = line.indexOf("=");
  if (i > 0 && !line.trim().startsWith("#")) {
    process.env[line.slice(0, i).trim()] = line
      .slice(i + 1)
      .trim()
      .replace(/^"|"$/g, "");
  }
}

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@firstline.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";

const UserSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: { type: String, unique: true, lowercase: true },
    passwordHash: String,
    role: String,
    extraPermissions: { type: [String], default: [] },
    deniedPermissions: { type: [String], default: [] },
    employee: { type: mongoose.Schema.Types.ObjectId, default: null },
    directManager: { type: mongoose.Schema.Types.ObjectId, default: null },
    assignedCustomers: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
    sessionVersion: { type: Number, default: 1 },
  },
  { timestamps: true },
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
  console.log("Connected to", mongoose.connection.name);

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const result = await User.findOneAndUpdate(
    { email: ADMIN_EMAIL },
    {
      $set: { firstName: "Super", lastName: "Admin", role: "super_admin", isActive: true, passwordHash },
      $setOnInsert: { sessionVersion: 1 },
    },
    { upsert: true, new: true },
  );

  console.log("\n  Super admin ready");
  console.log("  ─────────────────────────────");
  console.log("  Email:    ", result.email);
  console.log("  Password: ", ADMIN_PASSWORD);
  console.log("  ─────────────────────────────");
  console.log("  Change this password after first sign-in.\n");

  // Reference data every module expects to exist. Upserts are idempotent.
  const db = mongoose.connection.db;

  const leaveTypes = [
    ["Annual Leave", "إجازة سنوية", "annual", true, true],
    ["Sick Leave", "إجازة مرضية", "sick", true, false],
    ["Emergency Leave", "إجازة طارئة", "emergency", true, true],
    ["Unpaid Leave", "إجازة بدون راتب", "unpaid", false, false],
    ["Marriage Leave", "إجازة زواج", "marriage", true, false],
    ["Paternity Leave", "إجازة أبوة", "paternity", true, false],
    ["Maternity Leave", "إجازة أمومة", "maternity", true, false],
    ["Hajj Leave", "إجازة حج", "hajj", true, false],
    ["Bereavement Leave", "إجازة وفاة", "bereavement", true, false],
    ["Exam Leave", "إجازة اختبار", "exam", true, false],
  ];
  for (const [en, ar, code, paid, affectsBalance] of leaveTypes) {
    await db.collection("leavetypes").updateOne(
      { code },
      { $set: { nameEn: en, nameAr: ar, code, paid, affectsBalance, isActive: true }, $currentDate: { updatedAt: true }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true },
    );
  }

  for (const [ar, en] of [["B2C", "B2C"], ["النقل الثقيل", "Heavy Transport"], ["خدمة عملاء", "Customer Service"], ["3PL", "3PL"], ["إدارة", "Administration"]]) {
    await db.collection("departments").updateOne(
      { nameAr: ar },
      { $set: { nameAr: ar, nameEn: en, isActive: true }, $currentDate: { updatedAt: true }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true },
    );
  }

  for (const [ar, en] of [["كيتا", "Keeta"], ["هنقرستيشن", "HungerStation"], ["أمازون", "Amazon"], ["نينجا", "Ninja"], ["تو يو", "ToYou"]]) {
    await db.collection("projects").updateOne(
      { nameAr: ar },
      { $set: { nameAr: ar, nameEn: en, isActive: true }, $currentDate: { updatedAt: true }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true },
    );
  }

  console.log("  Reference data seeded: 10 leave types, 5 departments, 5 projects.\n");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
