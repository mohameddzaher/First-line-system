"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Note {
  _id: string;
  title: string;
  body?: string;
  href?: string;
  type: string;
  read: boolean;
  createdAt: string;
}

const DOT: Record<string, string> = { info: "bg-info", success: "bg-success", warning: "bg-warning", danger: "bg-danger" };

export function NotificationBell() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const d = await res.json();
        setNotes(d.rows ?? []);
        setUnread(d.unread ?? 0);
      }
    } catch {
      /* silent */
    }
  }, []);

  // Poll every 60s so the badge stays reasonably fresh without a socket.
  useEffect(() => {
    load();
    const timer = setInterval(load, 60_000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const markAll = async () => {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setNotes((ns) => ns.map((n) => ({ ...n, read: true })));
    setUnread(0);
  };

  const ar = locale === "ar";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
        aria-label={ar ? "الإشعارات" : "Notifications"}
      >
        <Bell className="size-4.5" aria-hidden />
        {unread > 0 && (
          <span className="absolute -end-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white tabular">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 mt-2 w-80 origin-top animate-[scale-in_0.12s_ease-out] overflow-hidden rounded-xl bg-surface-raised shadow-overlay ring-1 ring-border">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-fg">{ar ? "الإشعارات" : "Notifications"}</p>
            {notes.length > 0 && (
              <button onClick={markAll} className="flex items-center gap-1 text-xs text-fg-muted hover:text-fg">
                <CheckCheck className="size-3.5" aria-hidden />{ar ? "تعليم الكل كمقروء" : "Mark all read"}
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notes.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-fg-subtle">{ar ? "لا توجد إشعارات" : "No notifications"}</p>
            ) : (
              notes.map((n) => (
                <button
                  key={n._id}
                  onClick={() => { if (n.href) { router.push(n.href); setOpen(false); } }}
                  className={cn("flex w-full gap-3 border-b border-border px-4 py-3 text-start transition-colors last:border-0 hover:bg-surface-hover", !n.read && "bg-primary/5")}
                >
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", DOT[n.type] ?? "bg-info")} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-fg">{n.title}</span>
                    {n.body && <span className="mt-0.5 block text-xs text-fg-muted">{n.body}</span>}
                    <span className="mt-1 block text-[11px] text-fg-subtle tabular">{formatDateTime(n.createdAt)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-border px-4 py-2.5 text-center text-xs font-medium text-primary transition-colors hover:bg-surface-hover"
          >
            {ar ? "عرض كل الإشعارات" : "View all notifications"}
          </Link>
        </div>
      )}
    </div>
  );
}
