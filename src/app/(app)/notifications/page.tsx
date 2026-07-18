import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getLocale } from "@/i18n/server";
import { Notification } from "@/models/Notification";
import { serialize } from "@/lib/serialize";
import { NotificationsClient } from "./NotificationsClient";

export const metadata: Metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireUser();
  await connectDB();
  const [locale, rows, unread] = await Promise.all([
    getLocale(),
    // The bell shows the latest 30; this page is the full history.
    Notification.find({ user: user.id }).sort({ createdAt: -1 }).limit(200).lean(),
    Notification.countDocuments({ user: user.id, read: false }),
  ]);

  return (
    <NotificationsClient
      locale={locale}
      rows={serialize(rows) as never}
      unread={unread}
    />
  );
}
