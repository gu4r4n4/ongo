import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComparisonMatrix } from "@/components/dashboard/ComparisonMatrix";
import MedicalServicesHeader from "@/components/MedicalServicesHeader";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation, Language } from "@/utils/translations";
import { BACKEND_URL } from "@/config";

type Program = {
  row_id?: number;
  insurer?: string | null;
  program_code?: string | null;
  base_sum_eur?: number | null;
  premium_eur?: number | null;
  payment_method?: string | null;
  features?: Record<string, any>;
};

type OfferGroup = {
  source_file: string;            // aka document_id used as filename in DB
  programs: Program[];
  inquiry_id?: number | null;
};

type SharePayload = {
  mode: "snapshot" | "by-documents";
  title?: string | null;
  company_name?: string | null;
  employees_count?: number | null;
  document_ids?: string[];
  results?: OfferGroup[] | null;
};

export default function ShareView() {
  const { token = "" } = useParams();
  const [currentLanguage, setCurrentLanguage] = useState<Language>("lv");
  const { t } = useTranslation(currentLanguage);
  const [payload, setPayload] = useState<SharePayload | null>(null);
  const [offers, setOffers] = useState<OfferGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<number | null>(null);

  // turn API offers -> ComparisonMatrix props - match expected structure
  const { columns, allFeatureKeys } = useMemo(() => {
    const cols: any[] = [];
    const keys = new Set<string>();
    for (const g of offers) {
      for (const p of g.programs || []) {
        cols.push({
          id: `${g.source_file}:${p.insurer || "-"}:${p.program_code || "-"}`,
          insurer: p.insurer || "-",
          program_code: p.program_code || "-",  // Use underscore to match ComparisonMatrix
          row_id: p.row_id,
          premium_eur: p.premium_eur ?? null,   // Use full property name
          base_sum_eur: p.base_sum_eur ?? null, // Use full property name
          payment_method: p.payment_method || null,
          features: p.features || {},
          source_file: g.source_file,
        });
        Object.keys(p.features || {}).forEach((k) => keys.add(k));
      }
    }
    return { columns: cols, allFeatureKeys: Array.from(keys) };
  }, [offers]);

  useEffect(() => {
    let stopped = false;

    async function fetchShare() {
      setLoading(true);
      try {
        const r = await fetch(`${BACKEND_URL}/shares/${encodeURIComponent(token)}`);
        if (!r.ok) {
          setLoading(false);
          setOffers([]);
          setPayload(null);
          return;
        }
        const data = await r.json();
        if (stopped) return;

        const pl: SharePayload = data.payload || { mode: "snapshot" };
        setPayload(pl);

        // Use the server-filtered offers directly from the share response
        // This preserves any filtering like insurer_only that was applied server-side
        const serverOffers = data.offers || [];
        setOffers(serverOffers);
        setLoading(false);
      } catch (error) {
        console.error('Fetch share error:', error);
        setLoading(false);
        setOffers([]);
        setPayload(null);
      }
    }

    fetchShare();

    return () => {
      stopped = true;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [token]);

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">{t("loadingData") || "Loading…"}</div>;
  }

  if (!payload) {
    return <div className="p-6 text-sm text-destructive">Share not found or expired.</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Language Switcher */}
      <div className="flex justify-end">
        <LanguageSwitcher 
          currentLanguage={currentLanguage} 
          onLanguageChange={setCurrentLanguage} 
        />
      </div>

      {/* Title */}
      {columns.length > 0 && (
        <h3 className="text-lg font-semibold">{t('healthInsurance')}</h3>
      )}

      {/* Results Matrix */}
      {columns.length > 0 && (
        <ComparisonMatrix
          columns={columns}
          allFeatureKeys={allFeatureKeys}
          currentLanguage={currentLanguage}
          onShare={undefined}
          companyName={payload.company_name || ""}
          employeesCount={payload.employees_count || 0}
          canEdit={true}
          showBuyButtons={true}
          isShareView={true}
          backendUrl={BACKEND_URL}
        />
      )}

      {/* Medical Services Footer - Legend */}
      {columns.length > 0 && (
        <MedicalServicesHeader currentLanguage={currentLanguage} />
      )}

      {/* No data message */}
      {columns.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-sm text-muted-foreground">No data yet…</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}