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
    "Maksas stacionārie pakalpojumi, limits EUR (pp)",
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
  "Maksas stacionārie pakalpojumi, limits EUR (pp)": "Maksas stacionārie pakalpojumi, limits EUR (pp)",
  "Maksas stacionārā rehabilitācija, limits EUR":
    "Maksas stacionārā rehabilitācija, limits EUR",
  "Ambulatorā rehabilitācija": "Ambulatorā rehabilitācija",
  // Note: Premium row is handled separately in the populate functions
  // Plastic card surcharge (row 42)
  "Piemaksa par plastikāta kartēm, EUR": "Piemaksa par plastikāta kartēm, EUR",
  // Additional programs section (rows 45-57)
  "Zobārstniecība ar 50% atalidi, limits 150 EUR": "Zobārstniecība ar 50% atalidi, limits 150 EUR",
  "Zobārstniecība ar 50% atalidi, limits 200 EUR": "Zobārstniecība ar 50% atalidi, limits 200 EUR",
  "Vakcinācija pret ērčiem un gripu": "Vakcinācija pret ērčiem un gripu",
  "Vakcinācija jebkura": "Vakcinācija jebkura",
  "Fizikālās terapijas procedūras, limits 10 reizes, 100% vai limits, EUR": "Fizikālās terapijas procedūras, limits 10 reizes, 100% vai limits, EUR",
  "Maksas grūtnieču aprūpem limits EUR": "Maksas grūtnieču aprūpem limits EUR",
  "Ambulatorā rehabilitācija, limtis EUR": "Ambulatorā rehabilitācija, limtis EUR",
  "Medikamenti ar 50% atlaidi, limits EUR": "Medikamenti ar 50% atlaidi, limits EUR",
  "Sports, limits X reizes mēnesī, limits EUR gadā": "Sports, limits X reizes mēnesī, limits EUR gadā",
  "Kristiskās saslimšanas, limits EUR": "Kristiskās saslimšanas, limits EUR",
  "Maksas operācijas, limits EUR": "Maksas operācijas, limits EUR",
  "Optika 50%, limits EUR": "Optika 50%, limits EUR",
  // Legacy addon mappings (for backward compatibility)
  "Zobārstniecība ar 50% atlaidi (pamatpolise)": "Zobārstniecība ar 50% atalidi, limits 150 EUR",
  "Zobārstniecība ar 50% atlaidi (pp)": "Zobārstniecība ar 50% atalidi, limits 200 EUR",
  "Vakcinācija pret ērcēm un gripu": "Vakcinācija pret ērčiem un gripu",
  "Ambulatorā rehabilitācija (pp)": "Ambulatorā rehabilitācija, limtis EUR",
  "Medikamenti ar 50% atlaidi": "Medikamenti ar 50% atlaidi, limits EUR",
  "Sports": "Sports, limits X reizes mēnesī, limits EUR gadā",
  "Kritiskās saslimšanas": "Kristiskās saslimšanas, limits EUR",
  "Maksas Operācijas, limits EUR": "Maksas operācijas, limits EUR",
};

// Template sheet + rows where we write other meta:
const TEMPLATE_SHEET_NAME = "Лист1";
const HEADER_COMPANY_CELL = "B3";               // “Uzņēmums: …”
const HEADER_EMPLOYEES_CELL = "B4";             // “Nodarbināto skaits: …”
const HEADER_INSURER_CELL = "B6";               // Column title with insurer (kept simple)
const PROGRAM_CODE_CELL = "B7";                 // Programmas nosaukums
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

  // Premium row in template is "Pamatpolises prēmija 1 darbiniekam, EUR"
  const premiumRow = findRowByLabel(sheet, "Pamatpolises prēmija 1 darbiniekam, EUR");
  if (premiumRow) {
    sheet.cell(premiumRow, 2).value(formatValueForCell(column.premium_eur));
    sheet.cell(premiumRow, 2).style("fontColor", "000000"); // Black text
  }

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
    const cell = sheet.cell(row, 2);
    cell.value(formatValueForCell(val));
    cell.style("fontColor", "000000"); // Black text
  }
}

// Export ALL columns into ONE sheet with multiple columns (one per insurer)
export async function exportAllInsurerOffersXlsx(
  columns: Column[],
  opts: ExportOptions = {}
) {
  console.log("exportAllInsurerOffersXlsx called with", columns.length, "columns");
  
  if (!columns || columns.length === 0) {
    throw new Error("No columns to export");
  }

  const templateUrl = opts.templateUrl || "/xlsx/health-offer-template.xlsx";
  console.log("Loading template from:", templateUrl);
  
  const XlsxPopulate = (await import("xlsx-populate/browser/xlsx-populate")).default;

  // 1) Load template
  const ab = await fetch(templateUrl, { cache: "no-store" }).then((r) => {
    console.log("Template fetch response:", r.status);
    if (!r.ok) throw new Error(`Failed to load template: ${r.status}`);
    return r.arrayBuffer();
  });
  console.log("Template loaded, size:", ab.byteLength, "bytes");
  
  const workbook = await XlsxPopulate.fromDataAsync(ab);
  const sheet = workbook.sheet(TEMPLATE_SHEET_NAME);
  console.log("Workbook created, sheet:", TEMPLATE_SHEET_NAME);

  // 2) Set header info (company + employees) - spans across all columns
  if (opts.companyName) sheet.cell(HEADER_COMPANY_CELL).value(`Uzņēmums: ${opts.companyName}`);
  if (typeof opts.employeesCount === "number") {
    sheet
      .cell(HEADER_EMPLOYEES_CELL)
      .value(`Nodarbināto skaits: ${opts.employeesCount}`);
  }

  // 2.5) Save template values for payment method rows (55-60) BEFORE populating
  console.log("Saving template values from rows 55-60...");
  const savedTemplateValues: { row: number; value: any }[] = [];
  
  for (let r = 55; r <= 60; r++) {
    try {
      const cellValue = sheet.cell(r, 2).value();
      savedTemplateValues.push({ row: r, value: cellValue });
      console.log(`Row ${r} value:`, cellValue, `(type: ${typeof cellValue})`);
    } catch (e) {
      console.warn(`Could not read value for row ${r}:`, e);
    }
  }

  // 3) For each column, populate data in columns B, C, D, etc.
  console.log("Populating", columns.length, "columns...");
  for (let colIndex = 0; colIndex < columns.length; colIndex++) {
    const column = columns[colIndex];
    const excelCol = colIndex + 2; // Column B = 2, C = 3, etc.
    console.log(`Processing column ${colIndex + 1}/${columns.length}: ${column.insurer}`);

    // If not the first column, copy styles from column B to this column
    if (colIndex > 0) {
      // Copy column width
      try {
        const colBWidth = sheet.column(2).width();
        if (colBWidth) sheet.column(excelCol).width(colBWidth);
      } catch (e) {
        console.warn("Could not copy column width:", e);
      }
      
      // Copy cell styles row by row (excluding values for now)
      for (let r = 1; r <= 60; r++) {
        try {
          const sourceCell = sheet.cell(r, 2);
          const targetCell = sheet.cell(r, excelCol);
          
          // Copy individual style properties
          const bgColor = sourceCell.style("fill");
          if (bgColor) targetCell.style("fill", bgColor);
          
          const fontColor = sourceCell.style("fontColor");
          if (fontColor) targetCell.style("fontColor", fontColor);
          
          const fontSize = sourceCell.style("fontSize");
          if (fontSize) targetCell.style("fontSize", fontSize);
          
          const bold = sourceCell.style("bold");
          if (bold !== undefined) targetCell.style("bold", bold);
          
          const hAlign = sourceCell.style("horizontalAlignment");
          if (hAlign) targetCell.style("horizontalAlignment", hAlign);
          
          const vAlign = sourceCell.style("verticalAlignment");
          if (vAlign) targetCell.style("verticalAlignment", vAlign);
          
          const border = sourceCell.style("border");
          if (border) targetCell.style("border", border);
        } catch (e) {
          // Skip cells that can't be styled
          console.warn(`Could not copy style for row ${r}:`, e.message);
        }
      }
    }

    // Set insurer name in row 6
    sheet.cell(6, excelCol).value((column.insurer || "").toUpperCase());
    
    // Set program code in row 7
    sheet.cell(7, excelCol).value(column.program_code || "");

    // Payment method
    const payRow = findRowByLabel(sheet, PAYMENT_METHOD_LABEL);
    if (payRow) sheet.cell(payRow, excelCol).value(paymentMethodLabel(column.payment_method));

    // Base sum
    const baseRow = findRowByLabel(sheet, "Apdrošinājuma summa pamatpolisei, EUR");
    if (baseRow) sheet.cell(baseRow, excelCol).value(formatValueForCell(column.base_sum_eur));

    // Premium - use correct template label
    const premiumRow = findRowByLabel(sheet, "Pamatpolises prēmija 1 darbiniekam, EUR");
    if (premiumRow) {
      sheet.cell(premiumRow, excelCol).value(formatValueForCell(column.premium_eur));
      sheet.cell(premiumRow, excelCol).style("fontColor", "000000"); // Black text
    }

    // Feature rows
    const features = column.features || {};
    const getFeature = (key: string) => {
      if (key in features) return features[key];
      const canon = canonicalKey(key);
      if (canon in features) return features[canon];
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
      const cell = sheet.cell(row, excelCol);
      cell.value(formatValueForCell(val));
      cell.style("fontColor", "000000"); // Black text
    }
  }
  console.log("All columns populated");

  // 3.5) Restore saved template values to ALL columns
  console.log("Restoring payment method section values to all columns...");
  for (let colIndex = 0; colIndex < columns.length; colIndex++) {
    const excelCol = colIndex + 2; // Column B, C, D, E, etc.
    for (const saved of savedTemplateValues) {
      if (saved.value !== undefined && saved.value !== null && saved.value !== "") {
        try {
          console.log(`Setting row ${saved.row}, col ${excelCol} to:`, saved.value);
          sheet.cell(saved.row, excelCol).value(saved.value);
        } catch (e) {
          console.warn(`Could not restore value for row ${saved.row}, col ${excelCol}:`, e.message);
        }
      }
    }
  }

  // 4) Produce XLSX and trigger download
  console.log("Generating XLSX output...");
  const out = await workbook.outputAsync();
  console.log("XLSX generated, size:", out.byteLength, "bytes");
  
  const blob = new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  console.log("Blob created, size:", blob.size);

  const fileName =
    opts.fileName ||
    `${opts.companyName || "Insurance"}_Comparison_${new Date().toISOString().split('T')[0]}.xlsx`;
  console.log("Downloading as:", fileName);

  // Direct download (avoid double download from popup + fallback)
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.style.display = "none";
  document.body.appendChild(a);
  console.log("Triggering download...");
  a.click();
  console.log("Download triggered");
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log("Cleanup complete");
  }, 100);
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

  // 3) Produce XLSX and download
  const out = await workbook.outputAsync();
  const blob = new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const fileName =
    opts.fileName ||
    `${(column.insurer || "Insurer")}-${(column.program_code || "Program")
      .toString()
      .replace(/[^\w.-]+/g, "_")}.xlsx`;

  // Direct download
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();

  // Clean up
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
