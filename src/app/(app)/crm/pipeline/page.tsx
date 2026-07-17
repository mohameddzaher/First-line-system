import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { getLocale } from "@/i18n/server";
import { connectDB } from "@/lib/db";
import { Deal } from "@/models/Deal";
import { serialize } from "@/lib/serialize";
import { PipelineBoard, type PipelineDeal } from "./PipelineBoard";

export const metadata: Metadata = { title: "Pipeline" };
export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  await requirePermission("crm.deals:read");
  await connectDB();
  const locale = await getLocale();

  const deals = await Deal.find({})
    .populate("company", "name nameAr")
    .populate("owner", "firstName lastName")
    .sort({ value: -1 })
    .lean();

  return <PipelineBoard locale={locale} deals={serialize(deals) as unknown as PipelineDeal[]} />;
}
