import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { getLocale, getT } from "@/i18n/server";
import { connectDB } from "@/lib/db";
import { Vehicle } from "@/models/Vehicle";
import { runListQuery } from "@/lib/listQuery";
import { parseListQuery } from "@/lib/query";
import { serialize } from "@/lib/serialize";
import { vehicleSpec } from "@/app/api/fleet/vehicles/route";
import { AuthorizationsClient, type AuthRow } from "./AuthorizationsClient";
import type { ListResult } from "@/lib/query";

export const metadata: Metadata = { title: "Authorizations" };
export const dynamic = "force-dynamic";

export default async function AuthorizationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  await requirePermission("fleet.authorizations:read");
  await connectDB();
  const [locale, t, sp] = await Promise.all([getLocale(), getT(), searchParams]);
  const query = parseListQuery(new URLSearchParams(sp));

  // Only vehicles that currently have an active authorization.
  const result = await runListQuery(Vehicle, query, {
    ...vehicleSpec,
    baseFilter: { currentAuthorization: { $ne: null } },
  });

  return (
    <AuthorizationsClient
      initial={serialize(result) as unknown as ListResult<AuthRow>}
      locale={locale}
      title={t("fleet.authorizations")}
    />
  );
}
