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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { exportAllInsurerOffersXlsx } from "@/utils/exportXlsx";

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
  editable?: boolean;
  allow_edit_fields?: string[];
  role?: string;
};

export default function ShareView() {
  const { token = "" } = useParams();
  const [currentLanguage, setCurrentLanguage] = useState<Language>("lv");
  const { t } = useTranslation(currentLanguage);
  const [payload, setPayload] = useState<SharePayload | null>(null);
  const [offers, setOffers] = useState<OfferGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<number | null>(null);
  
  // Inline editing state
  const [editingMeta, setEditingMeta] = useState(false);
  const [editCompany, setEditCompany] = useState<string>("");
  const [editEmployees, setEditEmployees] = useState<string>("");

  // Helper to match ComparisonMatrix's column key format
  const columnKey = (c: any) =>
    `${c.source_file}::${c.insurer ?? ""}::${c.program_code ?? ""}`;

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
      allFeatureKeys: Array.from(keys).sort(),
      insurerName: singleInsurer || "",
      isInsurerView
    };
  }, [offers]);

  const fetchShare = async () => {
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
  };

  useEffect(() => {
    let stopped = false;

    async function loadData() {
      if (stopped) return;
      await fetchShare();
    }

    loadData();

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

  // Check if meta editing is allowed
  const canEditMeta = !!payload?.editable && (
    !payload?.allow_edit_fields?.length ||
    payload.allow_edit_fields.includes("company_name") ||
    payload.allow_edit_fields.includes("employees_count")
  );

  // Choose theme based on view type
  const selectedTheme = isInsurerView 
    ? (insurerThemes[insurerName] || appTheme)
    : brokerTheme;

  const handleExportExcel = async () => {
    if (columns.length === 0) {
      console.log("No columns to export");
      return;
    }
    
    console.log("Starting export with columns:", columns.length);
    console.log("Company:", companyName, "Employees:", employeesCount);
    
    try {
      await exportAllInsurerOffersXlsx(columns, {
        companyName,
        employeesCount,
        templateUrl: "/xlsx/health-offer-template.xlsx",
        fileName: `${companyName || "Insurance"}_Comparison_${new Date().toISOString().split('T')[0]}.xlsx`,
      });
      console.log("Export completed successfully");
    } catch (error) {
      console.error("Export failed:", error);
      alert(`Export failed: ${error.message}`);
    }
  };

  const handleSaveMeta = async (
    propagateOffers = false,
    viewPrefs?: { column_order?: string[]; hidden_features?: string[] }
  ) => {
    const body: any = {
      company_name: editCompany,
      employees_count: editEmployees === "" ? null : Number(editEmployees),
    };
    if (viewPrefs) body.view_prefs = viewPrefs;

    const url = `${BACKEND_URL}/shares/${encodeURIComponent(token)}${
      propagateOffers ? "?propagate_offers=1" : ""
    }`;

    try {
      // Try PATCH to FastAPI backend (CORS already open there)
      let res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      // Some proxies disallow PATCH; fall back to POST alias
      if (res.status === 405) {
        res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }

      await fetchShare();
      setEditingMeta(false);
    } catch (e: any) {
      alert(`Failed to save: ${e?.message || e}`);
    }
  };

  const handleExportCSV = () => {
    if (columns.length === 0) return;

    // Apply the same column ordering as displayed in ComparisonMatrix
    let orderedColumns = [...columns];
    const order = payload?.view_prefs?.column_order;
    if (order?.length) {
      const byKey = new Map(columns.map(c => [columnKey(c), c]));
      orderedColumns = order.map(k => byKey.get(k)).filter(Boolean) as any[];
      // append any new columns not in saved order
      const inOrder = new Set(order);
      for (const c of columns) {
        if (!inOrder.has(columnKey(c))) orderedColumns.push(c);
      }
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

    // Mapping from Latvian database keys to English translation keys
    const featureKeyMapping: Record<string, string> = {
      'Programmas kods': 'programCode',
      'Programmas nosaukums': 'programName',
      'Apdrošinājuma summa pamatpolisei, EUR': 'baseSumEur',
      'Pamatpolises prēmija 1 darbiniekam, EUR': 'premiumEur',
      'Pakalpojuma apmaksas veids': 'servicePaymentMethod',
      'Pacientu iemaksa': 'patientContribution',
      'Maksas ģimenes ārsta mājas vizītes, limits EUR': 'paidFamilyDoctorHomeVisits',
      'Maksas ģimenes ārsta, internista, terapeita un pediatra konsultācija, limits €': 'paidFamilyDoctorConsultation',
      'Maksas ārsta-specialista konsultācija, limits EUR': 'paidSpecialistConsultation',
      'Profesora, docenta, internista konsultācija, limits EUR': 'professorDocentConsultation',
      'Homeopāts': 'homeopathService',
      'Psihoterapeits': 'psychotherapist',
      'Sporta ārsts': 'sportsDoctorService',
      'ONLINE ārstu konsultācijas': 'onlineDoctorConsultations',
      'Laboratoriskie izmeklējumi': 'laboratoryTests',
      'Maksas diagnostika, piem., rentgens, elektrokradiogramma, USG, utml.': 'paidDiagnostics',
      'Augsto tehnoloģiju izmeklējumi, piem., MR, CT, limits (reižu skaits vai EUR)': 'highTechExaminations',
      'Augsto tehnoloģiju izmeklējumi, piem., MR, CT, limits, ja ir (reižu skaits vai EUR)': 'highTechExaminations',
      'Obligātās veselības pārbaudes, limits €': 'mandatoryHealthChecks',
      'Obligātās veselības pārbaudes, limits EUR': 'mandatoryHealthChecks',
      'Ārstnieciskās manipulācijas': 'therapeuticManipulations',
      'Medicīniskās izziņas': 'medicalCertificates',
      'Fizikālā terapija': 'physicalTherapy',
      'Procedūras': 'procedures',
      'Vakcinācija, limits €': 'vaccination',
      'Vakcinācija, limits EUR': 'vaccination',
      'Maksas grūtnieču aprūpe': 'paidPregnancyCare',
      'Maksas onkoloģiskā, hematoloģiskā ārstēšana': 'paidOncologyHematologyTreatment',
      'Neatliekamā palīdzība valsts un privātā (limits privātai, €)': 'emergencyAssistance',
      'Neatliekamā palīdzība valsts un privātā (limits privātai, EUR)': 'emergencyAssistance',
      'Maksas stacionārie pakalpojumi, limits €': 'paidInpatientServices',
      'Maksas stacionārie pakalpojumi, limits EUR': 'paidInpatientServices',
      'Maksas stacionārā rehabilitācija, limits €': 'paidInpatientRehabilitation',
      'Maksas stacionārā rehabilitācija, limits EUR': 'paidInpatientRehabilitation',
      'Ambulatorā rehabilitācija': 'outpatientRehabilitation',
      'Piemaksa par plastikāta kartēm, €': 'plasticCardSurcharge',
      'Piemaksa par plastikāta kartēm, EUR': 'plasticCardSurcharge',
      'Papildus programmas': 'additionalPrograms',
      'Zobārstniecība ar 50% atlaidi (pamatpolise)': 'dentistryDiscountBase',
      'Zobārstniecība ar 50% atlaidi (pp)': 'dentistryDiscountAdditional',
      'Vakcinācija pret ērcēm un gripu': 'tickFluVaccination',
      'Ambulatorā rehabilitācija (pp)': 'outpatientRehabilitationAdditional',
      'Medikamenti ar 50% atlaidi': 'medicationsDiscount',
      'Sports': 'sportsProgram',
      'Kritiskās saslimšanas': 'criticalIllness',
      'Maksas stacionārie pakalpojumi, limits EUR (pp)': 'paidInpatientServicesAdditional',
      'Maksas Operācijas, limits EUR': 'paidSurgeries',
      'Optika 50%, limits EUR': 'opticsDiscount',
    };

    // Helper function to translate feature keys
    const translateFeatureKey = (key: string): string => {
      // First, check if this is a Latvian key that needs to be mapped to English
      const mappedKey = featureKeyMapping[key] || key;
      
      // Try to get translation using the mapped key
      try {
        const translated = t(mappedKey as any);
        // Only return the translation if it's different from the key (meaning translation exists)
        return translated !== mappedKey ? translated : key;
      } catch {
        return key;
      }
    };

    const csvRows: string[][] = [];
    
    // ========== HEADER SECTION ==========
    csvRows.push([t('healthInsurance')]);
    csvRows.push(['']);
    
    // Legend
    csvRows.push(['✓', t('includedInPolicyCoverage')]);
    csvRows.push(['─', t('notIncludedInPolicyCoverage')]);
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
        translateFeatureKey(featureKey),
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
    
    // Create filename with company name and date
    const sanitizedCompanyName = companyName
      ? companyName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
      : 'export';
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `${sanitizedCompanyName}_${dateStr}.csv`);
    
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <BrandThemeProvider theme={selectedTheme}>
      <div className="p-4 md:p-6 space-y-6 max-w-full mx-auto">
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

        {/* Title and Action Buttons */}
        {columns.length > 0 && (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="text-lg font-semibold">{t('healthInsurance')}</h3>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                {canEditMeta && !editingMeta && (
                  <Button
                    onClick={() => {
                      setEditCompany(companyName || "");
                      setEditEmployees(String(employeesCount ?? ""));
                      setEditingMeta(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    {t('company')}
                  </Button>
                )}
                <Button
                  onClick={handleExportExcel}
                  variant="outline"
                  size="sm"
                  className="gap-2 w-full sm:w-auto"
                >
                  <Download className="h-4 w-4" />
                  {t('export')}
                </Button>
              </div>
            </div>

            {/* Inline Edit Form */}
            {editingMeta && (
              <div className="grid gap-3 sm:grid-cols-3 border rounded-lg p-4 bg-card">
                <div className="space-y-2">
                  <Label htmlFor="edit-company" className="text-sm text-muted-foreground">
                    {t('companyName')}
                  </Label>
                  <Input
                    id="edit-company"
                    value={editCompany}
                    onChange={(e) => setEditCompany(e.target.value)}
                    placeholder={t('company')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-employees" className="text-sm text-muted-foreground">
                    {t('employees')}
                  </Label>
                  <Input
                    id="edit-employees"
                    type="number"
                    min={0}
                    value={editEmployees}
                    onChange={(e) => setEditEmployees(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    onClick={() => handleSaveMeta(true)}
                    size="sm"
                    variant="outline"
                  >
                    {t('save')}
                  </Button>
                  <Button 
                    onClick={() => setEditingMeta(false)}
                    variant="outline"
                    size="sm"
                  >
                    {t('cancel')}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Results Matrix */}
        {columns.length > 0 && (
        <ComparisonMatrix
          columns={columns}
          allFeatureKeys={allFeatureKeys}
          currentLanguage={currentLanguage}
          onShare={(prefs) => handleSaveMeta(false, prefs)}
          companyName={companyName}
          employeesCount={employeesCount >= 0 ? employeesCount : undefined}
          sharePrefs={payload.view_prefs}
          canEdit={!!payload?.editable}
          showBuyButtons={payload?.role === "broker"}
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