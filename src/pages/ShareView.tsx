import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComparisonMatrix } from "@/components/dashboard/ComparisonMatrix";
import MedicalServicesHeader from "@/components/MedicalServicesHeader";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation, Language } from "@/utils/translations";
import { BACKEND_URL } from "@/config";
import { BrandThemeProvider } from "@/theme/BrandThemeProvider";
import { brokerTheme, insurerThemes, appTheme } from "@/theme/brandTheme";
import { InsurerLogo } from "@/components/InsurerLogo";
import { Check, Minus } from "lucide-react";

type Program = {
  row_id?: number;
  insurer?: string | null;
  program_code?: string | null;
  base_sum_eur?: number | null;
  premium_eur?: number | null;
  payment_method?: string | null;
  features?: Record<string, any>;
  company_name?: string | null;
  employee_count?: number | null;
};

type OfferGroup = {
  source_file: string;            // aka document_id used as filename in DB
  programs: Program[];
  inquiry_id?: number | null;
  company_name?: string | null;   // <- add
  employee_count?: number | null; // <- add
};

type SharePayload = {
  mode: "snapshot" | "by-documents";
  title?: string | null;
  company_name?: string | null;
  employees_count?: number | null;
  document_ids?: string[];
  results?: OfferGroup[] | null;
  customer?: {
    name?: string;
    employees_count?: number;
  } | null;
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
  const { columns, allFeatureKeys, insurerName, isInsurerView } = useMemo(() => {
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
          company_name: g.company_name ?? null,   // carry group meta
          employee_count: g.employee_count ?? null,  // carry group meta
          features: p.features || {},
          source_file: g.source_file,
        });
        Object.keys(p.features || {}).forEach((k) => keys.add(k));
      }
    }
    
    // Detect if this is an insurer view (all columns from same insurer)
    const uniqueInsurers = [...new Set(cols.map(c => c.insurer))];
    const singleInsurer = uniqueInsurers.length === 1 ? uniqueInsurers[0] : null;
    const isInsurerView = singleInsurer !== null && singleInsurer !== "-";
    
    return { 
      columns: cols, 
      allFeatureKeys: Array.from(keys),
      insurerName: singleInsurer || "",
      isInsurerView
    };
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
        
        // Handle customer data from backend - can be in payload directly or in customer object
        if (data.customer && !pl.customer) {
          pl.customer = data.customer;
        }
        
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

  // Get company info from group level (correct), fallback to payload
  const firstGroup = offers[0];
  const companyName =
    firstGroup?.company_name ??
    payload.company_name ??
    payload.customer?.name ??
    "";
  const employeesCount =
    (firstGroup?.employee_count ?? null) ??
    (payload.employees_count ?? null) ??
    (payload.customer?.employees_count ?? null) ??
    0;

  // Choose theme based on view type
  const selectedTheme = isInsurerView 
    ? (insurerThemes[insurerName] || appTheme)
    : brokerTheme;

  return (
    <BrandThemeProvider theme={selectedTheme}>
      <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
        {/* Header with Logo and Language Switcher */}
        <div className="flex justify-between items-start">
          {/* Logo - Top Left */}
          <div className="flex items-center">
            {isInsurerView ? (
              <InsurerLogo name={insurerName} className="h-12 w-auto" />
            ) : (
              <img 
                src="/logos/broker-logo.png" 
                alt="Broker Logo" 
                className="h-12 w-auto"
              />
            )}
          </div>
          
          {/* Language Switcher - Top Right */}
          <div>
            <LanguageSwitcher 
              currentLanguage={currentLanguage} 
              onLanguageChange={setCurrentLanguage} 
            />
          </div>
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
            companyName={companyName}
            employeesCount={employeesCount >= 0 ? employeesCount : undefined}
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
    </BrandThemeProvider>
  );
}