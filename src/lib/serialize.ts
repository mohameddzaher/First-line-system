/**
 * Deep-converts Mongoose/BSON values (ObjectId, Date, Buffer) into plain JSON
 * that can cross the Server -> Client Component boundary. Next refuses to pass
 * class instances, so every list result handed to a client table runs through
 * this first.
 */
export function serialize<T>(value: T): T {
  return convert(value) as T;
}

function convert(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  if (value instanceof Date) return value.toISOString();

  // ObjectId, Decimal128, etc. expose a meaningful toString / toJSON.
  if (typeof value === "object") {
    const ctor = (value as { constructor?: { name?: string } }).constructor?.name;
    if (ctor === "ObjectId") return String(value);
    if (ctor === "Decimal128") return Number(value.toString());
    if (ctor === "Buffer") return undefined;

    if (Array.isArray(value)) return value.map(convert);

    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (key === "__v") continue;
      const converted = convert(val);
      if (converted !== undefined) out[key] = converted;
    }
    return out;
  }

  return value;
}
