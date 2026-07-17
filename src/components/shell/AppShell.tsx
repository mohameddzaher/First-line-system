"use client";

import { useState } from "react";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import type { CurrentUser } from "@/lib/auth";

export function AppShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="flex min-h-dvh">
      <Sidebar
        permissions={user.permissions}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} onMenuClick={() => setNavOpen(true)} />
        <main className="min-w-0 flex-1 p-4 sm:p-6">
          <div className="mx-auto max-w-[100rem] animate-[fade-in_0.2s_ease-out]">{children}</div>
        </main>
      </div>
    </div>
  );
}
