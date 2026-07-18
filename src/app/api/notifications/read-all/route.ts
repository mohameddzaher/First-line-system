import { guard, ok } from "@/lib/api";
import { Notification } from "@/models/Notification";

export const runtime = "nodejs";

/** Marks all of the signed-in user's notifications as read. */
export const POST = guard({ authOnly: true }, async ({ user }) => {
  await Notification.updateMany({ user: user.id, read: false }, { $set: { read: true } });
  return ok({ ok: true });
});
