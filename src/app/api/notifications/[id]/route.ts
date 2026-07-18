import { guard, ok, readBody } from "@/lib/api";
import { Notification } from "@/models/Notification";
import { z } from "zod";

export const runtime = "nodejs";

const ReadSchema = z.object({ read: z.boolean() });

/**
 * Toggles the read flag on one notification. The filter is scoped by `user` as
 * well as `_id`, so a caller can never flip somebody else's notification by
 * guessing its id.
 */
export const PATCH = guard({ authOnly: true }, async ({ request, params, user }) => {
  const body = await readBody(request, ReadSchema);
  const updated = await Notification.findOneAndUpdate(
    { _id: params.id, user: user.id },
    { $set: { read: body.read } },
    { new: true },
  ).lean();
  if (!updated) return ok({ error: "NOT_FOUND" }, 404);
  return ok(updated);
});

/** Deletes one of the caller's own notifications. */
export const DELETE = guard({ authOnly: true }, async ({ params, user }) => {
  const removed = await Notification.findOneAndDelete({ _id: params.id, user: user.id }).lean();
  if (!removed) return ok({ error: "NOT_FOUND" }, 404);
  return ok({ ok: true });
});
