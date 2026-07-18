"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardBody, CardHeader, EmptyState } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/i18n/provider";
import {
  DEAL_OUTCOMES,
  DEAL_PROGRESSION,
  dealStageLabel,
  dealStageTone,
} from "@/lib/dealStages";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import type { Locale } from "@/i18n/dictionaries";

interface DealDoc {
  _id: string;
  title: string;
  stage: string;
  value: number;
  probability: number;
  expectedCloseDate?: string | null;
  closedDate?: string | null;
  notes?: string;
  createdAt: string;
  company?: { _id: string; name: string; nameAr?: string; city?: string; phone?: string; email?: string } | null;
  contact?: { _id: string; name: string; title?: string; email?: string; phone?: string } | null;
  owner?: { firstName: string; lastName: string; email?: string } | null;
}

interface AuditRow {
  _id: string;
  action: string;
  actorName?: string;
  createdAt: string;
  changes?: { field: string; from?: unknown; to?: unknown }[];
}

export function DealDetail({
  locale,
  deal,
  history,
  canUpdate,
}: {
  locale: Locale;
  deal: DealDoc;
  history: AuditRow[];
  canUpdate: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const ar = locale === "ar";
  const [busy, setBusy] = useState(false);

  const closed = deal.stage === "won" || deal.stage === "lost";
  const reachedIndex = DEAL_PROGRESSION.indexOf(deal.stage as (typeof DEAL_PROGRESSION)[number]);
  // Weighted value is what a pipeline forecast actually uses.
  const weighted = Math.round((deal.value * deal.probability) / 100);

  async function moveTo(stage: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/crm/deals/${deal._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      if (res.ok) {
        toast.success(ar ? "تم تحديث المرحلة" : "Stage updated");
        router.refresh();
      } else {
        toast.error(t("common.somethingWentWrong"));
      }
    } catch {
      toast.error(t("common.somethingWentWrong"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title={deal.title}
        action={
          <Link href="/crm/deals">
            <Button variant="ghost" icon={<ArrowLeft className="size-4 rtl:rotate-180" />}>
              {ar ? "عودة إلى الصفقات" : "Back to deals"}
            </Button>
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone={dealStageTone(deal.stage)} dot>
          {dealStageLabel(deal.stage, locale)}
        </Badge>
        {deal.company ? (
          <Link href={`/crm/companies/${deal.company._id}`} className="text-sm text-primary hover:underline">
            {ar ? (deal.company.nameAr ?? deal.company.name) : deal.company.name}
          </Link>
        ) : null}
      </div>

      <Card className="mb-4">
        <CardBody>
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-3">
            {DEAL_PROGRESSION.map((stage, index) => {
              const done = !closed && reachedIndex > index;
              const current = deal.stage === stage;
              return (
                <li key={stage} className="flex items-center gap-2">
                  <span
                    className={[
                      "flex size-7 items-center justify-center rounded-full text-xs font-medium ring-1",
                      current
                        ? "bg-primary text-white ring-primary"
                        : done
                          ? "bg-success/10 text-success ring-success/30"
                          : "bg-surface text-fg-muted ring-border",
                    ].join(" ")}
                  >
                    {done ? <Check className="size-3.5" /> : index + 1}
                  </span>
                  <span className={current ? "text-sm font-medium text-fg" : "text-sm text-fg-muted"}>
                    {dealStageLabel(stage, locale)}
                  </span>
                  {index < DEAL_PROGRESSION.length - 1 ? (
                    <span className="mx-1 hidden h-px w-8 bg-border sm:block" />
                  ) : null}
                </li>
              );
            })}
          </ol>

          {canUpdate ? (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
              {DEAL_PROGRESSION.filter((s) => s !== deal.stage).map((stage) => (
                <Button key={stage} size="sm" variant="secondary" disabled={busy} onClick={() => moveTo(stage)}>
                  {dealStageLabel(stage, locale)}
                </Button>
              ))}
              {DEAL_OUTCOMES.filter((s) => s !== deal.stage).map((stage) => (
                <Button
                  key={stage}
                  size="sm"
                  variant={stage === "won" ? "primary" : "ghost"}
                  disabled={busy}
                  onClick={() => moveTo(stage)}
                >
                  {dealStageLabel(stage, locale)}
                </Button>
              ))}
            </div>
          ) : null}
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid gap-4 lg:col-span-2">
          <Card>
            <CardHeader title={ar ? "القيمة" : "Value"} />
            <CardBody>
              <div className="grid gap-4 sm:grid-cols-3">
                <Metric label={ar ? "قيمة الصفقة" : "Deal value"} value={formatCurrency(deal.value, locale)} />
                <Metric label={ar ? "احتمال الإغلاق" : "Probability"} value={`${deal.probability}%`} />
                <Metric
                  label={ar ? "القيمة المرجّحة" : "Weighted value"}
                  value={formatCurrency(weighted, locale)}
                  hint={ar ? "القيمة × الاحتمال" : "value × probability"}
                />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title={ar ? "سجل المراحل والتعديلات" : "Stage & change history"}
              description={ar ? "كل تغيير على الصفقة مع من قام به ومتى." : "Every change, by whom and when."}
            />
            <CardBody>
              {history.length === 0 ? (
                <EmptyState title={ar ? "لا يوجد سجل" : "No history"} />
              ) : (
                <ol className="relative space-y-5 border-s border-border ps-5">
                  {history.map((row) => (
                    <li key={row._id} className="relative">
                      <span className="absolute -start-[1.4rem] top-1.5 size-2.5 rounded-full bg-primary ring-4 ring-surface" />
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-fg">{row.actorName ?? "—"}</span>
                        <span className="text-xs text-fg-muted">{row.action}</span>
                        <span className="text-xs text-fg-subtle">{formatDateTime(row.createdAt)}</span>
                      </div>
                      {row.changes?.length ? (
                        <ul className="mt-1 space-y-0.5">
                          {row.changes.map((c, i) => (
                            <li key={`${c.field}-${i}`} className="text-xs text-fg-muted">
                              <span className="font-medium">{c.field}</span>: {String(c.from ?? "—")} →{" "}
                              {String(c.to ?? "—")}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
            </CardBody>
          </Card>

          {deal.notes ? (
            <Card>
              <CardHeader title={ar ? "ملاحظات" : "Notes"} />
              <CardBody>
                <p className="whitespace-pre-wrap text-sm text-fg">{deal.notes}</p>
              </CardBody>
            </Card>
          ) : null}
        </div>

        <div className="grid content-start gap-4">
          <Card>
            <CardHeader title={ar ? "العميل" : "Company"} />
            <CardBody>
              {deal.company ? (
                <div className="space-y-1 text-sm">
                  <Link
                    href={`/crm/companies/${deal.company._id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {ar ? (deal.company.nameAr ?? deal.company.name) : deal.company.name}
                  </Link>
                  {deal.company.city ? <p className="text-fg-muted">{deal.company.city}</p> : null}
                  {deal.company.phone ? (
                    <p className="text-fg-muted" dir="ltr">
                      {deal.company.phone}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-fg-muted">—</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={ar ? "جهة الاتصال" : "Contact"} />
            <CardBody>
              {deal.contact ? (
                <div className="space-y-1 text-sm">
                  <Link
                    href={`/crm/contacts/${deal.contact._id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {deal.contact.name}
                  </Link>
                  {deal.contact.title ? <p className="text-fg-muted">{deal.contact.title}</p> : null}
                  {deal.contact.email ? (
                    <p className="text-fg-muted" dir="ltr">
                      {deal.contact.email}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-fg-muted">—</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={ar ? "التفاصيل" : "Details"} />
            <CardBody>
              <dl className="grid gap-3 text-sm">
                <Row label={ar ? "المسؤول" : "Owner"}>
                  {deal.owner ? `${deal.owner.firstName} ${deal.owner.lastName}` : "—"}
                </Row>
                <Row label={ar ? "الإغلاق المتوقع" : "Expected close"}>
                  {deal.expectedCloseDate ? formatDate(deal.expectedCloseDate) : "—"}
                </Row>
                <Row label={ar ? "تاريخ الإغلاق" : "Closed"}>
                  {deal.closedDate ? formatDate(deal.closedDate) : "—"}
                </Row>
                <Row label={ar ? "أُنشئت" : "Created"}>{formatDate(deal.createdAt)}</Row>
              </dl>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg bg-surface-hover p-4">
      <p className="text-xs text-fg-muted">{label}</p>
      <p className="mt-1 text-xl font-bold tabular text-fg">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-fg-subtle">{hint}</p> : null}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-fg-muted">{label}</dt>
      <dd className="font-medium text-fg">{children}</dd>
    </div>
  );
}
