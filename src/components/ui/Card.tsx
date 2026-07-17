import Link from "next/link";
import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  href,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { href?: string }) {
  const cls = cn("rounded-xl bg-surface ring-1 ring-border shadow-card", className);
  // A card with an href becomes a link to its drill-down page and lifts on hover.
  if (href) {
    return (
      <Link href={href} className={cn(cls, "block transition-all hover:-translate-y-0.5 hover:shadow-raised hover:ring-primary/30")}>
        {children}
      </Link>
    );
  }
  return (
    <div className={cls} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-fg">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-fg-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {icon && (
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-bg-subtle text-fg-subtle ring-1 ring-border">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-fg">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-fg-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
