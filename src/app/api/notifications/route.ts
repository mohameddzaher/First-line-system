import { guard, ok } from "@/lib/api";
import { Notification } from "@/models/Notification";

export const runtime = "nodejs";

/** The signed-in user's latest notifications + unread count. */
export const GET = guard({ authOnly: true }, async ({ user }) => {
  const [rows, unread] = await Promise.all([
    Notification.find({ user: user.id }).sort({ createdAt: -1 }).limit(30).lean(),
    Notification.countDocuments({ user: user.id, read: false }),
  ]);
  return ok({ rows, unread });
});
