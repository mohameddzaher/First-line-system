"use client";

import Link from "next/link";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardBody, CardHeader, EmptyState } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { dealStageLabel, dealStageTone } from "@/lib/dealStages";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import type { Locale } from "@/i18n/dictionaries";

interface ContactDoc {
  _id: string;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: string;
  company?: { _id: string; name: string; nameAr?: string; city?: string } | null;
}

interface DealRow {
  _id: string;
  title: string;
  stage: string;
  value: number;
  expectedCloseDate?: string | null;
}

interface AuditRow {
  _id: string;
  action: string;
  actorName?: string;
  createdAt: string;
}

export function ContactDetail({
  locale,
  contact,
  deals,
  history,
}: {
  locale: Locale;
  contact: ContactDoc;
  deals: DealRow[];
  history: AuditRow[];
}) {
  const ar = locale === "ar";
  const openDeals = deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
  const wonValue = deals.filter((d) => d.stage === "won").reduce((sum, d) => sum + d.value, 0);

  return (
    <>
      <PageHeader
        title={contact.name}
        description={contact.title}
        action={
          <Link href="/crm/contacts">
            <Button variant="ghost" icon={<ArrowLeft className="size-4 rtl:rotate-180" />}>
              {ar ? "عودة إلى جهات الاتصال" : "Back to contacts"}
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid gap-4 lg:col-span-2">
          <Card>
            <CardHeader
              title={ar ? "الصفقات المرتبطة" : "Related deals"}
              description={
                ar
                  ? `${openDeals.length} صفقة مفتوحة · ${formatCurrency(wonValue, locale)} مكسوبة`
                  : `${openDeals.length} open · ${formatCurrency(wonValue, locale)} won`
              }
            />
            <CardBody className={deals.length ? "p-0" : undefined}>
              {deals.length === 0 ? (
                <EmptyState
                  title={ar ? "لا توجد صفقات" : "No deals"}
                  description={ar ? "لم تُربط أي صفقة بجهة الاتصال هذه." : "No deal references this contact yet."}
                />
              ) : (
                <ul className="divide-y divide-border">
                  {deals.map((d) => (
                    <li key={d._id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <Link href={`/crm/deals/${d._id}`} className="font-medium text-primary hover:underline">
                          {d.title}
                        </Link>
                        {d.expectedCloseDate ? (
                          <p className="text-xs text-fg-muted">
                            {ar ? "الإغلاق المتوقع" : "Expected"}: {formatDate(d.expectedCloseDate)}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium tabular text-fg">{formatCurrency(d.value, locale)}</span>
                        <Badge tone={dealStageTone(d.stage)}>{dealStageLabel(d.stage, locale)}</Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={ar ? "سجل التدقيق" : "Audit history"} />
            <CardBody>
              {history.length === 0 ? (
                <EmptyState title={ar ? "لا يوجد سجل" : "No history"} />
              ) : (
                <ul className="divide-y divide-border text-sm">
                  {history.map((row) => (
                    <li key={row._id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <span className="text-fg">
                        {row.actorName ?? "—"} · {row.action}
                      </span>
                      <span className="text-xs text-fg-muted">{formatDateTime(row.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          {contact.notes ? (
            <Card>
              <CardHeader title={ar ? "ملاحظات" : "Notes"} />
              <CardBody>
                <p className="whitespace-pre-wrap text-sm text-fg">{contact.notes}</p>
              </CardBody>
            </Card>
          ) : null}
        </div>

        <div className="grid content-start gap-4">
          <Card>
            <CardHeader title={ar ? "التواصل" : "Contact details"} />
            <CardBody>
              <dl className="grid gap-3 text-sm">
                <div>
                  <dt className="flex items-center gap-1.5 text-xs text-fg-muted">
                    <Mail className="size-3.5" />
                    {ar ? "البريد الإلكتروني" : "Email"}
                  </dt>
                  <dd className="mt-0.5 font-medium text-fg" dir="ltr">
                    {contact.email ? (
                      <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                        {contact.email}
                      </a>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-xs text-fg-muted">
                    <Phone className="size-3.5" />
                    {ar ? "الهاتف" : "Phone"}
                  </dt>
                  <dd className="mt-0.5 font-medium text-fg" dir="ltr">
                    {contact.phone ? (
                      <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
                        {contact.phone}
                      </a>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={ar ? "الشركة" : "Company"} />
            <CardBody>
              {contact.company ? (
                <div className="space-y-1 text-sm">
                  <Link
                    href={`/crm/companies/${contact.company._id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {ar ? (contact.company.nameAr ?? contact.company.name) : contact.company.name}
                  </Link>
                  {contact.company.city ? <p className="text-fg-muted">{contact.company.city}</p> : null}
                </div>
              ) : (
                <p className="text-sm text-fg-muted">—</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
