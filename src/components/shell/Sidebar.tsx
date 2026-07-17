"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Truck,
  Shield,
  UserCircle,
  ShoppingCart,
  Building2,
  TrendingUp,
  Globe,
  Settings,
  Boxes,
  ChevronDown,
  X,
} from "lucide-react";
import { NAVIGATION, type NavGroup } from "@/config/navigation";
import { useI18n } from "@/i18n/provider";
import { can } from "@/lib/rbac";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof LayoutDashboard> = {
  LayoutDashboard,
  Users,
  Truck,
  Shield,
  UserCircle,
  ShoppingCart,
  Building2,
  TrendingUp,
  Globe,
  Settings,
  Boxes,
};

export function Sidebar({
  permissions,
  open,
  onClose,
}: {
  permissions: string[];
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const pathname = usePathname();

  // Drop groups the user can't use at all, and items they can't open.
  const groups = useMemo(() => {
    return NAVIGATION.map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => item.always || (item.permission && can(permissions, item.permission)),
      ),
    })).filter((group) => group.items.length > 0);
  }, [permissions]);

  // Exactly one item is active: the one whose href is the LONGEST prefix of the
  // current path. Without this, a section root like "/hr" would also light up on
  // every "/hr/*" child, leaving several items highlighted at once.
  const activeHref = useMemo(() => {
    let best = "";
    for (const g of groups) {
      for (const i of g.items) {
        if ((pathname === i.href || pathname.startsWith(`${i.href}/`)) && i.href.length > best.length) {
          best = i.href;
        }
      }
    }
    return best;
  }, [groups, pathname]);

  const activeGroupId = useMemo(
    () => groups.find((g) => g.items.some((i) => i.href === activeHref))?.id,
    [groups, activeHref],
  );

  // The group containing the current page starts open; the rest stay collapsed.
  const [expanded, setExpanded] = useState<string[]>(() =>
    activeGroupId ? [activeGroupId] : [],
  );

  useEffect(() => {
    if (activeGroupId) {
      setExpanded((prev) => (prev.includes(activeGroupId) ? prev : [...prev, activeGroupId]));
    }
  }, [activeGroupId]);

  // Navigating on mobile should dismiss the drawer.
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggle = (id: string) =>
    setExpanded((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));

  return (
    <>
      {/* Mobile scrim */}
      <div
        onClick={onClose}
        aria-hidden
        className={cn(
          "fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-[2px] transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        aria-label="Main navigation"
        className={cn(
          "fixed inset-y-0 start-0 z-40 flex w-72 flex-col bg-surface ring-1 ring-border transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:h-dvh",
          // Desktop (lg+): always in place. The mobile slide transforms are scoped
          // to max-lg so they never conflict with the desktop position — otherwise
          // the RTL "hide" transform wins by source order and pushes it off-screen.
          "lg:translate-x-0",
          open
            ? "max-lg:translate-x-0"
            : "max-lg:ltr:-translate-x-full max-lg:rtl:translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
          <Link href="/dashboard" className="flex items-center gap-2.5 rounded-lg">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-fg">
              FL
            </span>
            <span className="text-sm font-semibold text-fg">{t("app.name")}</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="-me-1 rounded-lg p-1.5 text-fg-subtle hover:bg-surface-hover hover:text-fg lg:hidden"
            aria-label={t("common.close")}
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {groups.map((group) => (
              <SidebarGroup
                key={group.id}
                group={group}
                expanded={expanded.includes(group.id)}
                onToggle={() => toggle(group.id)}
                activeHref={activeHref}
              />
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}

function SidebarGroup({
  group,
  expanded,
  onToggle,
  activeHref,
}: {
  group: NavGroup;
  expanded: boolean;
  onToggle: () => void;
  activeHref: string;
}) {
  const { t } = useI18n();
  const Icon = ICONS[group.icon] ?? LayoutDashboard;
  const hasActive = group.items.some((i) => i.href === activeHref);

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          hasActive && !expanded
            ? "bg-primary/8 text-primary"
            : "text-fg-muted hover:bg-surface-hover hover:text-fg",
        )}
      >
        <Icon className="size-4.5 shrink-0" aria-hidden />
        <span className="flex-1 text-start">{t(group.labelKey)}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-fg-subtle transition-transform duration-200",
            expanded && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {/* Grid-rows trick animates to auto height without measuring. */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <ul className="mt-1 space-y-0.5 border-s border-border ps-3 ms-6">
            {group.items.map((item) => {
              const active = item.href === activeHref;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-primary text-primary-fg font-medium shadow-sm"
                        : "text-fg-muted hover:bg-surface-hover hover:text-fg",
                    )}
                  >
                    {t(item.labelKey)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </li>
  );
}
