import "server-only";
import type { Model } from "mongoose";
import { z } from "zod";
import { guard, ok, readBody } from "@/lib/api";
import { writeAudit, diff } from "@/lib/audit";
import { runListQuery, type ListSpec } from "@/lib/listQuery";
import { parseListQuery } from "@/lib/query";
import type { CurrentUser } from "@/lib/auth";

interface CrudConfig<T> {
  model: Model<T>;
  /** Dotted resource path for permissions and audit, e.g. "hr.licenses". */
  resource: string;
  listSpec: ListSpec<T>;
  createSchema: z.ZodType;
  updateSchema: z.ZodType;
  /** Builds the human label stored in the audit trail. */
  label: (doc: Record<string, unknown>) => string;
  /** Stamp derived fields / run side effects before create or update saves. */
  beforeWrite?: (
    data: Record<string, unknown>,
    ctx: { user: CurrentUser; existing?: Record<string, unknown> },
  ) => Promise<Record<string, unknown>> | Record<string, unknown>;
  afterWrite?: (
    doc: Record<string, unknown>,
    ctx: { user: CurrentUser; action: "create" | "update" },
  ) => Promise<void> | void;
  afterDelete?: (doc: Record<string, unknown>, ctx: { user: CurrentUser }) => Promise<void> | void;
}

/**
 * Generates GET (list) + POST (create) handlers for a resource. Every simple HR
 * entity (leave types, licenses, tasks, ...) shares this, so search/filter/sort/
 * paginate, validation, and audit are identical and defined once.
 */
export function collectionRoute<T>(config: CrudConfig<T>) {
  const GET = guard({ permission: `${config.resource}:read` }, async ({ request }) => {
    const query = parseListQuery(new URL(request.url).searchParams);
    const result = await runListQuery(config.model, query, config.listSpec);
    return ok(result);
  });

  const POST = guard({ permission: `${config.resource}:create` }, async ({ request, user }) => {
    let data = (await readBody(request, config.createSchema)) as Record<string, unknown>;
    if (config.beforeWrite) data = await config.beforeWrite(data, { user });
    data.createdBy = user.id;

    const created = await config.model.create(data as never);
    const json = (created as { toObject: () => Record<string, unknown> }).toObject();

    await writeAudit({
      actor: user,
      action: "create",
      resource: config.resource,
      resourceId: String(json._id),
      resourceLabel: config.label(json),
    });
    if (config.afterWrite) await config.afterWrite(json, { user, action: "create" });

    return ok(json, 201);
  });

  return { GET, POST };
}

/** Generates GET (one) + PATCH (update) + DELETE handlers keyed by [id]. */
export function itemRoute<T>(config: CrudConfig<T>) {
  const GET = guard({ permission: `${config.resource}:read` }, async ({ params }) => {
    let q = config.model.findById(params.id);
    if (config.listSpec.populate) q = q.populate(config.listSpec.populate as string);
    const doc = await q.lean();
    if (!doc) return ok({ error: "NOT_FOUND" }, 404);
    return ok(doc);
  });

  const PATCH = guard({ permission: `${config.resource}:update` }, async ({ request, params, user }) => {
    const existing = await config.model.findById(params.id);
    if (!existing) return ok({ error: "NOT_FOUND" }, 404);

    const before = (existing as { toObject: () => Record<string, unknown> }).toObject();
    let data = (await readBody(request, config.updateSchema)) as Record<string, unknown>;
    if (config.beforeWrite) data = await config.beforeWrite(data, { user, existing: before });

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) (existing as unknown as Record<string, unknown>)[key] = value;
    }
    await existing.save();

    const after = (existing as { toObject: () => Record<string, unknown> }).toObject();
    await writeAudit({
      actor: user,
      action: "update",
      resource: config.resource,
      resourceId: String(after._id),
      resourceLabel: config.label(after),
      changes: diff(before, after),
    });
    if (config.afterWrite) await config.afterWrite(after, { user, action: "update" });

    return ok(after);
  });

  const DELETE = guard({ permission: `${config.resource}:delete` }, async ({ params, user }) => {
    const existing = await config.model.findById(params.id);
    if (!existing) return ok({ error: "NOT_FOUND" }, 404);

    const json = (existing as { toObject: () => Record<string, unknown> }).toObject();
    await existing.deleteOne();

    await writeAudit({
      actor: user,
      action: "delete",
      resource: config.resource,
      resourceId: String(json._id),
      resourceLabel: config.label(json),
    });
    if (config.afterDelete) await config.afterDelete(json, { user });

    return ok({ ok: true });
  });

  return { GET, PATCH, DELETE };
}
