import React, { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Minus, Edit, Save, X, Share2 } from "lucide-react";
import { InsurerLogo } from "@/components/InsurerLogo";
import { Column } from "@/hooks/useAsyncOffers";
import { Language, useTranslation } from "@/utils/translations";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

type OfferPatch = {
  premium_eur?: number;
  base_sum_eur?: number;
  payment_method?: string;
  insurer?: string;
  program_code?: string;
  features?: Record<string, any>;
};

type EditForm = {
  premium_eur?: string;
  base_sum_eur?: string;
  payment_method?: string;
  insurer?: string;
  program_code?: string;
  features?: Record<string, any>;
};

// === Canonical order for the main table (LV labels shown in the left sticky column) ===
const MAIN_FEATURE_ORDER: string[] = [
  "Pamatsumma",
  // "Programmas nosaukums",            // shown in header -> do not render as row
  "Pakalpojuma apmaksas veids",
  // "Apdrošinājuma summa pamatpolisei, EUR", // header/meta -> do not render as row
  "Pacientu iemaksa",
  "Maksas ģimenes ārsta mājas vizītes, limits EUR",
  "Maksas ģimenes ārsta, internista, terapeita un pediatra konsultācija, limits EUR",
  "Maksas ārsta-specialista konsultācija, limits EUR",
  "Profesora, docenta, internista konsultācija, limits EUR",
  "Homeopāts",
  "Psihoterapeits",
  "Sporta ārsts",
  "ONLINE ārstu konsultācijas",
  "Laboratoriskie izmeklējumi",
  "Maksas diagnostika, piem., rentgens, elektrokradiogramma, USG, utml.",
  "Augsto tehnoloģiju izmeklējumi, piem., MRG, CT, limits, ja ir (reižu skaits vai EUR)",
  "Obligātās veselības pārbaudes, limits EUR",
  "Ārstnieciskās manipulācijas",
  "Medicīniskās izziņas",
  "Fizikālā terapija",
  "Procedūras",
  "Vakcinācija, limits EUR",
  "Maksas grūtnieču aprūpe",
  "Maksas onkoloģiskā, hematoloģiskā ārstēšana",
  "Neatliekamā palīdzība valsts un privātā (limits privātai, EUR)",
  "Maksas stacionārie pakalpojumi, limits EUR",
  "Maksas stacionārā rehabilitācija, limits EUR",
  "Ambulatorā rehabilitācija",
  // "Pamatpolises prēmija 1 darbiniekam, EUR",  // premium is in header
  "Piemaksa par plastikāta kartēm, EUR",
];

// === Add-on block (“Papildus programmas”) in this exact order ===
const ADDON_ORDER: string[] = [
  "Zobārstniecība ar 50% atlaidi (pamatpolise)",
  "Zobārstniecība ar 50% atlaidi (pp)",
  "Vakcinācija pret ērcēm un gripu",
  "Ambulatorā rehabilitācija (pp)",
  "Medikamenti ar 50% atlaidi",
  "Sports",
  "Kritiskās saslimšanas",
  "Maksas stacionārie pakalpojumi, limits EUR (pp)",
];

// === Feature key aliases coming from OCR/PDFs -> canonical keys above ===
const KEY_ALIASES: Record<string, string> = {
  // header/meta duplicates:
  "Programmas nosaukums": "Programmas nosaukums",
  "Apdrošinājuma summa pamatpolisei, EUR": "Apdrošinājuma summa pamatpolisei, EUR",
  "Pamatpolises prēmija 1 darbiniekam, EUR": "Pamatpolises prēmija 1 darbiniekam, EUR",

  // common variants / EN -> LV / typos
  "Remote consultations": "ONLINE ārstu konsultācijas",
  "ONLINE ārstu konsultācijas": "ONLINE ārstu konsultācijas",
  "Laboratoriskie izmeklējumi": "Laboratoriskie izmeklējumi",
  "Fizikālā terapija": "Fizikālā terapija",
  "Physical therapy": "Fizikālā terapija",
  "Procedūras": "Procedūras",
  "Sports": "Sports",
  "Sporta ārsts": "Sporta ārsts",
  "Psychologist": "Psihoterapeits",
  "Psihologs / Psihoterapeits": "Psihoterapeits",
  "Homeopāts": "Homeopāts",
  "Ārstnieciskās manipulācijas": "Ārstnieciskās manipulācijas",
  "Medicīniskās izziņas": "Medicīniskās izziņas",
  "Maksas diagnostika": "Maksas diagnostika, piem., rentgens, elektrokradiogramma, USG, utml.",
  "Augsto tehnoloģiju izmeklējumi": "Augsto tehnoloģiju izmeklējumi, piem., MRG, CT, limits, ja ir (reižu skaits vai EUR)",
  "MR": "Augsto tehnoloģiju izmeklējumi, piem., MRG, CT, limits, ja ir (reižu skaits vai EUR)",
  "MRG": "Augsto tehnoloģiju izmeklējumi, piem., MRG, CT, limits, ja ir (reižu skaits vai EUR)",
  "CT": "Augsto tehnoloģiju izmeklējumi, piem., MRG, CT, limits, ja ir (reižu skaits vai EUR)",

  // meta/payment
  "Pakalpojuma apmaksas veids": "Pakalpojuma apmaksas veids",

  // add-ons
  "Zobārstniecība ar 50% atlaidi (pamatpolise)": "Zobārstniecība ar 50% atlaidi (pamatpolise)",
  "Zobārstniecība ar 50% atlaidi, apdrošinājuma summa (pp)": "Zobārstniecība ar 50% atlaidi (pp)",
  "Zobārstniecība ar 50% atlaidi (pp)": "Zobārstniecība ar 50% atlaidi (pp)",
  "Vakcinācija pret ērcēm un gripu": "Vakcinācija pret ērcēm un gripu",
  "Ambulatorā rehabilitācija (pp)": "Ambulatorā rehabilitācija (pp)",
  "Medikamenti ar 50% atlaidi": "Medikamenti ar 50% atlaidi",
  "Kritiskās saslimšanas": "Kritiskās saslimšanas",
  "Maksas stacionārie pakalpojumi, limits EUR (pp)": "Maksas stacionārie pakalpojumi, limits EUR (pp)",
};

const HIDE_IN_TABLE = new Set<string>([
  "Programmas nosaukums",
  "Apdrošinājuma summa pamatpolisei, EUR",
  "Pamatpolises prēmija 1 darbiniekam, EUR",
]);

function canonicalKey(rawKey: string): string {
  return KEY_ALIASES[rawKey] || rawKey;
}

function toNumOrThrow(v: any, name: string): number {
  const n = Number(
    String(v).trim().replace("€", "").replace(/\s/g, "").replace(",", ".").replace(/[^\d.-]/g, "")
  );
  if (Number.isNaN(n)) throw new Error(`${name} must be a number`);
  return n;
}

function normalizeChanges(changes: Record<string, any>): OfferPatch {
  const out: OfferPatch = {};
  if (changes.premium_eur !== undefined && String(changes.premium_eur).trim() !== "") {
    out.premium_eur = toNumOrThrow(changes.premium_eur, "premium_eur");
  }
  if (changes.base_sum_eur !== undefined && String(changes.base_sum_eur).trim() !== "") {
    out.base_sum_eur = toNumOrThrow(changes.base_sum_eur, "base_sum_eur");
  }
  if ("payment_method" in changes) out.payment_method = String(changes.payment_method ?? "");
  if ("insurer" in changes) out.insurer = String(changes.insurer ?? "");
  if ("program_code" in changes) out.program_code = String(changes.program_code ?? "");
  if ("features" in changes) out.features = (changes.features ?? {}) as Record<string, any>;
  return out;
}

async function updateOffer(row_id: number, changes: Record<string, any>, API: string) {
  const patch = normalizeChanges(changes);
  const res = await fetch(`${API}/offers/${row_id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(await res.text());
}

/**
 * Try to resolve the DB id for a program without forcing a full-page refresh.
 * We fetch /offers/by-documents for just this file and match by (insurer, program_code).
 */
async function resolveRowIdForColumn(column: Column, backendUrl: string): Promise<number | undefined> {
  try {
    const res = await fetch(`${backendUrl}/offers/by-documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_ids: [column.source_file] }),
    });
    if (!res.ok) return undefined;
    const groups: Array<{
      source_file: string;
      programs: Array<{ row_id?: number; id?: number; insurer?: string; program_code?: string | null }>;
    }> = await res.json();

    const g = groups.find((x) => x.source_file === column.source_file);
    if (!g) return undefined;

    // match on insurer + program_code
    const match = g.programs.find(
      (p) =>
        (p.insurer ?? "") === (column.insurer ?? "") &&
        (p.program_code ?? "") === (column.program_code ?? "")
    );

    const rid = match?.row_id ?? match?.id;
    return typeof rid === "number" ? rid : undefined;
  } catch {
    return undefined;
  }
}

// Create insurer-specific share link
async function createInsurerShareLink(opts: {
  backendUrl: string;
  insurer: string;  
  columns: Column[];
  orgId?: number;
  userId?: number;
  editable?: boolean;
  role?: "insurer" | "broker";
  allowEditFields?: string[];
  ttlHours?: number;
  title?: string;
}) {
  const {
    backendUrl, insurer, columns, orgId, userId,
    editable = false,
    role = "insurer", 
    allowEditFields = [],
    ttlHours = 720,
    title = `Confirmation – ${insurer}`,
  } = opts;

  // dedupe document_ids from the visible matrix
  const document_ids = Array.from(new Set(columns.map(c => c.source_file)));

  const res = await fetch(`${backendUrl}/shares`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(orgId != null ? { "X-Org-Id": String(orgId) } : {}),
      ...(userId != null ? { "X-User-Id": String(userId) } : {}),
    },
    body: JSON.stringify({
      title,
      document_ids,
      expires_in_hours: ttlHours,
      // the key switch: only this insurer's programs will be visible
      insurer_only: insurer,
      // permissions in the shared view
      editable,
      role,
      allow_edit_fields: allowEditFields, // e.g. ["premium_eur","payment_method","features"]
    }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }
  const data = await res.json(); // { ok, token, url, title }
  return data.url as string;
}

// Payment method options: store canonical values, show Latvian labels
const PAYMENT_METHOD_OPTIONS = [
  { value: "monthly",   label: "Cenrāža programma" },
  { value: "quarterly", label: "100% apmaksa līgumiestādēs" },
  { value: "yearly",    label: "100% apmaksa līgumiestādēs un ja pakalpojums ir nopirkts" },
  { value: "one-time",  label: "Procentuāla programma" },
];

const paymentMethodLabel = (v?: string | null) => {
  if (!v) return "—";
  const m = PAYMENT_METHOD_OPTIONS.find(o => o.value === v);
  return m?.label ?? v; // if DB has a free-text value, show it as-is
};

// (kept for backwards compat where we used t() on some EN keys)
const translateFeatureName = (_featureKey: string, _t: (key: any) => string): string => {
  return _featureKey;
};

interface ComparisonMatrixProps {
  columns: Column[];
  allFeatureKeys: string[];
  currentLanguage: Language;
  onShare?: () => void;
  companyName?: string;
  employeesCount?: number;
  canEdit?: boolean;
  showBuyButtons?: boolean;
  isShareView?: boolean;
  backendUrl?: string;
  onRefreshOffers?: () => Promise<void>;
}

export const ComparisonMatrix: React.FC<ComparisonMatrixProps> = ({
  columns,
  allFeatureKeys, // not used directly anymore; we compute from columns to respect aliases
  currentLanguage,
  onShare,
  companyName,
  employeesCount,
  canEdit = true,
  showBuyButtons = false,
  isShareView = false,
  backendUrl,
  onRefreshOffers,
}) => {
  const { t } = useTranslation(currentLanguage);
  const isMobile = useIsMobile();
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<EditForm>({});
  const [localColumns, setLocalColumns] = useState<Column[]>(columns);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Keep incoming props in sync, but don't clobber while editing
  useEffect(() => {
    if (editingColumn) return;
    setLocalColumns(columns);
  }, [columns, editingColumn]);

  // drag-to-scroll UX
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      setIsDragging(true);
      setStartX(e.pageX - container.offsetLeft);
      setScrollLeft(container.scrollLeft);
      (container as HTMLDivElement).style.cursor = "grabbing";
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 2;
      container.scrollLeft = scrollLeft - walk;
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      (container as HTMLDivElement).style.cursor = "grab";
    };
    const handleMouseLeave = () => {
      setIsDragging(false);
      (container as HTMLDivElement).style.cursor = "grab";
    };

    container.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("mouseleave", handleMouseLeave);
    (container as HTMLDivElement).style.cursor = "grab";

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isDragging, startX, scrollLeft]);

  const renderValue = (value: any) => {
    if (value === true || value === "v" || value === "Yes") {
      return <Check className="h-4 w-4 text-green-600" />;
    }
    if (value === false || value === "-" || value === "No" || value === null || value === "") {
      return <Minus className="h-4 w-4 text-red-600" />;
    }
    return <span className="text-sm">{String(value)}</span>;
  };

  const startEdit = (columnId: string) => {
    if (!canEdit) return;
    const column = localColumns.find((col) => col.id === columnId);
    if (column) {
      setEditingColumn(columnId);
      setEditFormData({
        premium_eur: column.premium_eur?.toString() ?? "",
        base_sum_eur: column.base_sum_eur?.toString() ?? "",
        payment_method: column.payment_method ?? "",
        insurer: column.insurer ?? "",
        program_code: column.program_code ?? "",
        features: column.features ?? {},
      });
    }
  };

  const cancelEdit = () => {
    setEditingColumn(null);
    setEditFormData({});
  };

  const saveEdit = async () => {
    if (!editingColumn) return;
    if (!backendUrl) {
      toast.error("Missing backend URL");
      return;
    }

    try {
      const column = localColumns.find((col) => col.id === editingColumn);
      if (!column) return;

      // resolve row id (without a destructive refresh)
      let rowId = column.row_id;
      if (!rowId) {
        rowId = await resolveRowIdForColumn(column, backendUrl);
        if (!rowId) {
          toast.error("Could not resolve record id yet. Try again in a moment.");
          return;
        }
        // update the local copy so subsequent edits don't need to resolve again
        setLocalColumns((prev) =>
          prev.map((c) => (c.id === column.id ? { ...c, row_id: rowId } : c))
        );
      }

      const changes: Record<string, any> = {};
      if (editFormData.premium_eur !== undefined && String(editFormData.premium_eur).trim() !== "") {
        changes.premium_eur = editFormData.premium_eur;
      }
      if (editFormData.base_sum_eur !== undefined && String(editFormData.base_sum_eur).trim() !== "") {
        changes.base_sum_eur = editFormData.base_sum_eur;
      }
      if (editFormData.payment_method !== undefined && editFormData.payment_method !== column.payment_method) {
        changes.payment_method = editFormData.payment_method;
      }
      if (editFormData.insurer !== undefined && editFormData.insurer !== column.insurer) {
        changes.insurer = editFormData.insurer;
      }
      if (editFormData.program_code !== undefined && editFormData.program_code !== column.program_code) {
        changes.program_code = editFormData.program_code;
      }
      if (editFormData.features) {
        // normalize feature keys to canonical names before saving
        const normalized: Record<string, any> = {};
        for (const [k, v] of Object.entries(editFormData.features)) {
          normalized[canonicalKey(k)] = v;
        }
        const originalFeatures = JSON.stringify(column.features || {});
        const newFeatures = JSON.stringify(normalized);
        if (originalFeatures !== newFeatures) {
          changes.features = normalized;
        }
      }

      if (Object.keys(changes).length === 0) {
        setEditingColumn(null);
        setEditFormData({});
        toast.message("No changes to save");
        return;
      }

      await updateOffer(rowId, changes, backendUrl);

      // end edit so new props can flow in, then optionally refresh offers
      setEditingColumn(null);
      setEditFormData({});
      if (onRefreshOffers) await onRefreshOffers();
      toast.success("Program updated successfully");
    } catch (error: any) {
      toast.error(`Failed to save: ${error.message}`);
    }
  };

  if (localColumns.length === 0) return null;

  const metaRows = [
    { key: "base_sum_eur", label: t("baseSum") },
    { key: "payment_method", label: t("payment") },
  ];

  // --- Build ordered rows (main + addons + leftovers) from actual columns ---
  const presentKeys = new Set<string>();
  for (const col of localColumns) {
    Object.keys(col.features || {}).forEach((k) => presentKeys.add(canonicalKey(k)));
  }
  const mainKnown = MAIN_FEATURE_ORDER.filter((k) => !HIDE_IN_TABLE.has(k));
  const addonKnown = ADDON_ORDER;
  const mainToRender = mainKnown.filter((k) => presentKeys.has(k));
  const addonsToRender = addonKnown.filter((k) => presentKeys.has(k));

  const knownAll = new Set<string>([...mainKnown, ...addonKnown, ...HIDE_IN_TABLE]);
  const leftovers: string[] = Array.from(presentKeys).filter((k) => !knownAll.has(k)).sort();

  return (
    <div className="space-y-4">
      {(companyName || employeesCount) && (
        <div className="grid gap-4 sm:grid-cols-2 p-4 border rounded-lg bg-card">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">{t("includedInPolicy")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Minus className="h-4 w-4 text-red-600" />
              <span className="text-sm text-muted-foreground">{t("notIncludedInPolicy")}</span>
            </div>
          </div>
          <div className="space-y-1">
            {companyName && (
              <div className="text-sm">
                <span className="text-muted-foreground">{t("company")}:</span>
                <span className="ml-2 font-medium">{companyName}</span>
              </div>
            )}
            {employeesCount && (
              <div className="text-sm">
                <span className="text-muted-foreground">{t("employeeCount")}:</span>
                <span className="ml-2 font-medium">{employeesCount}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {canEdit && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t("processingResults")}</h3>
          {onShare && (
            <Button variant="outline" onClick={onShare} disabled={localColumns.length === 0} className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              {t("share")}
            </Button>
          )}
        </div>
      )}

      <Card>
        <div ref={scrollContainerRef} className="overflow-x-auto select-none">
          <div className="min-w-fit">
            {/* Header Row */}
            <div
              className={`flex border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${
                isShareView && !isMobile ? "sticky top-0 z-50" : "sticky top-0 z-20"
              }`}
            >
              {/* Sticky feature header */}
              <div className={`w-[280px] bg-card border-r p-4 ${isMobile ? "" : "sticky left-0 z-30"}`}>
                <div className="font-semibold text-sm">{t("features")}</div>
              </div>

              {/* Program columns */}
              {localColumns.map((column) => {
                const isEditing = editingColumn === column.id;

                // Error column rendering, if any
                if (column.type === "error") {
                  return (
                    <div key={column.id} className="w-[240px] flex-shrink-0 p-4 border-r last:border-r-0 bg-red-50 dark:bg-red-950/20">
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className="w-12 h-12 flex items-center justify-center rounded-md bg-red-100 dark:bg-red-900/30">
                          <X className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="font-semibold text-sm text-red-600">{column.label}</div>
                        <Badge variant="destructive" className="text-xs">FAILED</Badge>
                        <div className="text-xs text-red-600 max-w-full break-words">Processing Failed</div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={column.id} className="w-[240px] flex-shrink-0 p-4 border-r last:border-r-0 bg-card">
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="w-12 h-12 flex items-center justify-center rounded-md bg-muted/30">
                        <InsurerLogo name={column.insurer} className="w-10 h-10 object-contain" />
                      </div>
                      <div className="font-semibold text-sm truncate w-full">{column.insurer}</div>
                      <Badge variant="outline" className="text-xs truncate max-w-full">{column.program_code}</Badge>

                      {isEditing ? (
                        <div className="w-full space-y-2">
                          <Input
                            placeholder={t("premium")}
                            inputMode="decimal"
                            type="text"
                            value={editFormData.premium_eur ?? ""}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                premium_eur: e.target.value,
                              }))
                            }
                            className="text-center"
                          />
                          <div className="flex gap-1">
                            <Button size="sm" onClick={saveEdit} className="flex-1">
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelEdit} className="flex-1">
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-lg font-bold text-primary truncate">
                            €{column.premium_eur?.toLocaleString() || "—"}
                          </div>
                          {canEdit && (
                             <Button size="sm" variant="default" onClick={() => startEdit(column.id)} className="h-6 w-full p-0 text-xs bg-green-600 hover:bg-green-700 text-white">
                               <Edit className="h-3 w-3 mr-1" />
                               {t("edit")}
                             </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Meta rows */}
            {metaRows.map((row) => (
              <div key={row.key} className="flex border-b">
                <div className={`w-[280px] bg-muted border-r p-4 z-10 shadow-lg ${isMobile ? "" : "sticky left-0"}`}>
                  <Badge variant="secondary" className="font-medium text-sm">{row.label}</Badge>
                </div>

                {localColumns.map((column) => {
                  const isEditing = editingColumn === column.id;
                  const value = (column as any)[row.key];

                  return (
                    <div key={column.id} className="w-[240px] flex-shrink-0 p-4 border-r last:border-r-0 flex items-center justify-center">
                      {isEditing && row.key === "payment_method" ? (
                        <Select
                          value={editFormData.payment_method || ""}
                          onValueChange={(value) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              payment_method: value,
                            }))
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PAYMENT_METHOD_OPTIONS.map(o => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : isEditing && row.key === "base_sum_eur" ? (
                        <Input
                          inputMode="decimal"
                          type="text"
                          value={editFormData.base_sum_eur ?? ""}
                          onChange={(e) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              base_sum_eur: e.target.value,
                            }))
                          }
                          className="text-center"
                        />
                       ) : row.key === "base_sum_eur" ? (
                         <span className="text-sm font-medium">€{value?.toLocaleString() || "—"}</span>
                       ) : row.key === "payment_method" ? (
                         <span className="text-sm">{paymentMethodLabel(value)}</span>
                       ) : (
                         <span className="text-sm">{value || "—"}</span>
                       )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* ===== MAIN BLOCK (ordered) ===== */}
            {mainToRender.map((featureKey, index) => (
              <div key={featureKey} className={`flex border-b ${index % 2 === 0 ? "bg-muted/10" : ""}`}>
                <div className={`w-[280px] bg-muted border-r p-4 z-10 shadow-lg ${isMobile ? "" : "sticky left-0"}`}>
                  <Badge variant="secondary" className="text-sm font-medium">{featureKey}</Badge>
                </div>

                {localColumns.map((column) => {
                  const isEditing = editingColumn === column.id;
                  const value = column.features?.[featureKey] ?? column.features?.[canonicalKey(featureKey)];
                  return (
                    <div key={column.id} className="w-[240px] flex-shrink-0 p-4 border-r last:border-r-0 flex items-center justify-center">
                      {isEditing ? (
                        <Input
                          value={(editFormData.features?.[featureKey] ?? value) || ""}
                          onChange={(e) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              features: {
                                ...(prev.features || {}),
                                [featureKey]: e.target.value,
                              },
                            }))
                          }
                          className="text-center"
                        />
                      ) : (
                        renderValue(value)
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* ===== PAPILDUS PROGRAMMAS ===== */}
            {addonsToRender.length > 0 && (
              <>
                <div className="flex border-b bg-card">
                  <div className={`w-[280px] border-r p-3 font-semibold text-sm ${isMobile ? "" : "sticky left-0 bg-card z-10"}`}>
                    Papildus programmas
                  </div>
                  <div className="flex-1 p-3 text-xs text-muted-foreground" />
                </div>

                {addonsToRender.map((featureKey, index) => (
                  <div key={featureKey} className={`flex border-b ${index % 2 === 0 ? "bg-muted/10" : ""}`}>
                    <div className={`w-[280px] bg-muted border-r p-4 z-10 shadow-lg ${isMobile ? "" : "sticky left-0"}`}>
                      <Badge variant="secondary" className="text-sm font-medium">{featureKey}</Badge>
                    </div>

                    {localColumns.map((column) => {
                      const isEditing = editingColumn === column.id;
                      const value = column.features?.[featureKey] ?? column.features?.[canonicalKey(featureKey)];
                      return (
                        <div key={column.id} className="w-[240px] flex-shrink-0 p-4 border-r last:border-r-0 flex items-center justify-center">
                          {isEditing ? (
                            <Input
                              value={(editFormData.features?.[featureKey] ?? value) || ""}
                              onChange={(e) =>
                                setEditFormData((prev) => ({
                                  ...prev,
                                  features: {
                                    ...(prev.features || {}),
                                    [featureKey]: e.target.value,
                                  },
                                }))
                              }
                              className="text-center"
                            />
                          ) : (
                            renderValue(value)
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </>
            )}

            {/* ===== LEFTOVERS (optional; remove later if not needed) ===== */}
            {leftovers.length > 0 && (
              <>
                <div className="flex border-b bg-card">
                  <div className={`w-[280px] border-r p-3 font-semibold text-sm ${isMobile ? "" : "sticky left-0 bg-card z-10"}`}>
                    Citi lauki
                  </div>
                </div>
                {leftovers.map((featureKey, index) => (
                  <div key={featureKey} className={`flex border-b ${index % 2 === 0 ? "bg-muted/10" : ""}`}>
                    <div className={`w-[280px] bg-muted border-r p-4 z-10 shadow-lg ${isMobile ? "" : "sticky left-0"}`}>
                      <Badge variant="secondary" className="text-sm font-medium">{featureKey}</Badge>
                    </div>

                    {localColumns.map((column) => {
                      const value = column.features?.[featureKey] ?? column.features?.[canonicalKey(featureKey)];
                      return (
                        <div key={column.id} className="w-[240px] flex-shrink-0 p-4 border-r last:border-r-0 flex items-center justify-center">
                          {renderValue(value)}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </>
            )}

            {/* CTA row (optional) */}
            {showBuyButtons && (
              <div className="flex border-b">
                 <div className={`w-[280px] bg-muted border-r p-4 z-10 shadow-lg ${isMobile ? "" : "sticky left-0"}`}>
                   <Badge variant="secondary" className="text-sm font-medium">{t("confirm")}</Badge>
                 </div>

                {localColumns.map((column) => (
                  <div key={column.id} className="w-[240px] flex-shrink-0 p-4 border-r last:border-r-0 flex items-center justify-center">
                     <Button
                       size="sm"
                       className="w-full"
                       onClick={async () => {
                         try {
                           if (!backendUrl) {
                             toast.error("Missing backend URL");
                             return;
                           }

                           const url = await createInsurerShareLink({
                             backendUrl,
                             insurer: column.insurer || "",
                             columns: localColumns,
                             // orgId: currentOrgId,
                             // userId: currentUserId,
                             editable: false,
                             role: "insurer",
                             ttlHours: 168,
                           });

                           await navigator.clipboard.writeText(url);
                           toast.success("Insurer-only link copied!");
                         } catch (e: any) {
                           toast.error(`Failed to create share: ${e.message}`);
                         }
                       }}
                     >
                       Pirkt
                     </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ComparisonMatrix;
