import { guard, ok } from "@/lib/api";
import { Employee } from "@/models/Employee";
import { User } from "@/models/User";
import { escapeRegex } from "@/lib/utils";

export const runtime = "nodejs";

/**
 * Typeahead for "link to employee profile" in the user form. Returns employees
 * that don't already own a login (optionally including the one currently linked
 * to the user being edited).
 */
export const GET = guard({ permission: "admin.users:read" }, async ({ request }) => {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const keepId = url.searchParams.get("keep"); // currently-linked employee, if editing

  const linkedIds = (await User.find({ employee: { $ne: null } }).distinct("employee")).map(String);
  const excluded = linkedIds.filter((id) => id !== keepId);

  const filter: Record<string, unknown> = { _id: { $nin: excluded } };
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ nameAr: rx }, { nameEn: rx }, { idNumber: rx }, { employeeNumber: rx }];
  }

  const employees = await Employee.find(filter)
    .select("nameAr nameEn employeeNumber idNumber jobTitle")
    .limit(20)
    .lean();

  return ok({ employees });
});
