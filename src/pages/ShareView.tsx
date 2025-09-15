import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComparisonMatrix } from "@/components/dashboard/ComparisonMatrix";
import MedicalServicesHeader from "@/components/MedicalServicesHeader";
import { useTranslation, Language } from "@/utils/translations";
import { BACKEND_URL } from "@/config";

type Program = {
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
  const { t } = useTranslation("lv" as Language);
  const [payload, setPayload] = useState<SharePayload | null>(null);
  const [offers, setOffers] = useState<OfferGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<number | null>(null);

  // turn API offers -> ComparisonMatrix props
  const { columns, allFeatureKeys } = useMemo(() => {
    const cols: any[] = [];
    const keys = new Set<string>();
    for (const g of offers) {
      for (const p of g.programs || []) {
        cols.push({
          id: `${g.source_file}:${p.insurer || "-"}:${p.program_code || "-"}`,
          insurer: p.insurer || "-",
          programCode: p.program_code || "-",
          premium: p.premium_eur ?? null,
          baseSum: p.base_sum_eur ?? null,
          features: p.features || {},
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

        if (pl.mode === "snapshot" && pl.results) {
          setOffers(pl.results);
          setLoading(false);
          return;
        }

        // by-documents: start polling those exact doc ids
        const docIds = pl.document_ids || [];
        const poll = async () => {
          try {
            const rr = await fetch(`${BACKEND_URL}/offers/by-documents`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ document_ids: docIds }),
            });
            if (rr.ok) {
              const current = await rr.json();
              if (!stopped) setOffers(current || []);
            }
          } catch (error) {
            console.error('Polling error:', error);
          }
        };

        // initial + interval
        await poll();
        pollRef.current = window.setInterval(poll, 2500);
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
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {payload.title || "Piedāvājums"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">{t("company") || "Company"}:</span>
            <span className="ml-2 font-medium">{payload.company_name || "—"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t("employeeCount") || "Employees"}:</span>
            <span className="ml-2 font-medium">{payload.employees_count ?? "—"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Results Matrix */}
      {columns.length > 0 && (
        <ComparisonMatrix
          columns={columns}
          allFeatureKeys={allFeatureKeys}
          currentLanguage={"lv" as Language}
          onShare={undefined}
          companyName={payload.company_name || ""}
          employeesCount={payload.employees_count || 0}
          canEdit={false}
        />
      )}

      {/* Medical Services Footer - Legend */}
      {columns.length > 0 && (
        <MedicalServicesHeader currentLanguage={"lv" as Language} />
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