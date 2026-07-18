"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Clock, MapPin, Phone, User } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardBody, CardHeader, EmptyState } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Combobox } from "@/components/ui/Combobox";
import { Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/i18n/provider";
import {
  ORDER_HAPPY_PATH,
  nextStatuses,
  orderStatusLabel,
  orderStatusTone,
} from "@/lib/orderFlow";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Locale } from "@/i18n/dictionaries";

interface TimelineEvent {
  status: string;
  at: string;
  note?: string;
  by?: { firstName: string; lastName: string } | null;
}

interface OrderDoc {
  _id: string;
  orderNumber: string;
  externalId?: string;
  status: string;
  customerName?: string;
  customerPhone?: string;
  city?: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  amount?: number;
  codAmount?: number;
  deliveryFee?: number;
  placedAt: string;
  slaDueAt?: string | null;
  deliveredAt?: string | null;
  slaBreached: boolean;
  notes?: string;
  timeline: TimelineEvent[];
  project?: { _id: string; nameAr: string; nameEn?: string } | null;
  driver?: { _id: string; nameAr: string; nameEn?: string; employeeNumber?: string; phone?: string } | null;
}

interface DriverOption {
  _id: string;
  nameAr: string;
  nameEn?: string;
  employeeNumber?: string;
}

interface AuditRow {
  _id: string;
  action: string;
  actorName?: string;
  createdAt: string;
  resourceLabel?: string;
}

export function OrderDetail({
  locale,
  order,
  drivers,
  history,
  canUpdate,
}: {
  locale: Locale;
  order: OrderDoc;
  drivers: DriverOption[];
  history: AuditRow[];
  canUpdate: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const ar = locale === "ar";

  const [busy, setBusy] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [driver, setDriver] = useState(order.driver?._id ?? "");
  const [pending, setPending] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const moves = canUpdate ? nextStatuses(order.status) : [];
  const reached = new Set(order.timeline.map((e) => e.status));
  reached.add(order.status);

  async function advance() {
    if (!pending) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/ops/orders/${order._id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: pending, note: note.trim() || undefined }),
      });
      if (res.ok) {
        toast.success(ar ? "تم تحديث الحالة" : "Status updated");
        setPending(null);
        setNote("");
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

  async function assign() {
    if (!driver) {
      toast.error(t("common.required"));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/ops/orders/${order._id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driver }),
      });
      if (res.ok) {
        toast.success(ar ? "تم إسناد المندوب" : "Driver assigned");
        setAssignOpen(false);
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

  const money = (v?: number) => (typeof v === "number" ? formatCurrency(v, locale) : "—");

  return (
    <>
      <PageHeader
        title={order.orderNumber}
        action={
          <Link href="/ops/orders">
            <Button variant="ghost" icon={<ArrowLeft className="size-4 rtl:rotate-180" />}>
              {ar ? "عودة إلى الطلبات" : "Back to orders"}
            </Button>
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone={orderStatusTone(order.status)} dot>
          {orderStatusLabel(order.status, locale)}
        </Badge>
        {order.slaBreached ? (
          <Badge tone="danger">{ar ? "تجاوز مدة التسليم" : "SLA breached"}</Badge>
        ) : null}
        {order.project ? (
          <Link href={`/ops/projects`} className="text-sm text-primary hover:underline">
            {ar ? order.project.nameAr : (order.project.nameEn ?? order.project.nameAr)}
          </Link>
        ) : null}
      </div>

      {/* Progress rail across the happy path; exception states show as a badge only. */}
      <Card className="mb-4">
        <CardBody>
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-3">
            {ORDER_HAPPY_PATH.map((step, index) => {
              const done = reached.has(step);
              const current = order.status === step;
              return (
                <li key={step} className="flex items-center gap-2">
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
                    {done && !current ? <Check className="size-3.5" /> : index + 1}
                  </span>
                  <span className={current ? "text-sm font-medium text-fg" : "text-sm text-fg-muted"}>
                    {orderStatusLabel(step, locale)}
                  </span>
                  {index < ORDER_HAPPY_PATH.length - 1 ? (
                    <span className="mx-1 hidden h-px w-8 bg-border sm:block" />
                  ) : null}
                </li>
              );
            })}
          </ol>

          {moves.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
              {moves.map((next) => (
                <Button
                  key={next}
                  size="sm"
                  variant={next === "delivered" ? "primary" : "secondary"}
                  onClick={() => setPending(next)}
                >
                  {orderStatusLabel(next, locale)}
                </Button>
              ))}
              {canUpdate ? (
                <Button size="sm" variant="ghost" onClick={() => setAssignOpen(true)}>
                  {order.driver ? (ar ? "تغيير المندوب" : "Reassign driver") : ar ? "إسناد مندوب" : "Assign driver"}
                </Button>
              ) : null}
            </div>
          ) : null}
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid gap-4 lg:col-span-2">
          <Card>
            <CardHeader title={ar ? "تفاصيل الطلب" : "Order details"} />
            <CardBody>
              <dl className="grid gap-4 sm:grid-cols-2">
                <Detail label={ar ? "العميل" : "Customer"} value={order.customerName} icon={<User className="size-4" />} />
                <Detail label={ar ? "الهاتف" : "Phone"} value={order.customerPhone} icon={<Phone className="size-4" />} ltr />
                <Detail label={ar ? "المدينة" : "City"} value={order.city} icon={<MapPin className="size-4" />} />
                <Detail label={ar ? "المعرّف الخارجي" : "External ID"} value={order.externalId} ltr />
                <Detail label={ar ? "عنوان الاستلام" : "Pickup"} value={order.pickupAddress} />
                <Detail label={ar ? "عنوان التسليم" : "Dropoff"} value={order.dropoffAddress} />
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={ar ? "المسار الزمني" : "Timeline"} />
            <CardBody>
              {order.timeline.length === 0 ? (
                <EmptyState
                  icon={<Clock className="size-5" />}
                  title={ar ? "لا توجد أحداث بعد" : "No events yet"}
                  description={ar ? "ستظهر كل تغييرات الحالة هنا." : "Every status change will appear here."}
                />
              ) : (
                <ol className="relative space-y-5 border-s border-border ps-5">
                  {[...order.timeline].reverse().map((event, index) => (
                    <li key={`${event.status}-${event.at}-${index}`} className="relative">
                      <span className="absolute -start-[1.4rem] top-1.5 size-2.5 rounded-full bg-primary ring-4 ring-surface" />
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={orderStatusTone(event.status)}>
                          {orderStatusLabel(event.status, locale)}
                        </Badge>
                        <span className="text-xs text-fg-muted">{formatDateTime(event.at)}</span>
                      </div>
                      {event.by ? (
                        <p className="mt-1 text-sm text-fg-muted">
                          {ar ? "بواسطة" : "by"} {event.by.firstName} {event.by.lastName}
                        </p>
                      ) : null}
                      {event.note ? <p className="mt-1 text-sm text-fg">{event.note}</p> : null}
                    </li>
                  ))}
                </ol>
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
        </div>

        <div className="grid gap-4 content-start">
          <Card>
            <CardHeader title={ar ? "المندوب" : "Driver"} />
            <CardBody>
              {order.driver ? (
                <div className="space-y-1">
                  <Link
                    href={`/hr/employees/${order.driver._id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {ar ? order.driver.nameAr : (order.driver.nameEn ?? order.driver.nameAr)}
                  </Link>
                  {order.driver.employeeNumber ? (
                    <p className="font-mono text-xs text-fg-muted" dir="ltr">
                      {order.driver.employeeNumber}
                    </p>
                  ) : null}
                  {order.driver.phone ? (
                    <p className="text-sm text-fg-muted" dir="ltr">
                      {order.driver.phone}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-fg-muted">{ar ? "لم يُسنَد بعد" : "Not assigned yet"}</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={ar ? "المبالغ" : "Amounts"} />
            <CardBody>
              <dl className="grid gap-3 text-sm">
                <Row label={ar ? "قيمة الطلب" : "Order value"} value={money(order.amount)} />
                <Row label={ar ? "الدفع عند الاستلام" : "COD"} value={money(order.codAmount)} />
                <Row label={ar ? "رسوم التوصيل" : "Delivery fee"} value={money(order.deliveryFee)} />
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={ar ? "التوقيتات" : "Timing"} />
            <CardBody>
              <dl className="grid gap-3 text-sm">
                <Row label={ar ? "وقت الطلب" : "Placed"} value={formatDateTime(order.placedAt)} />
                <Row
                  label={ar ? "الموعد المستهدف" : "SLA due"}
                  value={order.slaDueAt ? formatDateTime(order.slaDueAt) : "—"}
                />
                <Row
                  label={ar ? "وقت التسليم" : "Delivered"}
                  value={order.deliveredAt ? formatDateTime(order.deliveredAt) : "—"}
                />
              </dl>
            </CardBody>
          </Card>

          {order.notes ? (
            <Card>
              <CardHeader title={ar ? "ملاحظات" : "Notes"} />
              <CardBody>
                <p className="whitespace-pre-wrap text-sm text-fg">{order.notes}</p>
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>

      <Modal
        open={pending !== null}
        onClose={() => setPending(null)}
        title={ar ? "تحديث الحالة" : "Update status"}
      >
        <div className="grid gap-4">
          <p className="text-sm text-fg-muted">
            {ar ? "الحالة الجديدة:" : "New status:"}{" "}
            <Badge tone={orderStatusTone(pending ?? "")}>
              {pending ? orderStatusLabel(pending, locale) : ""}
            </Badge>
          </p>
          <Textarea
            label={ar ? "ملاحظة (اختياري)" : "Note (optional)"}
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPending(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={advance} loading={busy}>
              {t("common.save")}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title={ar ? "إسناد مندوب" : "Assign driver"}
      >
        <div className="grid gap-4">
          <Combobox
            label={ar ? "المندوب" : "Driver"}
            value={driver}
            onChange={setDriver}
            options={drivers.map((d) => ({
              value: d._id,
              label: `${ar ? d.nameAr : (d.nameEn ?? d.nameAr)}${d.employeeNumber ? ` · ${d.employeeNumber}` : ""}`,
            }))}
            placeholder={ar ? "ابحث عن مندوب…" : "Search drivers…"}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAssignOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={assign} loading={busy}>
              {t("common.save")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function Detail({
  label,
  value,
  icon,
  ltr,
}: {
  label: string;
  value?: string;
  icon?: React.ReactNode;
  ltr?: boolean;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs text-fg-muted">
        {icon}
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-fg" dir={ltr ? "ltr" : undefined}>
        {value || "—"}
      </dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-fg-muted">{label}</dt>
      <dd className="font-medium text-fg">{value}</dd>
    </div>
  );
}
