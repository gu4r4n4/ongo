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
import { Check, Minus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  view_prefs?: {
    column_order?: string[];
    hidden_features?: string[];
  };
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
          id: p.row_id ? String(p.row_id) : `${g.source_file}:${p.insurer || "-"}:${p.program_code || "-"}:${cols.length}`,
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
        
        console.log('📗 ShareView loaded with view_prefs:', pl.view_prefs);
        console.log('📗 Column order:', pl.view_prefs?.column_order?.length || 0, 'items');
        console.log('📗 Hidden features:', pl.view_prefs?.hidden_features?.length || 0, 'items');
        
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

  const handleExportCSV = () => {
    if (columns.length === 0) return;

    // Apply the same column ordering as displayed in ComparisonMatrix
    let orderedColumns = [...columns];
    if (payload?.view_prefs?.column_order) {
      const order = payload.view_prefs.column_order;
      orderedColumns = order
        .map(id => columns.find(c => c.id === id))
        .filter(Boolean) as any[];
      // Add any columns not in the order list
      const orderedIds = new Set(order);
      columns.forEach(col => {
        if (!orderedIds.has(col.id)) {
          orderedColumns.push(col);
        }
      });
    }

    // Helper function to extract clean value from feature data
    const getCleanValue = (value: any): string => {
      if (value === null || value === undefined) return '-';
      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
      if (typeof value === 'object') {
        // If it's an object with a "value" property, extract it
        if ('value' in value) {
          const innerValue = value.value;
          if (typeof innerValue === 'boolean') return innerValue ? 'Yes' : 'No';
          if (innerValue === null || innerValue === undefined) return '-';
          return String(innerValue);
        }
        return JSON.stringify(value);
      }
      return String(value);
    };

    const csvRows: string[][] = [];
    
    // ========== HEADER SECTION ==========
    csvRows.push([t('healthInsurance')]);
    csvRows.push(['']);
    
    if (companyName) {
      csvRows.push([t('companyName'), companyName]);
    }
    if (employeesCount > 0) {
      csvRows.push([t('employees'), employeesCount.toString()]);
    }
    
    csvRows.push(['']);
    csvRows.push(['']);
    
    // ========== PROCESSING RESULTS SECTION ==========
    // Row 1: Insurer names
    csvRows.push([
      t('feature'),
      ...orderedColumns.map(col => col.insurer || '-')
    ]);
    
    // Row 2: Program codes
    csvRows.push([
      t('programCode'),
      ...orderedColumns.map(col => col.program_code || '-')
    ]);
    
    // Row 3: Premium
    csvRows.push([
      t('premiumEur'),
      ...orderedColumns.map(col => col.premium_eur?.toString() || '-')
    ]);
    
    // Row 4: Base Sum
    csvRows.push([
      t('baseSumEur'),
      ...orderedColumns.map(col => col.base_sum_eur?.toString() || '-')
    ]);
    
    // Row 5: Payment Method
    csvRows.push([
      t('paymentMethod'),
      ...orderedColumns.map(col => col.payment_method || '-')
    ]);
    
    // Rows 6+: All features (apply same filter as displayed)
    const visibleFeatures = allFeatureKeys.filter(
      key => !payload?.view_prefs?.hidden_features?.includes(key)
    );
    
    visibleFeatures.forEach(featureKey => {
      const row = [
        featureKey,
        ...orderedColumns.map(col => {
          const value = col.features?.[featureKey];
          return getCleanValue(value);
        })
      ];
      csvRows.push(row);
    });
    
    csvRows.push(['']);
    csvRows.push(['']);
    
    // ========== FOOTER SECTION ==========
    csvRows.push([t('patientPaymentTitle')]);
    csvRows.push([t('waitingTimeLink'), 'https://www.rindapiearsta.lv/lv/mekle_isako']);
    csvRows.push(['']);
    
    // Service Availability
    csvRows.push([t('serviceAvailability')]);
    csvRows.push([t('contractedFacilityService')]);
    csvRows.push([t('receiptPayment')]);
    csvRows.push([t('familyDoctorVisit')]);
    csvRows.push([t('specialistVisit')]);
    csvRows.push([t('hospitalTreatment')]);
    csvRows.push([t('dayCareHospital')]);
    csvRows.push(['']);
    
    // Health Checks
    csvRows.push([t('mandatoryHealthChecksTitle'), 'https://likumi.lv/doc.php?id=189070']);
    csvRows.push([t('driverLicenseInfoLink'), 'https://www.csdd.lv/veselibas-parbaude/karteja-parbaude']);
    csvRows.push(['']);
    
    // Patient Payment
    csvRows.push([t('patientPayment')]);
    csvRows.push([t('patientPaymentDesc')]);
    csvRows.push([t('treatmentFacilitiesLink'), 'https://www.vmnvd.gov.lv/lv/veselibas-aprupes-pakalpojumi/ambulatoras-iestades-un-arsti-specialisti']);
    csvRows.push(['']);
    
    // Paid Services
    csvRows.push([t('paidServices')]);
    csvRows.push([t('paidServicesDesc')]);
    csvRows.push([t('paidServiceProviderLink'), 'https://registri.vi.gov.lv/air']);
    csvRows.push([t('diagnosticsReferralNote')]);
    csvRows.push([t('insurerPricelistNote')]);
    csvRows.push([t('taxRefundNote')]);
    csvRows.push(['']);
    
    // Doctor Visits
    csvRows.push([t('doctorVisits')]);
    csvRows.push([t('doctorVisitsDesc')]);
    csvRows.push(['']);
    
    // Medical Categories
    csvRows.push([t('general')]);
    csvRows.push([t('familyDoctorPaid')]);
    csvRows.push(['']);
    
    csvRows.push([t('specialist')]);
    csvRows.push([t('cardiologistEtc')]);
    csvRows.push([t('gynecologistEtc')]);
    csvRows.push(['']);
    
    csvRows.push([t('skin')]);
    csvRows.push([t('dermatologist')]);
    csvRows.push(['']);
    
    csvRows.push([t('alternative')]);
    csvRows.push([t('homeopath')]);
    csvRows.push([t('osteopath')]);
    csvRows.push(['']);
    
    csvRows.push([t('sports')]);
    csvRows.push([t('sportsDoctor')]);
    csvRows.push(['']);
    
    csvRows.push([t('therapy')]);
    csvRows.push([t('physicalTherapyDoctor')]);
    csvRows.push([t('rehabilitationPhysio')]);
    csvRows.push(['']);
    
    csvRows.push([t('academic')]);
    csvRows.push([t('docentConsultation')]);
    csvRows.push(['']);
    
    csvRows.push([t('mental')]);
    csvRows.push([t('psychologistTherapist')]);
    csvRows.push([t('psychiatristReceipts')]);
    csvRows.push(['']);
    
    csvRows.push([t('remote')]);
    csvRows.push([t('remoteDoctorConsultations')]);

    // Create CSV content
    const csvContent = csvRows
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `processing_results_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

        {/* Title and Export Button */}
        {columns.length > 0 && (
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{t('healthInsurance')}</h3>
            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {t('exportCsv')}
            </Button>
          </div>
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
          sharePrefs={payload.view_prefs}
          canEdit={true}
          showBuyButtons={true}
          isShareView={true}
          backendUrl={BACKEND_URL}
          shareToken={token}
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