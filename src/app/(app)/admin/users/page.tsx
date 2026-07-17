import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { getLocale, getT } from "@/i18n/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { runListQuery } from "@/lib/listQuery";
import { parseListQuery } from "@/lib/query";
import { roleOptions } from "@/lib/roleOptions";
import { serialize } from "@/lib/serialize";
import { UsersClient, type UserRow } from "./UsersClient";
import type { ListResult } from "@/lib/query";

export const metadata: Metadata = { title: "Users" };
export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  await requirePermission("admin.users:read");
  await connectDB();

  const [locale, t, sp] = await Promise.all([getLocale(), getT(), searchParams]);
  const query = parseListQuery(new URLSearchParams(sp));

  const result = await runListQuery(User, query, {
    searchFields: ["firstName", "lastName", "email"],
    filterMap: {
      role: (v) => ({ role: v }),
      status: (v) => ({ isActive: v === "active" }),
    },
    sortable: ["firstName", "email", "role", "createdAt", "lastLoginAt"],
    defaultSort: "createdAt",
    populate: [
      { path: "employee", select: "nameAr nameEn employeeNumber idNumber" },
      { path: "directManager", select: "firstName lastName email" },
    ],
  });

  return (
    <UsersClient
      initial={serialize(result) as unknown as ListResult<UserRow>}
      roles={roleOptions(locale)}
      labels={{
        title: t("admin.users"),
        add: t("admin.addUser"),
      }}
    />
  );
}
