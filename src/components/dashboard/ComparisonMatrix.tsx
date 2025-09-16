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

function toNumOrThrow(v: any, name: string): number {
  const n = Number(
    String(v)
      .trim()
      .replace("€", "")
      .replace(/\s/g, "")
      .replace(",", ".")
      .replace(/[^\d.-]/g, "")
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

const translateFeatureName = (featureKey: string, t: (key: any) => string): string => {
  const featureTranslations: Record<string, string> = {
    "Doctor visits": t("doctorVisits"),
    "General practitioner": t("familyDoctorPaid"),
    Specialist: t("specialist"),
    Dermatologist: t("dermatologist"),
    Cardiologist: t("cardiologistEtc"),
    Psychologist: t("psychologistTherapist"),
    "Sports doctor": t("sportsDoctor"),
    "Physical therapy": t("physicalTherapyDoctor"),
    "Remote consultations": t("remoteDoctorConsultations"),
  };
  return featureTranslations[featureKey] || featureKey;
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
  allFeatureKeys,
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

  // sync incoming columns unless editing
  useEffect(() => {
    if (!editingColumn) setLocalColumns(columns);
  }, [columns, editingColumn]);

  // drag-to-scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      setIsDragging(true);
      setStartX(e.pageX - container.offsetLeft);
      setScrollLeft(container.scrollLeft);
      container.style.cursor = "grabbing";
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
      container.style.cursor = "grab";
    };

    const handleMouseLeave = () => {
      setIsDragging(false);
      container.style.cursor = "grab";
    };

    container.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("mouseleave", handleMouseLeave);

    container.style.cursor = "grab";
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
    if (!column || column.type === "error") return;
    setEditingColumn(columnId);
    setEditFormData({
      premium_eur: column.premium_eur?.toString() ?? "",
      base_sum_eur: column.base_sum_eur?.toString() ?? "",
      payment_method: column.payment_method ?? "",
      insurer: column.insurer ?? "",
      program_code: column.program_code ?? "",
      features: { ...(column.features ?? {}) },
    });
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
    const column = localColumns.find((col) => col.id === editingColumn);
    if (!column) return;
    if (!column.row_id) {
      toast.error("Missing row_id for this program");
      return;
    }

    try {
      // compute changed fields
      const changes: Record<string, any> = {};
      if (editFormData.premium_eur !== undefined) changes.premium_eur = editFormData.premium_eur;
      if (editFormData.base_sum_eur !== undefined) changes.base_sum_eur = editFormData.base_sum_eur;
      if (editFormData.payment_method !== undefined) changes.payment_method = editFormData.payment_method;
      if (editFormData.insurer !== undefined) changes.insurer = editFormData.insurer;
      if (editFormData.program_code !== undefined) changes.program_code = editFormData.program_code;

      if (editFormData.features) {
        const original = JSON.stringify(column.features || {});
        const next = JSON.stringify(editFormData.features || {});
        if (original !== next) changes.features = editFormData.features;
      }

      if (Object.keys(changes).length === 0) {
        setEditingColumn(null);
        setEditFormData({});
        toast.message("No changes to save");
        return;
      }

      await updateOffer(column.row_id, changes, backendUrl);

      // optimistic local update for snappy UX
      setLocalColumns((prev) =>
        prev.map((c) =>
          c.id !== column.id
            ? c
            : {
                ...c,
                premium_eur:
                  changes.premium_eur !== undefined ? toNumOrThrow(changes.premium_eur, "premium_eur") : c.premium_eur,
                base_sum_eur:
                  changes.base_sum_eur !== undefined ? toNumOrThrow(changes.base_sum_eur, "base_sum_eur") : c.base_sum_eur,
                payment_method: changes.payment_method !== undefined ? String(changes.payment_method) : c.payment_method,
                insurer: changes.insurer !== undefined ? String(changes.insurer) : c.insurer,
                program_code: changes.program_code !== undefined ? String(changes.program_code) : c.program_code,
                features: changes.features !== undefined ? (changes.features as Record<string, any>) : c.features,
              }
        )
      );

      // close edit first so new props can flow in
      setEditingColumn(null);
      setEditFormData({});

      // optional re-fetch from backend to stay authoritative
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
  ] as const;

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
            {typeof employeesCount === "number" && (
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
              {/* Sticky Feature Names Column Header */}
              <div className={`w-[280px] bg-card border-r p-4 ${isMobile ? "" : "sticky left-0 z-30"}`}>
                <div className="font-semibold text-sm">{t("features")}</div>
              </div>

              {/* Program Column Headers */}
              {localColumns.map((column) => {
                const isEditing = editingColumn === column.id;

                if (column.type === "error") {
                  return (
                    <div
                      key={column.id}
                      className="w-[240px] flex-shrink-0 p-4 border-r last:border-r-0 bg-red-50 dark:bg-red-950/20"
                    >
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className="w-12 h-12 flex items-center justify-center rounded-md bg-red-100 dark:bg-red-900/30">
                          <X className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="font-semibold text-sm text-red-600">{column.label}</div>
                        <Badge variant="destructive" className="text-xs">
                          FAILED
                        </Badge>
                        <div className="text-xs text-red-600 max-w-full break-words">{column.error || "Processing Failed"}</div>
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
                      {isEditing ? (
                        <div className="w-full space-y-2">
                          <Input
                            placeholder={t("insurer")}
                            value={editFormData.insurer ?? ""}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                insurer: e.target.value,
                              }))
                            }
                            className="text-center"
                          />
                          <Input
                            placeholder={t("programCode")}
                            value={editFormData.program_code ?? ""}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                program_code: e.target.value,
                              }))
                            }
                            className="text-center"
                          />
                          <Input
                            placeholder={t("premium")}
                            type="number"
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
                          <div className="font-semibold text-sm truncate w-full">{column.insurer}</div>
                          <Badge variant="outline" className="text-xs truncate max-w-full">
                            {column.program_code}
                          </Badge>
                          <div className="text-lg font-bold text-primary truncate">
                            €{column.premium_eur?.toLocaleString() || "—"}
                          </div>
                          {canEdit && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEdit(column.id)}
                              className="h-6 w-full p-0 text-xs"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Meta Rows */}
            {metaRows.map((row) => (
              <div key={row.key} className="flex border-b">
                <div className={`w-[280px] bg-black border-r p-4 z-10 shadow-lg ${isMobile ? "" : "sticky left-0"}`}>
                  <div className="font-medium text-sm text-white">{row.label}</div>
                </div>

                {localColumns.map((column) => {
                  const isEditing = editingColumn === column.id;
                  const value = (column as any)[row.key];

                  if (column.type === "error") {
                    return (
                      <div
                        key={column.id}
                        className="w-[240px] flex-shrink-0 p-4 border-r last:border-r-0 flex items-center justify-center bg-red-50 dark:bg-red-950/20"
                      >
                        {row.key === "base_sum_eur" ? (
                          <div className="text-xs text-red-600 text-center max-w-full break-words px-2">
                            {column.error || "Processing failed"}
                          </div>
                        ) : (
                          <span className="text-sm text-red-400">—</span>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={column.id}
                      className="w-[240px] flex-shrink-0 p-4 border-r last:border-r-0 flex items-center justify-center"
                    >
                      {isEditing && row.key === "payment_method" ? (
                        <Select
                          value={editFormData.payment_method || ""}
                          onValueChange={(val) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              payment_method: val,
                            }))
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                            <SelectItem value="one-time">One-time</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : isEditing && row.key === "base_sum_eur" ? (
                        <Input
                          type="number"
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
                      ) : (
                        <span className="text-sm">{value || "—"}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Feature Rows */}
            {allFeatureKeys.map((featureKey, index) => (
              <div key={featureKey} className={`flex border-b ${index % 2 === 0 ? "bg-muted/10" : ""}`}>
                <div className={`w-[280px] bg-black border-r p-4 z-10 shadow-lg ${isMobile ? "" : "sticky left-0"}`}>
                  <div className="text-sm font-medium text-white">{translateFeatureName(featureKey, t)}</div>
                </div>

                {localColumns.map((column) => {
                  const isEditing = editingColumn === column.id;
                  const value = column.features?.[featureKey];

                  if (column.type === "error") {
                    return (
                      <div
                        key={column.id}
                        className="w-[240px] flex-shrink-0 p-4 border-r last:border-r-0 flex items-center justify-center bg-red-50 dark:bg-red-950/20"
                      >
                        <Minus className="h-4 w-4 text-red-400" />
                      </div>
                    );
                  }

                  return (
                    <div
                      key={column.id}
                      className="w-[240px] flex-shrink-0 p-4 border-r last:border-r-0 flex items-center justify-center"
                    >
                      {isEditing ? (
                        <Input
                          value={editFormData.features?.[featureKey] ?? ""}
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

            {/* Buy Buttons Row - only in share view */}
            {showBuyButtons && (
              <div className="flex border-b">
                <div className={`w-[280px] bg-black border-r p-4 z-10 shadow-lg ${isMobile ? "" : "sticky left-0"}`}>
                  <div className="text-sm font-medium text-white">Buy Now</div>
                </div>
                {localColumns.map((column) => (
                  <div
                    key={column.id}
                    className="w-[240px] flex-shrink-0 p-4 border-r last:border-r-0 flex items-center justify-center"
                  >
                    {column.type !== "error" && (
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => toast.success(`Buying ${column.insurer} plan...`)}
                      >
                        Pirkt
                      </Button>
                    )}
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