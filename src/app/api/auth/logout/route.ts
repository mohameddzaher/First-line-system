import { NextResponse } from "next/server";
import { destroySessionCookie, getCurrentUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST() {
  const user = await getCurrentUser();

  if (user) {
    await writeAudit({
      actor: user,
      action: "logout",
      resource: "admin.users",
      resourceId: user.id,
      resourceLabel: user.email,
    });
  }

  await destroySessionCookie();
  return NextResponse.json({ ok: true });
}
