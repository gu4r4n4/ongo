import React, { useState, useRef, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, Minus, Edit, Save, X, Share2, Trash2, Filter } from "lucide-react";
import { InsurerLogo } from "@/components/InsurerLogo";
import { Column, OfferGroup } from "@/hooks/useAsyncOffers";
import { Language, useTranslation } from "@/utils/translations";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useBrandTheme } from "@/theme/BrandThemeProvider";

/* ============================================
   Encode/decode hidden features in URL (utf-8 safe)
   ============================================ */
const encodeHiddenFeaturesParam = (hidden: Set<string>): string => {
  const json = JSON.stringify([...hidden]);
  const b64 = btoa(encodeURIComponent(json));
  return encodeURIComponent(b64);
};

const decodeHiddenFeaturesParam = (param: string): Set<string> => {
  try {
    const b64 = decodeURIComponent(param);
    const json = decodeURIComponent(atob(b64));
    const arr = JSON.parse(json);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};

// Build a URL with ?hf=... appended
const appendHiddenFeaturesToUrl = (url: string, hidden: Set<string>): string => {
  if (hidden.size === 0) return url;
  const hf = encodeHiddenFeaturesParam(hidden);
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}hf=${hf}`;
};

/* ============================================
   Helpers to KEEP ORDER stable across edits
   ============================================ */
const columnKey = (c: Pick<Column, "source_file" | "insurer" | "program_code">) =>
  `${c.source_file}::${c.insurer ?? ""}::${c.program_code ?? ""}`;

const mergeOrder = (prevKeys: string[], nextCols: Column[]) => {
  const nextKeys = nextCols.map(columnKey);
  // keep existing order for still-present items
  const kept = prevKeys.filter(k => nextKeys.includes(k));
  // append any newcomers at the end (in their incoming order)
  const added = nextKeys.filter(k => !kept.includes(k));
  return [...kept, ...added];
};

const sortByOrder = (cols: Column[], orderKeys: string[]) => {
  const idx = (k: string) => {
    const i = orderKeys.indexOf(k);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  return [...cols].sort((a, b) => idx(columnKey(a)) - idx(columnKey(b)));
};

/* ============================================
   Types
   ============================================ */
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

/** ======================
 *  Canonical order (LV)
 *  ====================== */
const MAIN_FEATURE_ORDER: string[] = [
  "Pamatsumma",
  "Pakalpojuma apmaksas veids",
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
  "Augsto tehnoloģiju izmeklējumi, piem., MR, CT, limits, ja ir (reižu skaits vai EUR)",
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
  "Piemaksa par plastikāta kartēm, EUR",
];

const ADDON_ORDER: string[] = [
  "Zobārstniecība ar 50% atlaidi (pamatpolise)",
  "Zobārstniecība ar 50% atlaidi (pp)",
  "Vakcinācija pret ērcēm un gripu",
  "Ambulatorā rehabilitācija (pp)",
  "Medikamenti ar 50% atlaidi",
  "Sports",
  "Kritiskās saslimšanas",
  "Maksas stacionārie pakalpojumi, limits EUR (pp)",
  "Maksas Operācijas, limits EUR",
  "Optika 50%, limits EUR",
];

/** ======================
 *  Aliases -> Canonical
 *  (canonical uses MR)
 *  ====================== */
const KEY_ALIASES: Record<string, string> = {
  // header/meta
  "Programmas nosaukums": "Programmas nosaukums",
  "Apdrošinājuma summa pamatpolisei, EUR": "Apdrošinājuma summa pamatpolisei, EUR",
  "Pamatpolises prēmija 1 darbiniekam, EUR": "Pamatpolises prēmija 1 darbiniekam, EUR",

  // diagnostics
  "Maksas diagnostika": "Maksas diagnostika, piem., rentgens, elektrokradiogramma, USG, utml.",

  // high-tech variants → MR canonical
  "Augsto tehnoloģiju izmeklējumi": "Augsto tehnoloģiju izmeklējumi, piem., MR, CT, limits, ja ir (reižu skaits vai EUR)",
  "Augsto tehnoloģiju izmeklējumi, piem., MR, CT, limits (reižu skaits vai EUR)":
    "Augsto tehnoloģiju izmeklējumi, piem., MR, CT, limits, ja ir (reižu skaits vai EUR)",
  "Augsto tehnoloģiju izmeklējumi, piem., MRG, CT, limits (reižu skaits vai EUR)":
    "Augsto tehnoloģiju izmeklējumi, piem., MR, CT, limits, ja ir (reižu skaits vai EUR)",
  "Augsto tehnoloģiju izmeklējumi, piem., MRG, CT, limits, ja ir (reižu skaits vai EUR)":
    "Augsto tehnoloģiju izmeklējumi, piem., MR, CT, limits, ja ir (reižu skaits vai EUR)",
  "MR": "Augsto tehnoloģiju izmeklējumi, piem., MR, CT, limits, ja ir (reižu skaits vai EUR)",
  "MRG": "Augsto tehnoloģiju izmeklējumi, piem., MR, CT, limits, ja ir (reižu skaits vai EUR)",
  "CT": "Augsto tehnoloģiju izmeklējumi, piem., MR, CT, limits, ja ir (reižu skaits vai EUR)",

  // common variants / EN
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
  "Programmas kods",
  "Apdrošinājuma summa pamatpolisei, EUR",
  "Pamatpolises prēmija 1 darbiniekam, EUR",
  "Maksājums",
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

/** ======================
 *  Payment methods (LV)
 *  ====================== */
const PAYMENT_METHOD_OPTIONS = [
  { value: "monthly",   label: "Cenrāža programma" },
  { value: "quarterly", label: "100% apmaksa līgumiestādēs" },
  { value: "yearly",    label: "100% apmaksa līgumiestādēs un ja pakalpojums ir nopirkts" },
  { value: "one-time",  label: "Procentuāla programma" },
];

function paymentMethodLabel(v?: string | null): string {
  if (!v) return "—";
  const m = PAYMENT_METHOD_OPTIONS.find(o => o.value === v);
  return m?.label ?? v;
}

/** ======================
 *  Backend helpers
 *  ====================== */
async function resolveRowIdForColumn(
  column: Column,
  backendUrl: string
): Promise<number | undefined> {
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

// View preferences type for sharing
type ViewPrefs = {
  column_order: string[];
  hidden_features: string[];
};

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
  companyName?: string;
  employeesCount?: number;
  viewPrefs?: ViewPrefs;
}): Promise<string> {
  const {
    backendUrl, insurer, columns, orgId, userId,
    editable = false,
    role = "insurer",
    allowEditFields = [],
    ttlHours = 720,
    title = `Confirmation – ${insurer}`,
    companyName,
    employeesCount,
    viewPrefs,
  } = opts;

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
      insurer_only: insurer,
      editable,
      role,
      allow_edit_fields: allowEditFields,
      company_name: companyName ?? undefined,
      employees_count: employeesCount ?? undefined,
      view_prefs: viewPrefs ?? { column_order: [], hidden_features: [] },
    }),
  });

  if (!res.ok) throw new Error(await res.text());
  const data = await res.json(); // { ok, token, url, title }
  return data.url as string;
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

async function deleteOffer(row_id: number, API: string) {
  const res = await fetch(`${API}/offers/${row_id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
}

function buildColumnsFromGroups(groups: OfferGroup[]): Column[] {
  const cols: Column[] = [];
  for (const g of groups) {
    for (const p of g.programs || []) {
      const rid = (p as any).row_id ?? (p as any).id;
      const fallbackId = `${g.source_file}::${p.insurer ?? ""}::${p.program_code ?? ""}`;
      cols.push({
        id: rid ? String(rid) : `${fallbackId}::${cols.length}`,
        label: p.insurer || g.source_file,
        source_file: g.source_file,
        row_id: rid,
        insurer: p.insurer,
        program_code: p.program_code,
        premium_eur: p.premium_eur ?? null,
        base_sum_eur: p.base_sum_eur ?? null,
        payment_method: p.payment_method ?? null,
        features: p.features || {},
        group: g,
      });
    }
  }
  return cols;
}

async function refetchColumnsAfterSave(
  backendUrl: string,
  currentColumns: Column[],
  shareToken?: string
): Promise<Column[]> {
  if (shareToken) {
    const res = await fetch(`${backendUrl}/shares/${encodeURIComponent(shareToken)}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const groups = (data?.offers ?? []) as OfferGroup[];
    return buildColumnsFromGroups(groups);
  } else {
    const document_ids = Array.from(new Set(currentColumns.map((c) => c.source_file)));
    const res = await fetch(`${backendUrl}/offers/by-documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_ids }),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(await res.text());
    const groups = (await res.json()) as OfferGroup[];
    return buildColumnsFromGroups(groups);
  }
}

/** Back-compat name passthrough */
const translateFeatureName = (k: string, _t: (key: any) => string): string => k;

/** ======================
 *  Defensive value lookup
 *  ====================== */
function getFeatureValue(col: Column, canonical: string) {
  if (col.features && canonical in col.features) return col.features[canonical];
  const alias = canonicalKey(canonical);
  if (col.features && alias in col.features) return col.features[alias];
  for (const [raw, v] of Object.entries(col.features || {})) {
    if (canonicalKey(raw) === canonical) return v;
  }
  return undefined;
}

/** ======================
 *  Optimistic update utils
 *  ====================== */
type ChangeSet = {
  premium_eur?: string | number;
  base_sum_eur?: string | number;
  payment_method?: string | null;
  insurer?: string;
  program_code?: string;
  features?: Record<string, any>;
};

function toNumOrNull(v: any): number | null {
  if (v === undefined || v === null || String(v).trim() === "") return null;
  try {
    return Number(
      String(v).trim().replace("€", "").replace(/\s/g, "").replace(",", ".").replace(/[^\d.-]/g, "")
    );
  } catch {
    return null;
  }
}

function applyChangesToColumn(col: Column, changes: ChangeSet): Column {
  const next: Column = { ...col };
  if (changes.premium_eur !== undefined) {
    const n = toNumOrNull(changes.premium_eur);
    next.premium_eur = n !== null ? n : next.premium_eur;
  }
  if (changes.base_sum_eur !== undefined) {
    const n = toNumOrNull(changes.base_sum_eur);
    next.base_sum_eur = n !== null ? n : next.base_sum_eur;
  }
  if (changes.payment_method !== undefined) {
    next.payment_method = (changes.payment_method ?? null) as any;
  }
  if (changes.insurer !== undefined) {
    next.insurer = changes.insurer;
  }
  if (changes.program_code !== undefined) {
    next.program_code = changes.program_code;
  }
  if (changes.features) {
    const normalized: Record<string, any> = {};
    for (const [k, v] of Object.entries(changes.features)) {
      normalized[canonicalKey(k)] = v;
    }
    next.features = { ...(next.features || {}), ...normalized };
  }
  return next;
}

function optimisticMergeColumns(columns: Column[], columnId: string, changes: ChangeSet): Column[] {
  return columns.map((c) => (c.id === columnId ? applyChangesToColumn(c, changes) : c));
}

function reconcileRefetchWithOptimistic(refetched: Column[], edits: Array<{ columnId: string; changes: ChangeSet }>): Column[] {
  if (!edits.length) return refetched;
  const map = new Map(edits.map((e) => [e.columnId, e.changes]));
  return refetched.map((c) => (map.has(c.id) ? applyChangesToColumn(c, map.get(c.id)!) : c));
}

/* ============================================
   Component
   ============================================ */
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
  shareToken?: string; // ONLY on share pages
  onRefreshOffers?: () => Promise<void>;
  onDeleteColumn?: (columnId: string) => void;
  /** Optional share preferences from backend */
  sharePrefs?: { 
    column_order?: string[]; 
    hidden_features?: string[] 
  };
}

export const ComparisonMatrix: React.FC<ComparisonMatrixProps> = ({
  columns,
  allFeatureKeys,
  currentLanguage,
  onShare,
  companyName,
  employeesCount,
  canEdit = true,
  showBuyButtons = false,
  isShareView = false,
  backendUrl,
  shareToken,
  onRefreshOffers,
  onDeleteColumn,
  sharePrefs,
}) => {
  const { t } = useTranslation(currentLanguage);
  const isMobile = useIsMobile();
  const theme = useBrandTheme();
  const rounded = theme?.rounded ?? "rounded-xl";

  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<EditForm>({});
  const [localColumns, setLocalColumns] = useState<Column[]>(columns);

  // 🔒 persistent order (by stable key) to prevent “jump to last” after save/refetch
  const [orderKeys, setOrderKeys] = useState<string[]>(columns.map(columnKey));

  // DnD state
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  // Company edit + row hiding (your existing UX)
  const [editingCompany, setEditingCompany] = useState<string | null>(null);
  const [hiddenFeatures, setHiddenFeatures] = useState<Set<string>>(new Set());
  const toggleFeatureVisibility = (k: string) =>
    setHiddenFeatures(prev => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  const clearHidden = () => setHiddenFeatures(new Set());

  // Keep local data in sync with props but preserve our order
  useEffect(() => {
    setLocalColumns(columns);
    setOrderKeys(prev => mergeOrder(prev.length ? prev : columns.map(columnKey), columns));
  }, [columns]);

  // Ordered view derived from localColumns + orderKeys
  const orderedColumns = useMemo(
    () => sortByOrder(localColumns, orderKeys),
    [localColumns, orderKeys]
  );

  // Apply hidden rows automatically on the share page from URL or sharePrefs
  useEffect(() => {
    if (!isShareView) return;
    
    // First try backend-stored prefs
    if (sharePrefs) {
      if (sharePrefs.column_order?.length) {
        setOrderKeys(prev => mergeOrder(sharePrefs.column_order!, localColumns));
      }
      if (sharePrefs.hidden_features?.length) {
        setHiddenFeatures(new Set(sharePrefs.hidden_features));
      }
      return; // Skip URL parsing if we have backend prefs
    }
    
    // Fallback to URL-based hidden features
    try {
      const sp = new URLSearchParams(window.location.search);
      const hf = sp.get("hf");
      if (hf) {
        const set = decodeHiddenFeaturesParam(hf);
        if (set.size) setHiddenFeatures(set);
      }
    } catch {
      // silently ignore decode errors
    }
  }, [isShareView, sharePrefs, localColumns]);

  // Prepare view preferences for sharing
  const viewPrefs = useMemo(() => ({
    column_order: orderKeys,
    hidden_features: Array.from(hiddenFeatures),
  }), [orderKeys, hiddenFeatures]);

  /* ========= Drag & Drop handlers (no external libs) ========= */
  const onDragStart = (k: string) => (e: React.DragEvent) => {
    if (!canEdit) return;
    setDraggingKey(k);
    e.dataTransfer.effectAllowed = "move";
    // Needed for Firefox to start DnD
    e.dataTransfer.setData("text/plain", k);
  };

  const onDragOver = (k: string) => (e: React.DragEvent) => {
    if (!canEdit) return;
    e.preventDefault();
    if (dragOverKey !== k) setDragOverKey(k);
  };

  const onDragLeave = (k: string) => () => {
    if (dragOverKey === k) setDragOverKey(null);
  };

  const reorderKeys = (fromKey: string, toKey: string) => {
    setOrderKeys(prev => {
      if (!fromKey || !toKey || fromKey === toKey) return prev;
      const next = [...prev];
      const fromIdx = next.indexOf(fromKey);
      const toIdx = next.indexOf(toKey);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  };

  const onDrop = (k: string) => (e: React.DragEvent) => {
    if (!canEdit) return;
    e.preventDefault();
    const src = draggingKey || e.dataTransfer.getData("text/plain");
    if (src) reorderKeys(src, k);
    setDraggingKey(null);
    setDragOverKey(null);
  };

  // Horizontal scroll drag (your existing UX)
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingScroll, setIsDraggingScroll] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      setIsDraggingScroll(true);
      setStartX(e.pageX - container.offsetLeft);
      setScrollLeft(container.scrollLeft);
      (container as HTMLDivElement).style.cursor = "grabbing";
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingScroll) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 2;
      container.scrollLeft = scrollLeft - walk;
    };
    const handleMouseUp = () => {
      setIsDraggingScroll(false);
      (container as HTMLDivElement).style.cursor = "grab";
    };
    const handleMouseLeave = () => {
      setIsDraggingScroll(false);
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
  }, [isDraggingScroll, startX, scrollLeft]);

  // Utility to handle object values properly
  const cellVal = (v: any) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? ("value" in v ? v.value : JSON.stringify(v))
      : v ?? "—";

  const renderValue = (value: any) => {
    let normalizedValue = value;
    if (value && typeof value === "object" && "value" in value) {
      normalizedValue = value.value;
    }
    const strValue = String(normalizedValue ?? "").trim().toLowerCase();

    if (normalizedValue === true || strValue === "v" || strValue === "yes" || strValue === "✓") {
      return <Check className="h-4 w-4 text-green-600 mx-auto" />;
    }
    if (normalizedValue === false || strValue === "-" || strValue === "no" || normalizedValue == null || strValue === "") {
      return <Minus className="h-4 w-4 text-red-600 mx-auto" />;
    }
    return <span className="text-sm text-center block">{cellVal(value)}</span>;
  };

  const startEdit = (columnId: string) => {
    const column = localColumns.find((col) => col.id === columnId);
    if (!canEdit || !column) return;
    setEditingColumn(columnId);
    setEditFormData({
      premium_eur: column.premium_eur?.toString() ?? "",
      base_sum_eur: column.base_sum_eur?.toString() ?? "",
      payment_method: column.payment_method ?? "",
      insurer: column.insurer ?? "",
      program_code: column.program_code ?? "",
      features: column.features ?? {},
    });
  };

  const cancelEdit = () => {
    setEditingColumn(null);
    setEditFormData({});
  };

  const saveEdit = async () => {
    if (!editingColumn) return;
    if (!backendUrl) {
      toast.error(t("missingBackendUrl") || "Missing backend URL");
      return;
    }

    try {
      const column = localColumns.find((col) => col.id === editingColumn);
      if (!column) return;

      // resolve row id if needed
      let rowId = column.row_id;
      if (!rowId) {
        rowId = await resolveRowIdForColumn(column, backendUrl);
        if (!rowId) {
          toast.error(t("couldNotResolveRecordId") || "Could not resolve record id yet. Try again in a moment.");
          return;
        }
        setLocalColumns((prev) =>
          prev.map((c) => (c.id === column.id ? { ...c, row_id: rowId } : c))
        );
      }

      // build changes payload
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
        toast.message(t("noChangesToSave") || "No changes to save");
        return;
      }

      // 1) Optimistic UI update (order preserved)
      setLocalColumns((prev) => optimisticMergeColumns(prev, column.id, changes));

      // 2) Persist
      await updateOffer(rowId!, changes, backendUrl);

      // 3) Reconcile with fresh data (but keep orderKeys)
      if (onRefreshOffers) {
        await onRefreshOffers(); // parent updates `columns` prop — our order is preserved by orderKeys
      } else if (isShareView && backendUrl) {
        try {
          const refetched = await refetchColumnsAfterSave(backendUrl, localColumns, shareToken);
          const merged = reconcileRefetchWithOptimistic(refetched, [{ columnId: column.id, changes }]);
          // keep the same order
          setLocalColumns(sortByOrder(merged, orderKeys));
          // Also merge order with potential newcomers
          setOrderKeys((prev) => mergeOrder(prev, merged));
        } catch {
          /* non-fatal */
        }
      }

      setEditingColumn(null);
      setEditFormData({});
      toast.success(t("programUpdatedSuccessfully") || "Program updated successfully");
    } catch (error: any) {
      if (isShareView && backendUrl) {
        try {
          const refetched = await refetchColumnsAfterSave(backendUrl, localColumns, shareToken);
          setLocalColumns(sortByOrder(refetched, orderKeys));
          setOrderKeys((prev) => mergeOrder(prev, refetched));
        } catch {}
      }
      toast.error(`${t("failedToSave") || "Failed to save"}: ${error.message}`);
    }
  };

  const handleDeleteColumn = async (column: Column) => {
    if (!backendUrl) {
      toast.error(t("missingBackendUrl") || "Missing backend URL");
      return;
    }
    try {
      let rowId = column.row_id;
      if (!rowId) {
        rowId = await resolveRowIdForColumn(column, backendUrl);
        if (!rowId) {
          toast.error(t("couldNotResolveRecordId") || "Could not resolve record id yet. Try again in a moment.");
          return;
        }
        setLocalColumns(prev => prev.map(c => c.id === column.id ? { ...c, row_id: rowId! } : c));
      }

      // optimistic remove (and update order)
      const k = columnKey(column);
      setLocalColumns(prev => prev.filter(c => columnKey(c) !== k));
      setOrderKeys(prev => prev.filter(x => x !== k));

      // persist
      await deleteOffer(rowId!, backendUrl);

      // reconcile with backend
      if (onRefreshOffers) {
        await onRefreshOffers();
      } else {
        const refetched = await refetchColumnsAfterSave(backendUrl, localColumns, shareToken);
        setLocalColumns(sortByOrder(refetched, orderKeys));
        setOrderKeys(prev => mergeOrder(prev, refetched));
      }

      onDeleteColumn?.(column.id);
      toast.success("Column deleted");
    } catch (e: any) {
      toast.error(`Failed to delete: ${e.message}`);
    }
  };

  if (orderedColumns.length === 0) return null;

  const metaRows = [
    { key: "base_sum_eur", label: t("baseSum") },
    { key: "payment_method", label: t("payment") },
  ];

  // Build ordered rows (main + addons) from actual columns
  const presentKeys = new Set<string>();
  for (const col of orderedColumns) {
    Object.keys(col.features || {}).forEach((k) => presentKeys.add(canonicalKey(k)));
  }

  const allFeatureOptions = [...MAIN_FEATURE_ORDER, ...ADDON_ORDER].filter(k => presentKeys.has(k));

  const mainKnown = MAIN_FEATURE_ORDER.filter((k) => !HIDE_IN_TABLE.has(k));
  const addonKnown = ADDON_ORDER;
  const mainToRender = mainKnown.filter((k) => presentKeys.has(k) && !hiddenFeatures.has(k));
  const addonsToRender = addonKnown.filter((k) => presentKeys.has(k) && !hiddenFeatures.has(k));

  return (
    <div className="space-y-4">
      {(companyName || employeesCount != null) && (
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
            {employeesCount != null && (
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
          <div>
            <h3 className="text-xl font-bold">PAS</h3>
            <p className="text-sm text-muted-foreground">Piedāvājumu Apstrādes Serviss</p>
          </div>
          <div className="flex items-center gap-2">
            {onShare && (
              <Button variant="outline" onClick={onShare} disabled={orderedColumns.length === 0} className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                {t("share")}
              </Button>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Rows
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 z-50 bg-popover">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium">Hide rows</div>
                  <Button size="sm" variant="ghost" onClick={clearHidden}>
                    Reset
                  </Button>
                </div>
                <div className="max-h-64 overflow-auto space-y-1">
                  {allFeatureOptions.map((k) => (
                    <label key={k} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded">
                      <Checkbox
                        checked={hiddenFeatures.has(k)}
                        onCheckedChange={() => toggleFeatureVisibility(k)}
                      />
                      <span>{k}</span>
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      <Card className="relative overflow-hidden">
        {theme?.logoUrl && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `url(${theme.logoUrl})`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "calc(100% - 24px) calc(100% - 24px)",
              backgroundSize: "220px auto",
              opacity: theme.watermarkOpacity ?? 0.06,
              filter: "grayscale(100%)",
            }}
          />
        )}
        <div ref={scrollContainerRef} className="overflow-x-auto select-none">
          <div className="min-w-fit">
            {/* Header Row */}
            <div
              className={`flex border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${
                isShareView && !isMobile ? "sticky top-0 z-50" : "sticky top-0 z-20"
              }`}
              style={{ background: "var(--brand-surface)" }}
            >
              {/* Sticky feature header */}
              <div className={`w-[280px] bg-card border-r p-4 ${isMobile ? "" : "sticky left-0 z-30"}`}>
                <div className="font-semibold text-sm invisible">{t("features")}</div>
              </div>

              {/* Program columns (ORDERED + DRAGGABLE) */}
              {orderedColumns.map((column) => {
                const isEditing = editingColumn === column.id;
                const k = columnKey(column);
                const isDragOver = dragOverKey === k;

                // Error column rendering, if any
                if ((column as any).type === "error") {
                  return (
                    <div key={k} className="w-[240px] flex-shrink-0 p-4 border-r last:border-r-0 bg-red-50 dark:bg-red-950/20">
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className="w-12 h-12 flex items-center justify-center rounded-md bg-red-100 dark:bg-red-900/30">
                          <X className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="font-semibold text-sm text-red-600">{(column as any).label}</div>
                        <Badge variant="destructive" className="text-xs">FAILED</Badge>
                        <div className="text-xs text-red-600 max-w-full break-words">Processing Failed</div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={k}
                    data-key={k}
                    className={`w-[240px] flex-shrink-0 p-4 border-r last:border-r-0 bg-card transition-colors ${
                      isDragOver ? "ring-2 ring-primary/50" : ""
                    }`}
                    draggable={canEdit}
                    onDragStart={onDragStart(k)}
                    onDragOver={onDragOver(k)}
                    onDragLeave={onDragLeave(k)}
                    onDrop={onDrop(k)}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      {/* Delete button */}
                      {canEdit && onDeleteColumn && (
                        <div className="w-full flex justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteColumn(column)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}

                      <div className="w-12 h-12 flex items-center justify-center rounded-md bg-muted/30">
                        <InsurerLogo name={column.insurer} className="w-10 h-10 object-contain" />
                      </div>

                      {/* Editable company name */}
                      {editingCompany === column.id ? (
                        <div className="w-full space-y-2">
                          <Select
                            value={editFormData.insurer || column.insurer || ""}
                            onValueChange={(value) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                insurer: value,
                              }))
                            }
                          >
                            <SelectTrigger className="w-full text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BAN">BAN</SelectItem>
                              <SelectItem value="BTA">BTA</SelectItem>
                              <SelectItem value="BALTA">BALTA</SelectItem>
                              <SelectItem value="COMPENSA">COMPENSA</SelectItem>
                              <SelectItem value="ERGO">ERGO</SelectItem>
                              <SelectItem value="Gjensidige">Gjensidige</SelectItem>
                              <SelectItem value="IF">IF</SelectItem>
                              <SelectItem value="SEESAM">SEESAM</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => {
                                setEditingColumn(column.id);
                                setEditingCompany(null);
                                saveEdit();
                              }}
                              className="flex-1 h-6 text-xs bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingCompany(null);
                                setEditFormData({});
                              }}
                              className="flex-1 h-6 text-xs"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="font-semibold text-sm truncate w-full cursor-grab active:cursor-grabbing hover:bg-muted/50 p-1 rounded"
                          title="Drag to reorder"
                          onMouseDown={(e) => {
                            // small UX hint: starting drag from this label is nicer
                          }}
                          onClick={() => canEdit && setEditingCompany(column.id)}
                        >
                          {column.insurer}
                        </div>
                      )}

                      {/* Program code badge */}
                      <Badge
                        variant="outline"
                        className="text-xs max-w-full bg-[#004287] text-white border-[#004287] whitespace-normal leading-tight py-1 min-h-[1.5rem] flex items-center justify-center"
                      >
                        <span className="break-words text-center">{column.program_code}</span>
                      </Badge>

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
                            <Button
                              size="sm"
                              onClick={saveEdit}
                              className={`flex-1 ${rounded} text-white bg-green-600 hover:bg-green-700`}
                            >
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
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => startEdit(column.id)}
                              className={`h-8 w-full px-3 py-1 text-sm text-white font-medium ${rounded} bg-green-600 hover:bg-green-700`}
                            >
                              <Edit className="h-4 w-4 mr-2" />
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
              <div key={row.key} className="flex border-b hover:bg-[#f1f5f9] transition-colors">
                <div className={`w-[280px] bg-muted border-r p-4 z-10 shadow-lg ${isMobile ? "" : "sticky left-0"}`}>
                  <Badge variant="secondary" className="font-medium text-sm">{row.label}</Badge>
                </div>

                {orderedColumns.map((column) => {
                  const isEditing = editingColumn === column.id;
                  const value = (column as any)[row.key];

                  return (
                    <div key={columnKey(column)} className="w-[240px] flex-shrink-0 p-4 border-r last:border-r-0 flex items-center justify-center">
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

            {/* MAIN BLOCK (ordered) */}
            {mainToRender.map((featureKey, index) => (
              <div key={featureKey} className={`flex border-b hover:bg-[#f1f5f9] transition-colors ${index % 2 === 0 ? "bg-muted/10" : ""}`}>
                <div className={`w-[280px] bg-muted border-r p-4 z-10 shadow-lg ${isMobile ? "" : "sticky left-0"}`}>
                  <Badge variant="secondary" className="text-sm font-medium">{translateFeatureName(featureKey, t)}</Badge>
                </div>

                {orderedColumns.map((column) => {
                  const isEditing = editingColumn === column.id;
                  const value = getFeatureValue(column, featureKey);
                  return (
                    <div key={columnKey(column)} className="w-[240px] flex-shrink-0 p-4 border-r last:border-r-0 flex items-center justify-center">
                      {isEditing ? (
                        <Input
                          value={cellVal(editFormData.features?.[featureKey] ?? value)}
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

            {/* PAPILDUS PROGRAMMAS */}
            {addonsToRender.length > 0 && (
              <>
                <div className="flex border-b bg-card">
                  <div className={`w-[280px] border-r p-3 font-semibold text-sm ${isMobile ? "" : "sticky left-0 bg-card z-10"}`}>
                    Papildus programmas
                  </div>
                  <div className="flex-1 p-3 text-xs text-muted-foreground" />
                </div>

                {addonsToRender.map((featureKey, index) => (
                  <div key={featureKey} className={`flex border-b hover:bg-[#f1f5f9] transition-colors ${index % 2 === 0 ? "bg-muted/10" : ""}`}>
                    <div className={`w-[280px] bg-muted border-r p-4 z-10 shadow-lg ${isMobile ? "" : "sticky left-0"}`}>
                      <Badge variant="secondary" className="text-sm font-medium">{featureKey}</Badge>
                    </div>

                    {orderedColumns.map((column) => {
                      const isEditing = editingColumn === column.id;
                      const value = getFeatureValue(column, featureKey);
                      return (
                        <div key={columnKey(column)} className="w-[240px] flex-shrink-0 p-4 border-r last:border-r-0 flex items-center justify-center">
                          {isEditing ? (
                            <Input
                              value={cellVal(editFormData.features?.[featureKey] ?? value)}
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

            {/* CTA row (optional) */}
            {showBuyButtons && (
              <div className="flex border-b">
                 <div className={`w-[280px] bg-muted border-r p-4 z-10 shadow-lg ${isMobile ? "" : "sticky left-0"}`}>
                   <Badge variant="secondary" className="text-sm font-medium invisible">{t("confirm")}</Badge>
                 </div>

                {orderedColumns.map((column) => (
                  <div key={columnKey(column)} className="w-[240px] flex-shrink-0 p-4 border-r last:border-r-0 flex items-center justify-center">
                     <Button
                       size="sm"
                       className={`w-full ${rounded} text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] focus:ring-2 focus:ring-[var(--brand-ring)]`}
                       onClick={async () => {
                         try {
                            if (!backendUrl) {
                              toast.error(t("missingBackendUrl") || "Missing backend URL");
                              return;
                            }

                            const baseUrl = await createInsurerShareLink({
                              backendUrl,
                              insurer: column.insurer || "",
                              columns: orderedColumns, // share in current user order
                              editable: false,
                              role: "insurer",
                              ttlHours: 168,
                              companyName,
                              employeesCount,
                              viewPrefs,
                            });

                            // Append hidden features to URL
                            const shareUrl = appendHiddenFeaturesToUrl(baseUrl, hiddenFeatures);

                           await navigator.clipboard.writeText(shareUrl);
                           toast.success(t("insurerLinkCopied") || "Insurer-only link copied!");
                         } catch (e: any) {
                           toast.error(`${t("failedToCreateShare") || "Failed to create share"}: ${e.message}`);
                         }
                       }}
                     >
                       {t("approve")}
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

export { appendHiddenFeaturesToUrl };
export default ComparisonMatrix;