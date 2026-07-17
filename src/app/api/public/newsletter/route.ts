import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Submission } from "@/models/Submission";

export const runtime = "nodejs";

const Schema = z.object({ email: z.string().trim().toLowerCase().email() });

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "INVALID" }, { status: 422 });

  await connectDB();
  // Idempotent: one newsletter row per email.
  const existing = await Submission.findOne({ type: "newsletter", email: parsed.data.email });
  if (!existing) {
    await Submission.create({ type: "newsletter", email: parsed.data.email, status: "new" });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
