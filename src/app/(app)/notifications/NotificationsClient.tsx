"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardBody, EmptyState } from "@/components/ui/Card";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/i18n/provider";
import { formatDateTime } from "@/lib/utils";
import type { Locale } from "@/i18n/dictionaries";

interface Row {
  _id: string;
  title: string;
  body?: string;
  href?: string;
  type: "info" | "success" | "warning" | "danger";
  read: boolean;
  createdAt: string;
}

const TONE: Record<Row["type"], BadgeTone> = {
  info: "info",
  success: "success",
  warning: "warning",
  danger: "danger",
};

export function NotificationsClient({
  locale,
  rows,
  unread,
}: {
  locale: Locale;
  rows: Row[];
  unread: number;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const ar = locale === "ar";
  const [tab, setTab] = useState<"all" | "unread">(unread > 0 ? "unread" : "all");
  const [busy, setBusy] = useState(false);

  const visible = useMemo(() => (tab === "unread" ? rows.filter((r) => !r.read) : rows), [rows, tab]);

  const TYPE_LABEL: Record<Row["type"], string> = {
    info: ar ? "معلومة" : "Info",
    success: ar ? "إتمام" : "Success",
    warning: ar ? "تنبيه" : "Warning",
    danger: ar ? "تحذير" : "Alert",
  };

  async function setRead(id: string, read: boolean) {
    setBusy(true);
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read }),
      });
      if (res.ok) router.refresh();
      else toast.error(t("common.somethingWentWrong"));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(ar ? "تم الحذف" : "Deleted");
        router.refresh();
      } else {
        toast.error(t("common.somethingWentWrong"));
      }
    } finally {
      setBusy(false);
    }
  }

  async function markAll() {
    setBusy(true);
    try {
      const res = await fetch("/api/notifications/read-all", { method: "POST" });
      if (res.ok) {
        toast.success(ar ? "تم تعليم الكل كمقروء" : "All marked as read");
        setTab("all");
        router.refresh();
      } else {
        toast.error(t("common.somethingWentWrong"));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title={ar ? "الإشعارات" : "Notifications"}
        action={
          unread > 0 ? (
            <Button
              variant="secondary"
              icon={<CheckCheck className="size-4" />}
              onClick={markAll}
              loading={busy}
            >
              {ar ? "تعليم الكل كمقروء" : "Mark all read"}
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex gap-2">
        {(["unread", "all"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={[
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              tab === key ? "bg-primary text-white" : "bg-surface text-fg-muted ring-1 ring-border hover:text-fg",
            ].join(" ")}
          >
            {key === "unread" ? (ar ? "غير المقروءة" : "Unread") : ar ? "الكل" : "All"}
            {key === "unread" && unread > 0 ? (
              <span className="ms-1.5 rounded-full bg-white/20 px-1.5 text-xs">{unread}</span>
            ) : null}
          </button>
        ))}
      </div>

      <Card>
        <CardBody className={visible.length === 0 ? undefined : "p-0"}>
          {visible.length === 0 ? (
            <EmptyState
              icon={<Bell className="size-5" />}
              title={tab === "unread" ? (ar ? "لا توجد إشعارات غير مقروءة" : "No unread notifications") : ar ? "لا توجد إشعارات" : "No notifications"}
              description={
                ar ? "ستظهر هنا التنبيهات المتعلقة بعملك." : "Alerts relevant to your work appear here."
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {visible.map((row) => (
                <li
                  key={row._id}
                  className={[
                    "flex flex-wrap items-start gap-3 p-4 transition-colors",
                    row.read ? "" : "bg-primary/[0.03]",
                  ].join(" ")}
                >
                  {!row.read ? (
                    <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-hidden />
                  ) : (
                    <span className="mt-2 size-2 shrink-0" aria-hidden />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={TONE[row.type]}>{TYPE_LABEL[row.type]}</Badge>
                      {row.href ? (
                        <Link
                          href={row.href}
                          onClick={() => {
                            if (!row.read) void setRead(row._id, true);
                          }}
                          className="font-medium text-primary hover:underline"
                        >
                          {row.title}
                        </Link>
                      ) : (
                        <span className="font-medium text-fg">{row.title}</span>
                      )}
                    </div>
                    {row.body ? <p className="mt-1 text-sm text-fg-muted">{row.body}</p> : null}
                    <p className="mt-1 text-xs text-fg-subtle">{formatDateTime(row.createdAt)}</p>
                  </div>

                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => setRead(row._id, !row.read)}
                      aria-label={
                        row.read
                          ? ar
                            ? "تعليم كغير مقروء"
                            : "Mark as unread"
                          : ar
                            ? "تعليم كمقروء"
                            : "Mark as read"
                      }
                    >
                      <Check className={row.read ? "size-4 text-fg-subtle" : "size-4 text-primary"} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => remove(row._id)}
                      aria-label={ar ? "حذف" : "Delete"}
                    >
                      <Trash2 className="size-4 text-danger" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </>
  );
}
