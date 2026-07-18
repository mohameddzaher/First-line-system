import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/i18n/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { ChangePasswordClient } from "./ChangePasswordClient";
import type { RoleKey } from "@/lib/rbac";

export const metadata: Metadata = { title: "Security" };
export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  const user = await requireUser();
  await connectDB();
  const locale = await getLocale();

  const account = await User.findById(user.id).select("email role lastLoginAt").lean();

  return (
    <ChangePasswordClient
      title={locale === "ar" ? "الأمان" : "Security"}
      locale={locale}
      account={{
        email: account?.email ?? user.email,
        role: (account?.role ?? user.role) as RoleKey,
        lastLoginAt: account?.lastLoginAt ? new Date(account.lastLoginAt).toISOString() : null,
      }}
    />
  );
}
