"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration: number;
}

interface ToastContextValue {
  toast: (input: {
    variant?: ToastVariant;
    title: string;
    description?: string;
    duration?: number;
  }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let counter = 0;
const nextId = () => `toast-${++counter}`;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback<ToastContextValue["toast"]>(
    ({ variant = "info", title, description, duration = 4500 }) => {
      const id = nextId();
      setToasts((prev) => [...prev.slice(-4), { id, variant, title, description, duration }]);
    },
    [],
  );

  const success = useCallback(
    (title: string, description?: string) => toast({ variant: "success", title, description }),
    [toast],
  );
  const error = useCallback(
    (title: string, description?: string) =>
      toast({ variant: "error", title, description, duration: 7000 }),
    [toast],
  );
  const warning = useCallback(
    (title: string, description?: string) => toast({ variant: "warning", title, description }),
    [toast],
  );
  const info = useCallback(
    (title: string, description?: string) => toast({ variant: "info", title, description }),
    [toast],
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info, dismiss }}>
      {children}
      {mounted &&
        createPortal(
          <div
            className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end"
            role="region"
            aria-label="Notifications"
          >
            {toasts.map((t) => (
              <ToastCard key={t.id} toast={t} onDismiss={dismiss} />
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

const VARIANTS: Record<
  ToastVariant,
  { icon: typeof CheckCircle2; ring: string; iconColor: string; bar: string }
> = {
  success: {
    icon: CheckCircle2,
    ring: "ring-success/25",
    iconColor: "text-success",
    bar: "bg-success",
  },
  error: { icon: XCircle, ring: "ring-danger/25", iconColor: "text-danger", bar: "bg-danger" },
  warning: {
    icon: AlertTriangle,
    ring: "ring-warning/25",
    iconColor: "text-warning",
    bar: "bg-warning",
  },
  info: { icon: Info, ring: "ring-info/25", iconColor: "text-info", bar: "bg-info" },
};

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [leaving, setLeaving] = useState(false);
  const { icon: Icon, ring, iconColor, bar } = VARIANTS[toast.variant];

  const close = useCallback(() => {
    setLeaving(true);
    // Let the exit transition finish before unmounting.
    setTimeout(() => onDismiss(toast.id), 180);
  }, [onDismiss, toast.id]);

  useEffect(() => {
    const timer = setTimeout(close, toast.duration);
    return () => clearTimeout(timer);
  }, [close, toast.duration]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl bg-surface-raised shadow-overlay ring-1",
        ring,
        "animate-[toast-in_0.25s_cubic-bezier(0.16,1,0.3,1)]",
        leaving && "translate-y-[-8px] scale-95 opacity-0 transition-all duration-150",
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <Icon className={cn("mt-0.5 size-5 shrink-0", iconColor)} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-fg">{toast.title}</p>
          {toast.description && (
            <p className="mt-1 text-sm leading-relaxed text-fg-muted">{toast.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={close}
          className="-m-1 rounded-md p-1 text-fg-subtle transition-colors hover:bg-surface-hover hover:text-fg"
          aria-label="Dismiss notification"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <div
        className={cn("h-0.5 [transform-origin:inline-start] animate-[shrink_linear_forwards]", bar)}
        style={{ animationDuration: `${toast.duration}ms` }}
      />
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
