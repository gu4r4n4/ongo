// src/utils/exportXlsx.ts
// Purpose: export a single insurer/program into your Excel template while
// preserving all formatting/merges.

import type { Column } from "@/hooks/useAsyncOffers";

// If you already have this mapping in your app, you can import from that file.
// These aliases normalize incoming feature keys to your canonical names.
const KEY_ALIASES: Record<string, string> = {
  // --- meta / common aliases ---
  "ONLINE ārstu konsultācijas": "ONLINE ārstu konsultācijas",
  "Laboratoriskie izmeklējumi": "Laboratoriskie izmeklējumi",
  "Fizikālā terapija": "Fizikālā terapija",
  "Physical therapy": "Fizikālā terapija",
  "Procedūras": "Procedūras",
  "Sports": "Sports",
  "Sporta ārsts": "Sporta ārsts",
  "Psychologist": "Psihoterapeits",
  "Psihologs / Psihoterapeits": "Psihoterapeits",
  "Psihoterapeits": "Psihoterapeits",
  "Homeopāts": "Homeopāts",
  "Ārstnieciskās manipulācijas": "Ārstnieciskās manipulācijas",
  "Medicīniskās izziņas": "Medicīniskās izziņas",
  "Pakalpojuma apmaksas veids": "Pakalpojuma apmaksas veids",

  // diagnostics
  "Maksas diagnostika": "Maksas diagnostika, piem., rentgens, elektrokradiogramma, USG, utml.",

  // high-tech variants → canonical
  "Augsto tehnoloģiju izmeklējumi":
    "Augsto tehnoloģiju izmeklējumi, piem., MR, CT, limits, ja ir (reižu skaits vai EUR)",
  "Augsto tehnoloģiju izmeklējumi, piem., MR, CT, limits (reižu skaits vai EUR)":
    "Augsto tehnoloģiju izmeklējumi, piem., MR, CT, limits, ja ir (reižu skaits vai EUR)",
  "Augsto tehnoloģiju izmeklējumi, piem., MRT, CT, limits, ja ir (reižu skaits vai EUR)":
    "Augsto tehnoloģiju izmeklējumi, piem., MR, CT, limits, ja ir (reižu skaits vai EUR)",
  "MR": "Augsto tehnoloģiju izmeklējumi, piem., MR, CT, limits, ja ir (reižu skaits vai EUR)",
  "MRT": "Augsto tehnoloģiju izmeklējumi, piem., MR, CT, limits, ja ir (reižu skaits vai EUR)",
  "CT": "Augsto tehnoloģiju izmeklējumi, piem., MR, CT, limits, ja ir (reižu skaits vai EUR)",

  // add-ons
  "Zobārstniecība ar 50% atlaidi (pamatpolise)": "Zobārstniecība ar 50% atlaidi (pamatpolise)",
  "Zobārstniecība ar 50% atlaidi (pp)": "Zobārstniecība ar 50% atlaidi (pp)",
  "Zobārstniecība ar 50% atlaidi": "Zobārstniecība ar 50% atlaidi",
  "Vakcinācija pret ērcēm un gripu": "Vakcinācija pret ērcēm un gripu",
  "Ambulatorā rehabilitācija (pp)": "Ambulatorā rehabilitācija (pp)",
  "Medikamenti ar 50% atlaidi": "Medikamenti ar 50% atlaidi",
  "Kritiskās saslimšanas": "Kritiskās saslimšanas",
  "Maksas stacionārie pakalpojumi, limits EUR (pp)":
    "Maksas stacionārie pakalpojumi, limits EUR",
  "Optika 50%, limits EUR": "Optika 50%, limits EUR",
};

const TEMPLATE_LABELS: Record<string, string> = {
  // Column A labels EXACTLY as they appear in the template (sheet "Лист1")
  "Pakalpojuma apmaksas veids": "Pakalpojuma apmaksas veids", // row 8
  "Apdrošinājuma summa pamatpolisei, EUR": "Apdrošinājuma summa pamatpolisei, EUR", // row 9
  "Pacientu iemaksa": "Pacientu iemaksa",
  "Maksas ģimenes ārsta mājas vizītes, limits EUR": "Maksas ģimenes ārsta mājas vizītes, imits EUR",
  "Maksas ģimenes ārsta, internista, terapeita un pediatra konsultācija, limits EUR":
    "Maksas ģimenes ārsta, internista, terapeita un pediatra konsultācija, imits EUR",
  "Maksas ārsta-specialista konsultācija, limits EUR":
    "Maksas ārsta-specialista konsultācija, imits EUR",
  "Profesora, docenta, internista konsultācija, limits EUR":
    "Profesora, docenta, konsultācija, imits EUR",
  "Homeopāts": " Homeopāts",
  "Psihoterapeits": "  Psihoterapeits (vai mentāla veselība)",
  "Sporta ārsts": "Sporta ārsts",
  "ONLINE ārstu konsultācijas": "ONLINE ārstu konsultācijas",
  "Laboratoriskie izmeklējumi": "Laboratoriskie izmeklējumi",
  "Maksas diagnostika, piem., rentgens, elektrokradiogramma, USG, utml.":
    "Maksas diagnostika, piem., rentgens, elektrokradiogramma, USG, utml.",
  "Augsto tehnoloģiju izmeklējumi, piem., MR, CT, limits, ja ir (reižu skaits vai EUR)":
    "Augsto tehnoloģiju izmeklējumi, piem., MRT, CT, limits, ja ir (reižu skaits vai EUR)",
  "Obligātās veselības pārbaudes, limits EUR": "Obligātās veselības pārbaudes, limits EUR",
  "Ārstnieciskās manipulācijas": "Ārstnieciskās manipulācijas",
  "Medicīniskās izziņas": "Medicīniskās izziņas",
  "Fizikālā terapija": "Fizikālā terapija",
  "Procedūras": "Procedūras",
  "Vakcinācija, limits EUR": "Vakcinācija, limits EUR",
  "Maksas grūtnieču aprūpe": "Maksas grūtnieču aprūpe",
  "Maksas onkoloģiskā, hematoloģiskā ārstēšana":
    "Maksas onkoloģiskā, hematoloģiskā ārstēšana",
  "Neatliekamā palīdzība valsts un privātā (limits privātai, EUR)":
    "Neatliekamā palīdzība valsts un privātā (limits privātai, EUR)",
  "Maksas stacionārie pakalpojumi, limits EUR": "Maksas stacionārie pakalpojumi, limits EUR",
  "Maksas stacionārā rehabilitācija, limits EUR":
    "Maksas stacionārā rehabilitācija, limits EUR",
  "Ambulatorā rehabilitācija": "Ambulatorā rehabilitācija",
  // addons block
  "Zobārstniecība ar 50% atlaidi (pamatpolise)": "Zobārstniecība ar 50% atlaidi",
  "Zobārstniecība ar 50% atlaidi (pp)": "Zobārstniecība ar 50% atlaidi",
  "Vakcinācija pret ērcēm un gripu": "Vakcinācija pret ērcēm un gripu",
  "Ambulatorā rehabilitācija (pp)": "Ambulatorā rehabilitācija",
  "Medikamenti ar 50% atlaidi": "Medikamenti ar 50% atlaidi",
  "Sports": "Sports",
  "Kritiskās saslimšanas": "Kritiskās saslimšanas",
  "Optika 50%, limits EUR": "Optika 50%, limits EUR",
};

// Template sheet + rows where we write other meta:
const TEMPLATE_SHEET_NAME = "Лист1";
const HEADER_COMPANY_CELL = "B3";               // “Uzņēmums: …”
const HEADER_EMPLOYEES_CELL = "B4";             // “Nodarbināto skaits: …”
const HEADER_INSURER_CELL = "B6";               // Column title with insurer (kept simple)
const PROGRAM_CODE_CELL = "B7";                 // Programmas nosaukums
const PREMIUM_ROW_LABEL = "Prēmija (EUR)";      // row with premium
const PAYMENT_METHOD_LABEL = "Pakalpojuma apmaksas veids";

function canonicalKey(raw: string): string {
  return KEY_ALIASES[raw] || raw;
}

function paymentMethodLabel(v?: string | null): string {
  if (!v) return "—";
  const MAP: Record<string, string> = {
    monthly: "Cenrāža programma",
    quarterly: "100% apmaksa līgumiestādēs",
    yearly: "100% apmaksa līgumiestādēs un ja pakalpojums ir nopirkts",
    "one-time": "Procentuāla programma",
  };
  return MAP[v] || v;
}

function formatValueForCell(value: any): string | number {
  // Accept { value: ... } or booleans or strings/numbers
  let v = value && typeof value === "object" && "value" in value ? value.value : value;

  if (v === true) return "v";
  if (v === false || v === null || v === undefined || String(v).trim() === "") return "-";

  // Keep numbers as numbers so Excel can format them
  if (typeof v === "number") return v;

  const s = String(v).trim();
  if (s === "✓" || s.toLowerCase() === "yes" || s.toLowerCase() === "v") return "v";
  if (s === "-" || s.toLowerCase() === "no") return "-";
  return s;
}

// Find a row by exact label in Column A (between rows 6..52)
function findRowByLabel(sheet: any, labelA: string): number | null {
  // labels in template are between 6 and ~52
  for (let r = 6; r <= 60; r++) {
    const val = sheet.cell(r, 1).value();
    if (typeof val === "string" && val.trim() === labelA.trim()) return r;
  }
  return null;
}

type ExportOptions = {
  templateUrl?: string; // default '/xlsx/health-offer-template.xlsx'
  companyName?: string;
  employeesCount?: number;
  fileName?: string; // override default file name
};

// Helper function to populate a single sheet with column data
function populateSheetWithInsurerOffer(
  sheet: any,
  column: Column,
  opts: ExportOptions = {}
) {
  // 1) Header: company + employees
  if (opts.companyName) sheet.cell(HEADER_COMPANY_CELL).value(`Uzņēmums: ${opts.companyName}`);
  if (typeof opts.employeesCount === "number") {
    sheet
      .cell(HEADER_EMPLOYEES_CELL)
      .value(`Nodarbināto skaits: ${opts.employeesCount}`);
  }

  // 2) Column header + program code
  sheet.cell(HEADER_INSURER_CELL).value((column.insurer || "").toUpperCase());
  sheet.cell(PROGRAM_CODE_CELL).value(column.program_code || "");

  // 3) Payment method / base sum / premium
  const payRow = findRowByLabel(sheet, PAYMENT_METHOD_LABEL);
  if (payRow) sheet.cell(payRow, 2).value(paymentMethodLabel(column.payment_method));

  const baseRow = findRowByLabel(sheet, "Apdrošinājuma summa pamatpolisei, EUR");
  if (baseRow) sheet.cell(baseRow, 2).value(formatValueForCell(column.base_sum_eur));

  // "Prēmija (EUR)" row is in the template (single value)
  const premiumRow = findRowByLabel(sheet, PREMIUM_ROW_LABEL);
  if (premiumRow) sheet.cell(premiumRow, 2).value(formatValueForCell(column.premium_eur));

  // 4) Feature rows
  const features = column.features || {};
  const getFeature = (key: string) => {
    // normalize incoming feature names
    if (key in features) return features[key];
    const canon = canonicalKey(key);
    if (canon in features) return features[canon];
    // fallback: scan features and compare canonically
    for (const [raw, v] of Object.entries(features)) {
      if (canonicalKey(raw) === key) return v;
    }
    return undefined;
  };

  for (const [canonical, labelInTemplate] of Object.entries(TEMPLATE_LABELS)) {
    const row = findRowByLabel(sheet, labelInTemplate);
    if (!row) continue;
    const val = getFeature(canonical);
    if (val === undefined) continue;
    sheet.cell(row, 2).value(formatValueForCell(val));
  }
}

// Export ALL columns into one Excel file with multiple sheets
export async function exportAllInsurerOffersXlsx(
  columns: Column[],
  opts: ExportOptions = {}
) {
  if (!columns || columns.length === 0) {
    throw new Error("No columns to export");
  }

  const templateUrl = opts.templateUrl || "/xlsx/health-offer-template.xlsx";
  const XlsxPopulate = (await import("xlsx-populate/browser/xlsx-populate")).default;

  // 1) Load template
  const ab = await fetch(templateUrl, { cache: "no-store" }).then((r) => {
    if (!r.ok) throw new Error(`Failed to load template: ${r.status}`);
    return r.arrayBuffer();
  });
  const workbook = await XlsxPopulate.fromDataAsync(ab);

  // 2) Process first column using existing template sheet
  const firstSheet = workbook.sheet(TEMPLATE_SHEET_NAME);
  const firstColumn = columns[0];
  populateSheetWithInsurerOffer(firstSheet, firstColumn, opts);
  
  // Rename first sheet
  const firstName = `${firstColumn.insurer || "Ins"}-${firstColumn.program_code || "Prog"}`
    .replace(/[^\w.-]+/g, "_")
    .substring(0, 31); // Excel sheet name limit
  firstSheet.name(firstName);

  // 3) For remaining columns, copy template and populate
  for (let i = 1; i < columns.length; i++) {
    const column = columns[i];
    
    // Copy the first sheet as template
    const newSheet = firstSheet.copyTo(workbook);
    
    // Generate unique sheet name
    const sheetName = `${column.insurer || "Ins"}-${column.program_code || "Prog"}`
      .replace(/[^\w.-]+/g, "_")
      .substring(0, 31);
    newSheet.name(sheetName);
    
    // Populate with column data
    populateSheetWithInsurerOffer(newSheet, column, opts);
  }

  // 4) Produce XLSX and trigger download
  const out = await workbook.outputAsync();
  const blob = new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const fileName =
    opts.fileName ||
    `${opts.companyName || "Insurance"}_Comparison_${new Date().toISOString().split('T')[0]}.xlsx`;

  // Try open in new tab
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank", "noopener,noreferrer");

  // Fallback: trigger download if popup blocked
  if (!win) {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // Clean up later
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// NOTE: This exports ONE insurer/program (one Column from your matrix)
export async function exportInsurerOfferXlsx(
  column: Column,
  opts: ExportOptions = {}
) {
  const templateUrl = opts.templateUrl || "/xlsx/health-offer-template.xlsx";
  const XlsxPopulate = (await import("xlsx-populate/browser/xlsx-populate")).default;

  // 1) Load template
  const ab = await fetch(templateUrl, { cache: "no-store" }).then((r) => {
    if (!r.ok) throw new Error(`Failed to load template: ${r.status}`);
    return r.arrayBuffer();
  });
  const workbook = await XlsxPopulate.fromDataAsync(ab);
  const sheet = workbook.sheet(TEMPLATE_SHEET_NAME);

  // 2) Populate sheet with column data
  populateSheetWithInsurerOffer(sheet, column, opts);

  // 3) Produce XLSX and open in new tab (and also download fallback)
  const out = await workbook.outputAsync();
  const blob = new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const fileName =
    opts.fileName ||
    `${(column.insurer || "Insurer")}-${(column.program_code || "Program")
      .toString()
      .replace(/[^\w.-]+/g, "_")}.xlsx`;

  // Try open in new tab
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank", "noopener,noreferrer");

  // Fallback: trigger download if popup blocked
  if (!win) {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // Clean up later
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
