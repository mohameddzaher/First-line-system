"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AlertTriangle, Trash2, Info } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/provider";

/**
 * Promise-based confirmation. Replaces window.confirm so every destructive
 * action gets a real dialog:
 *
 *   const confirm = useConfirm();
 *   if (await confirm({ title, body, tone: "danger" })) { ...  }
 */

export type ConfirmTone = "danger" | "warning" | "info";

export interface ConfirmOptions {
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  /** Require typing this exact string to enable the confirm button. */
  requireTyping?: string;
}

type Resolver = (value: boolean) => void;

const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null);

const TONES: Record<ConfirmTone, { icon: typeof AlertTriangle; wrap: string; icon_: string }> = {
  danger: { icon: Trash2, wrap: "bg-danger-soft ring-danger/20", icon_: "text-danger" },
  warning: { icon: AlertTriangle, wrap: "bg-warning-soft ring-warning/20", icon_: "text-warning" },
  info: { icon: Info, wrap: "bg-info-soft ring-info/20", icon_: "text-info" },
};

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [typed, setTyped] = useState("");
  const resolver = useRef<Resolver | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setTyped("");
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = useCallback((result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setOptions(null);
    setTyped("");
  }, []);

  const tone = options?.tone ?? "danger";
  const { icon: Icon, wrap, icon_ } = TONES[tone];
  const gateOpen = !options?.requireTyping || typed.trim() === options.requireTyping;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={options !== null}
        onClose={() => settle(false)}
        title={options?.title ?? ""}
        size="sm"
        closeOnOverlayClick={!options?.requireTyping}
        footer={
          <>
            <Button variant="secondary" onClick={() => settle(false)}>
              {options?.cancelLabel ?? t("common.cancel")}
            </Button>
            <Button
              variant={tone === "danger" ? "danger" : "primary"}
              disabled={!gateOpen}
              onClick={() => settle(true)}
            >
              {options?.confirmLabel ?? t("common.confirm")}
            </Button>
          </>
        }
      >
        <div className="flex gap-4">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ${wrap}`}
          >
            <Icon className={`size-5 ${icon_}`} aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <p className="text-sm leading-relaxed text-fg-muted">
              {options?.body ?? t("common.deleteConfirmBody")}
            </p>
            {options?.requireTyping && (
              <div className="space-y-1.5">
                <p className="text-xs text-fg-muted">
                  <span className="font-mono font-semibold text-fg">{options.requireTyping}</span>
                </p>
                <input
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  className="h-9 w-full rounded-lg bg-surface px-3 text-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-ring focus:outline-none"
                  autoComplete="off"
                />
              </div>
            )}
          </div>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return ctx;
}
