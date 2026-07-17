import { exportRoute } from "@/lib/exportFactory";
import { Vehicle } from "@/models/Vehicle";
import { vehicleSpec } from "../route";
import type { ExcelColumn } from "@/lib/excel";

export const runtime = "nodejs";

export const GET = exportRoute({
  model: Vehicle,
  resource: "fleet.vehicles",
  listSpec: vehicleSpec,
  sheetName: "Vehicles",
  titleAr: "المركبات والتفويضات",
  titleEn: "Fleet & Authorizations",
  filenameAr: "المركبات",
  filenameEn: "vehicles",
  columns: (): ExcelColumn[] => [
    { key: "plateNumber", headerAr: "رقم اللوحة", headerEn: "Plate (AR)", width: 16 },
    { key: "plateLatin", headerAr: "اللوحة لاتيني", headerEn: "Plate (Latin)", width: 14 },
    { key: "type", headerAr: "النوع", headerEn: "Type", width: 14 },
    { key: "make", headerAr: "الماركة", headerEn: "Make", width: 14 },
    { key: "makeModel", headerAr: "الطراز", headerEn: "Model", width: 16 },
    { key: "year", headerAr: "سنة الصنع", headerEn: "Year", width: 10 },
    { key: "color", headerAr: "اللون", headerEn: "Color", width: 12 },
    { key: "city", headerAr: "المدينة", headerEn: "City", width: 14 },
    { key: "serviceTier", headerAr: "الفئة", headerEn: "Tier", width: 12, value: (r) => (r.serviceTier === "express" ? "Express" : "Standard") },
    { key: "chassisNumber", headerAr: "رقم الهيكل", headerEn: "Chassis", width: 20 },
    {
      key: "authorizedTo",
      headerAr: "مُفوَّضة إلى",
      headerEn: "Authorized To",
      width: 26,
      value: (r) => (r.currentAuthorization as { employee?: { nameAr?: string } } | null)?.employee?.nameAr ?? "",
    },
    { key: "status", headerAr: "الحالة", headerEn: "Status", width: 14 },
    { key: "ownership", headerAr: "الملكية", headerEn: "Ownership", width: 14 },
    { key: "purchasePrice", headerAr: "مبلغ الشراء", headerEn: "Purchase Price", width: 14, format: "currency" },
  ],
});
