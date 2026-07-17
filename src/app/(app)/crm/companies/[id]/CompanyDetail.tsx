"use client";

import { useState } from "react";
import { Building2, Handshake, Users, ShoppingCart, History, Mail, Phone, Globe } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardBody, CardHeader, EmptyState } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/i18n/provider";
import { formatCurrency, formatDate, formatDateTime, initials } from "@/lib/utils";
import type { Locale } from "@/i18n/dictionaries";

interface Company {
  _id: string;
  name: string;
  nameAr?: string;
  kind: string;
  status: string;
  industry?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  crNumber?: string;
  vatNumber?: string;
  owner?: { firstName: string; lastName: string } | null;
  notes?: string;
}

const STAGE: Record<string, [string, string, string]> = {
  lead: ["عميل محتمل", "Lead", "info"], qualified: ["مؤهّل", "Qualified", "info"], proposal: ["عرض سعر", "Proposal", "warning"],
  negotiation: ["تفاوض", "Negotiation", "accent"], won: ["مكسوبة", "Won", "success"], lost: ["خاسرة", "Lost", "danger"],
};
const KIND: Record<string, [string, string, string]> = { customer: ["عميل", "Customer", "info"], vendor: ["مورّد", "Vendor", "accent"], both: ["عميل ومورّد", "Both", "success"] };

export function CompanyDetail({
  locale,
  company,
  deals,
  contacts,
  pos,
  history,
}: {
  locale: Locale;
  company: Company;
  deals: Record<string, unknown>[];
  contacts: Record<string, unknown>[];
  pos: Record<string, unknown>[];
  history: Record<string, unknown>[];
}) {
  const { t } = useI18n();
  const ar = locale === "ar";
  const [tab, setTab] = useState("overview");

  const kind = KIND[company.kind];
  const pipelineValue = deals.filter((d) => !["won", "lost"].includes(d.stage as string)).reduce((s, d) => s + ((d.value as number) || 0), 0);
  const wonValue = deals.filter((d) => d.stage === "won").reduce((s, d) => s + ((d.value as number) || 0), 0);

  const tabs = [
    { id: "overview", label: ar ? "نظرة عامة" : "Overview", icon: Building2 },
    { id: "deals", label: ar ? "الصفقات" : "Deals", icon: Handshake, count: deals.length },
    { id: "contacts", label: ar ? "جهات الاتصال" : "Contacts", icon: Users, count: contacts.length },
    ...(company.kind !== "customer" ? [{ id: "pos", label: ar ? "أوامر الشراء" : "Purchase Orders", icon: ShoppingCart, count: pos.length }] : []),
    { id: "history", label: ar ? "السجل" : "History", icon: History, count: history.length },
  ];

  const detailRows: [string, string][] = [
    [ar ? "الاسم بالعربية" : "Arabic Name", company.nameAr || "—"],
    [ar ? "القطاع" : "Industry", company.industry || "—"],
    [ar ? "المدينة" : "City", company.city || "—"],
    [ar ? "السجل التجاري" : "CR Number", company.crNumber || "—"],
    [ar ? "الرقم الضريبي" : "VAT Number", company.vatNumber || "—"],
    [ar ? "المسؤول" : "Owner", company.owner ? `${company.owner.firstName} ${company.owner.lastName}` : "—"],
  ];

  return (
    <>
      <PageHeader title="" backHref="/crm/companies" backLabel={t("common.back")} />

      <Card className="mb-5">
        <CardBody className="flex items-center gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">{initials(company.name)}</span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-fg">{company.name}</h1>
              {kind && <Badge tone={kind[2] as never}>{ar ? kind[0] : kind[1]}</Badge>}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-4 text-sm text-fg-muted">
              {company.email && <a href={`mailto:${company.email}`} className="flex items-center gap-1.5 hover:text-fg"><Mail className="size-3.5" />{company.email}</a>}
              {company.phone && <a href={`tel:${company.phone}`} className="flex items-center gap-1.5 hover:text-fg" dir="ltr"><Phone className="size-3.5" />{company.phone}</a>}
              {company.website && <a href={company.website} className="flex items-center gap-1.5 hover:text-fg" dir="ltr"><Globe className="size-3.5" />{company.website}</a>}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* KPI row */}
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label={ar ? "الصفقات" : "Deals"} value={String(deals.length)} />
        <Stat label={ar ? "خط الأنابيب" : "Pipeline"} value={formatCurrency(pipelineValue, locale)} accent />
        <Stat label={ar ? "مكسوبة" : "Won Value"} value={formatCurrency(wonValue, locale)} />
        <Stat label={ar ? "جهات الاتصال" : "Contacts"} value={String(contacts.length)} />
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((tb) => {
          const Icon = tb.icon;
          return (
            <button key={tb.id} onClick={() => setTab(tb.id)} className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${tab === tb.id ? "border-primary text-primary" : "border-transparent text-fg-muted hover:text-fg"}`}>
              <Icon className="size-4" aria-hidden />{tb.label}
              {tb.count !== undefined && tb.count > 0 && <span className="rounded-full bg-bg-subtle px-1.5 text-xs tabular text-fg-muted">{tb.count}</span>}
            </button>
          );
        })}
      </div>

      <div className="animate-[fade-in_0.2s_ease-out]">
        {tab === "overview" && (
          <Card><CardBody>
            <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
              {detailRows.map(([label, value]) => <div key={label}><dt className="text-xs text-fg-subtle">{label}</dt><dd className="mt-0.5 text-sm font-medium text-fg">{value}</dd></div>)}
            </dl>
            {company.notes && <p className="mt-4 border-t border-border pt-4 text-sm text-fg-muted">{company.notes}</p>}
          </CardBody></Card>
        )}

        {tab === "deals" && (
          <TableCard empty={ar ? "لا توجد صفقات" : "No deals"} headers={[ar ? "العنوان" : "Title", ar ? "المرحلة" : "Stage", ar ? "القيمة" : "Value", ar ? "الإغلاق المتوقع" : "Close"]}
            rows={deals.map((d) => { const s = STAGE[d.stage as string]; return [
              d.title as string,
              <Badge key="s" tone={(s?.[2] as never) ?? "neutral"} dot>{s ? (ar ? s[0] : s[1]) : (d.stage as string)}</Badge>,
              <span key="v" className="tabular">{formatCurrency(d.value as number, locale)}</span>,
              d.expectedCloseDate ? formatDate(d.expectedCloseDate as string) : "—",
            ]; })} />
        )}

        {tab === "contacts" && (
          <TableCard empty={ar ? "لا توجد جهات اتصال" : "No contacts"} headers={[ar ? "الاسم" : "Name", ar ? "المسمى" : "Title", ar ? "البريد" : "Email", ar ? "الهاتف" : "Phone"]}
            rows={contacts.map((c) => [c.name as string, (c.title as string) || "—", <span key="e" dir="ltr">{(c.email as string) || "—"}</span>, <span key="p" dir="ltr">{(c.phone as string) || "—"}</span>])} />
        )}

        {tab === "pos" && (
          <TableCard empty={ar ? "لا توجد أوامر شراء" : "No purchase orders"} headers={[ar ? "رقم الأمر" : "PO #", ar ? "التاريخ" : "Date", ar ? "الحالة" : "Status", ar ? "الإجمالي" : "Total"]}
            rows={pos.map((p) => [<span key="n" className="font-mono" dir="ltr">{p.orderNumber as string}</span>, formatDate(p.orderDate as string), <span key="s" className="capitalize">{String(p.status)}</span>, <span key="t" className="tabular">{formatCurrency(p.total as number, locale)}</span>])} />
        )}

        {tab === "history" && (
          <Card><CardBody>
            {history.length === 0 ? <EmptyState icon={<History className="size-5" />} title={ar ? "لا يوجد سجل" : "No history"} /> : (
              <ol className="relative space-y-4 border-s border-border ps-6">
                {history.map((h, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -start-[27px] top-1 size-3 rounded-full bg-primary ring-4 ring-surface" aria-hidden />
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="info">{h.action as string}</Badge>
                      <span className="text-sm text-fg">{h.actorName as string}</span>
                      <span className="text-xs text-fg-subtle tabular">{formatDateTime(h.createdAt as string)}</span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardBody></Card>
        )}
      </div>
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card className={accent ? "ring-primary/30" : undefined}><CardBody>
      <p className="text-xs text-fg-muted">{label}</p>
      <p className={`mt-1 text-xl font-bold tabular ${accent ? "text-primary" : "text-fg"}`}>{value}</p>
    </CardBody></Card>
  );
}

function TableCard({ headers, rows, empty }: { headers: string[]; rows: React.ReactNode[][]; empty: string }) {
  if (rows.length === 0) return <Card><EmptyState title={empty} /></Card>;
  return (
    <Card className="overflow-hidden"><div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-bg-subtle text-xs text-fg-muted"><tr>{headers.map((h) => <th key={h} className="px-4 py-3 text-start font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} className="border-t border-border">{r.map((c, j) => <td key={j} className="px-4 py-3 text-fg">{c}</td>)}</tr>)}</tbody>
      </table>
    </div></Card>
  );
}
