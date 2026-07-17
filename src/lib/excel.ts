import "server-only";
import ExcelJS from "exceljs";
import type { Locale } from "@/i18n/dictionaries";
import { formatDate, formatDateTime } from "@/lib/utils";

export interface ExcelColumn<T = Record<string, unknown>> {
  key: string;
  headerAr: string;
  headerEn: string;
  width?: number;
  /** How the raw record becomes a cell value. Defaults to the field at `key`. */
  value?: (row: T) => unknown;
  format?: "text" | "number" | "currency" | "date" | "datetime";
}

export interface ExcelOptions {
  locale: Locale;
  sheetName: string;
  title: string;
  /** Rendered under the title so the file records what was filtered. */
  filterSummary?: string[];
  generatedBy?: string;
}

/**
 * Builds a styled workbook. Sheets are RTL when the UI locale is Arabic so the
 * exported file opens the way the user was reading it.
 */
export async function buildExcel<T extends Record<string, unknown>>(
  rows: T[],
  columns: ExcelColumn<T>[],
  options: ExcelOptions,
): Promise<Buffer> {
  const isAr = options.locale === "ar";
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "First Line";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(options.sheetName.slice(0, 31), {
    views: [{ rightToLeft: isAr, state: "frozen", ySplit: options.filterSummary?.length ? 4 : 3 }],
  });

  const lastCol = columns.length;

  // Title row
  sheet.mergeCells(1, 1, 1, lastCol);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = options.title;
  titleCell.font = { size: 14, bold: true, color: { argb: "FF16233D" } };
  titleCell.alignment = { horizontal: isAr ? "right" : "left", vertical: "middle" };
  sheet.getRow(1).height = 26;

  // Metadata row: when it was generated, by whom, and what filters were on.
  sheet.mergeCells(2, 1, 2, lastCol);
  const metaParts = [
    isAr ? `تاريخ التصدير: ${formatDateTime(new Date())}` : `Exported: ${formatDateTime(new Date())}`,
    options.generatedBy
      ? isAr
        ? `بواسطة: ${options.generatedBy}`
        : `By: ${options.generatedBy}`
      : null,
    isAr ? `عدد السجلات: ${rows.length}` : `Records: ${rows.length}`,
    ...(options.filterSummary ?? []),
  ].filter(Boolean);
  const metaCell = sheet.getCell(2, 1);
  metaCell.value = metaParts.join("   •   ");
  metaCell.font = { size: 9, color: { argb: "FF6B7280" } };
  metaCell.alignment = { horizontal: isAr ? "right" : "left", vertical: "middle" };

  const headerRowIndex = 3;
  const headerRow = sheet.getRow(headerRowIndex);
  headerRow.values = columns.map((c) => (isAr ? c.headerAr : c.headerEn));
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF16233D" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin", color: { argb: "FF16233D" } },
      bottom: { style: "thin", color: { argb: "FF16233D" } },
      left: { style: "thin", color: { argb: "FF2A3B5C" } },
      right: { style: "thin", color: { argb: "FF2A3B5C" } },
    };
  });

  columns.forEach((col, i) => {
    sheet.getColumn(i + 1).width = col.width ?? 20;
  });

  for (const [index, row] of rows.entries()) {
    const values = columns.map((col) => {
      const raw = col.value ? col.value(row) : row[col.key];
      return toCellValue(raw, col.format);
    });
    const excelRow = sheet.addRow(values);
    excelRow.eachCell((cell, colNumber) => {
      const col = columns[colNumber - 1];
      cell.alignment = {
        horizontal: col?.format === "number" || col?.format === "currency" ? "right" : isAr ? "right" : "left",
        vertical: "middle",
      };
      cell.font = { size: 10 };
      if (index % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7F8FA" } };
      }
      cell.border = {
        bottom: { style: "hair", color: { argb: "FFE3E6EC" } },
      };
      if (col?.format === "currency") cell.numFmt = "#,##0.00";
      if (col?.format === "number") cell.numFmt = "#,##0";
    });
  }

  sheet.autoFilter = {
    from: { row: headerRowIndex, column: 1 },
    to: { row: headerRowIndex + rows.length, column: lastCol },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function toCellValue(raw: unknown, format?: ExcelColumn["format"]): string | number | null {
  if (raw === null || raw === undefined || raw === "") return format === "number" || format === "currency" ? 0 : "";

  switch (format) {
    case "date":
      return formatDate(raw as Date);
    case "datetime":
      return formatDateTime(raw as Date);
    case "number":
    case "currency": {
      const n = Number(raw);
      return Number.isFinite(n) ? n : 0;
    }
    default:
      if (raw instanceof Date) return formatDate(raw);
      if (typeof raw === "boolean") return raw ? "Yes" : "No";
      if (typeof raw === "object") return String(raw);
      return String(raw);
  }
}

/** RFC 5987 filename so Arabic report names survive the download header. */
export function excelHeaders(filename: string): Record<string, string> {
  const safe = filename.replace(/[^\w\-. ]/g, "_");
  return {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": `attachment; filename="${safe}.xlsx"; filename*=UTF-8''${encodeURIComponent(filename)}.xlsx`,
    "Cache-Control": "no-store",
  };
}
