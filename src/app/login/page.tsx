import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/app/login/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const { next } = await searchParams;
  // Only accept same-origin paths — an absolute URL here would be an open redirect.
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-primary lg:block">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
          aria-hidden
        />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary-fg/10 text-base font-bold text-primary-fg ring-1 ring-primary-fg/20">
              FL
            </span>
            <span className="text-lg font-semibold text-primary-fg">First Line</span>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl leading-tight font-bold text-primary-fg">
              Logistics that moves
              <span className="block text-accent">the Kingdom forward</span>
            </h1>
            <p className="mt-5 leading-relaxed text-primary-fg/70">
              Over 1,500 riders and drivers delivering across Saudi Arabia — one platform for
              people, fleet, and operations.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 border-t border-primary-fg/15 pt-8">
            {[
              { value: "1,500+", label: "Riders & Drivers" },
              { value: "20+", label: "Cities" },
              { value: "24/7", label: "Operations" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-accent tabular">{stat.value}</p>
                <p className="mt-1 text-xs text-primary-fg/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-bg-subtle p-6 sm:p-12">
        <LoginForm next={safeNext} />
      </div>
    </div>
  );
}
