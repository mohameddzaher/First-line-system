import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { getLocale, getT } from "@/i18n/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { ROLES, ROLE_KEYS, type RoleKey } from "@/lib/rbac";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Roles & Permissions" };
export const dynamic = "force-dynamic";

export default async function RolesPage() {
  await requirePermission("admin.roles:read");
  await connectDB();

  const [locale, t] = await Promise.all([getLocale(), getT()]);

  // Count how many users hold each role so the page reflects real usage.
  const counts = await User.aggregate<{ _id: RoleKey; count: number }>([
    { $group: { _id: "$role", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [c._id, c.count]));

  return (
    <>
      <PageHeader title={t("admin.roles")} description={t("app.tagline")} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ROLE_KEYS.map((key) => {
          const role = ROLES[key];
          const perms = role.permissions;
          const isWildcard = perms.includes("*");
          const label = locale === "ar" ? role.labelAr : role.labelEn;

          // Group permissions by module prefix for a readable summary.
          const byModule = new Map<string, number>();
          if (!isWildcard) {
            for (const p of perms) {
              const mod = p.split(".")[0];
              byModule.set(mod, (byModule.get(mod) ?? 0) + 1);
            }
          }

          return (
            <Card key={key} className="flex flex-col">
              <div className="border-b border-border p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-fg">{label}</h3>
                    <p className="mt-0.5 font-mono text-xs text-fg-subtle">{key}</p>
                  </div>
                  <Badge tone="info">
                    {countMap.get(key) ?? 0} {locale === "ar" ? "مستخدم" : "users"}
                  </Badge>
                </div>
              </div>

              <div className="flex-1 p-5">
                {isWildcard ? (
                  <Badge tone="accent">
                    {locale === "ar" ? "جميع الصلاحيات" : "Full access"}
                  </Badge>
                ) : byModule.size === 0 ? (
                  <p className="text-sm text-fg-subtle">
                    {locale === "ar" ? "خدمة ذاتية فقط" : "Self-service only"}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {[...byModule.entries()].map(([mod, count]) => (
                      <Badge key={mod} tone="neutral">
                        {mod} · {count}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-border px-5 py-3">
                <p className="text-xs text-fg-muted">
                  {t("admin.permissionsCount").replace(
                    "{count}",
                    String(isWildcard ? "∞" : perms.length),
                  )}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
