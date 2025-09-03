import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Language, useTranslation } from "@/utils/translations";
import { toast } from "sonner";
import { Trash2, Download, Check, Minus } from "lucide-react"; // NOTE: use Minus instead of X
import { InsurerLogo } from "@/components/InsurerLogo";

type Insurer = 'BTA' | 'BTA2';

interface PasTabProps {
  currentLanguage: Language;
}

interface Program {
  insurer: string;
  program_code: string;
  base_sum_eur: number;
  premium_eur: number;
  payment_method?: string | null;
  features: Record<string, any>;
}

interface ApiResponse {
  source_file: string;
  programs: Program[];
  inquiry_id?: number;
  offer_ids?: number[];
}

interface UploadItem {
  file: File;
  hint: Insurer;
}

const PasTab = ({ currentLanguage }: PasTabProps) => {
  const { t } = useTranslation(currentLanguage);

  // --- NEW: extra form fields ---
  const [companyName, setCompanyName] = useState<string>("LDZ");
  const [employeesCount, setEmployeesCount] = useState<number>(45);

  const [inquiryId, setInquiryId] = useState<string>('');
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Each element in results corresponds to one uploaded file's ApiResponse
  const [results, setResults] = useState<ApiResponse[]>([]);
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);

  const onFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const pdfFiles = files.filter(file =>
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );

    if (pdfFiles.length !== files.length) {
      toast.error(t('onlyPdfAllowed') || 'Only PDF files are allowed');
    }

    const def: Insurer = 'BTA';
    const mapped = pdfFiles.map((f) => ({ file: f, hint: def }));
    setItems(mapped);
  };

  const setItemHint = (idx: number, value: Insurer) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, hint: value } : it)));
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  async function uploadOffer(file: File, companyHint: string, inquiryId?: string): Promise<ApiResponse> {
    const form = new FormData();
    form.append('file', file);
    form.append('company_hint', companyHint);
    if (inquiryId) form.append('inquiry_id', inquiryId);

    const res = await fetch('https://visbrokerhouse.onrender.com/ingest', {
      method: 'POST',
      body: form
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || `Upload failed (${res.status})`);
    }

    return (await res.json()) as ApiResponse;
  }

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.error(t('selectFiles') || 'Please select at least one PDF.');
      return;
    }

    // Validate per-file hints present
    if (items.some((it) => !it.hint)) {
      toast.error(t('selectInsurerForEachFile') || 'Please select insurer for each file.');
      return;
    }

    setIsUploading(true);
    setResults([]);
    setActiveTab(undefined);

    try {
      // If Inquiry ID is present, save metadata first
      if (inquiryId) {
        try {
          await fetch(`https://visbrokerhouse.onrender.com/inquiries/${inquiryId}/meta`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              company_name: companyName || null,
              employees_count: !employeesCount ? null : Number(employeesCount)
            }),
          }).then(r => {
            if (!r.ok) throw new Error('Failed to save inquiry meta');
          });
        } catch (err: any) {
          toast.error(`Failed to save inquiry metadata: ${err?.message || 'Unknown error'}`);
          return;
        }
      }

      // Sequential uploads; results appear as they finish
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const hint = it.hint;
        try {
          const response = await uploadOffer(it.file, hint, inquiryId || undefined);
            setResults((prev) => {
              const next = [...prev, response];
              // DEBUG: check if both files are being accumulated
              console.log("[PAS] pushed result:", it.file.name, "→ total results now:", next.length);
              if (!activeTab && next.length > 0) setActiveTab(`r${next.length - 1}`);
              return next;
            });
        } catch (err: any) {
          toast.error(`${t('failed') || 'Failed'}: ${it.file.name} — ${err?.message || 'Upload error'}`);
        }
      }
      toast.success(t('finishedProcessing') || 'Finished processing selected files.');
    } finally {
      setIsUploading(false);
    }
  };

  const exportToCSV = () => {
    const allPrograms = results.flatMap(r => r.programs);
    if (allPrograms.length === 0) return;

    const headers = [
      'Source File',
      'Insurer',
      'Program Code',
      'Base Sum (EUR)',
      'Premium (EUR)',
      'Payment Method',
      'Features'
    ];

    const rows = results.flatMap(result =>
      result.programs.map(program => [
        result.source_file,
        program.insurer,
        program.program_code,
        program.base_sum_eur,
        program.premium_eur,
        program.payment_method || '',
        Object.entries(program.features).map(([key, value]) => `${key}: ${value}`).join('; ')
      ])
    );

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pas-results-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(t('csvExported') || 'CSV exported successfully');
  };

  const ResultCard = ({ data }: { data: ApiResponse }) => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('processingResults')}</CardTitle>
          <CardDescription>
            {t('file')}: {data.source_file} • {data.programs?.length || 0} {t('programsFound')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.programs.map((program, idx) => (
            <div key={idx} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{program.insurer}</Badge>
                  <Badge>{program.program_code}</Badge>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">{t('premium')}</div>
                  <div className="font-semibold">€{program.premium_eur}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{t('baseSum')}:</span>
                  <span className="ml-2 font-medium">€{program.base_sum_eur?.toLocaleString?.() ?? program.base_sum_eur}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('payment')}:</span>
                  <span className="ml-2 font-medium capitalize">{program.payment_method || '-'}</span>
                </div>
              </div>

              {program.features && Object.keys(program.features).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm font-medium mb-2">{t('features')}:</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(program.features).map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-muted-foreground">{k}:</span>
                           <span className={v === 'Yes' || v === 'v' || v === true ? 'text-green-600' : v === 'No' || v === '-' || v === false ? 'text-red-600' : ''}>
                             {v === 'v' || v === 'Yes' || v === true ? (
                               <Check className="h-4 w-4 text-green-600" />
                             ) : v === '-' || v === 'No' || v === false ? (
                               <Minus className="h-4 w-4 text-red-600" />
                             ) : (
                               String(v)
                             )}
                           </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  const tabMeta = results.map((r, i) => {
    const p = r.programs?.[0];
    const label = p
      ? `${(p.insurer || '').toUpperCase()} — ${p.program_code || ''}`.trim()
      : r.source_file || `Result ${i + 1}`;
    return { id: `r${i}`, label, insurer: p?.insurer, file: r.source_file };
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('pasSettings')}</CardTitle>
          <CardDescription>{t('pasDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            {/* NEW: Kompānija */}
            <div>
              <Label htmlFor="company">{t('company')}</Label>
              <Input
                id="company"
                placeholder="LDZ"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            {/* NEW: Nodarbināto skaits */}
            <div>
              <Label htmlFor="emp">{t('employeeCount')}</Label>
              <Input
                id="emp"
                type="number"
                min="1"
                placeholder="45"
                value={employeesCount}
                onChange={(e) => setEmployeesCount(Number(e.target.value) || 0)}
              />
            </div>

            {/* Inquiry ID */}
            <div>
              <Label htmlFor="inq">{t('inquiryIdOptional')}</Label>
              <Input
                id="inq"
                placeholder={t('enterId')}
                value={inquiryId}
                onChange={(e) => setInquiryId(e.target.value)}
                type="number"
              />
            </div>

            {/* File picker + docx→pdf */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <Label>{t('offerUpload')} — {t('multipleAllowed')}</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://www.ilovepdf.com/word_to_pdf', '_blank')}
                  className="text-xs w-full sm:w-auto"
                >
                  {t('docxToPdf')}
                </Button>
              </div>
              <Input
                type="file"
                accept=".pdf"
                multiple
                onChange={onFilesChange}
                className="cursor-pointer"
              />
              {items.length > 0 && (
                <div className="mt-3 space-y-2">
                  <Label>{t('selectedFiles')} ({items.length})</Label>
                  {items.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded border p-2">
                      <div className="text-sm truncate">{it.file.name}</div>
                      <div className="flex items-center gap-2">
                        <InsurerLogo name={it.hint} />
                        <Select value={it.hint} onValueChange={(v: Insurer) => setItemHint(idx, v)}>
                          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BTA">BTA</SelectItem>
                            <SelectItem value="BTA2">BTA2</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(idx)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Button onClick={handleSubmit} className="w-full" disabled={isUploading}>
            {isUploading ? (t('processing') || 'Processing…') : `${t('uploadProcess')} (${items.length || 0} ${t('files')})`}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          {/* NEW: results header panel */}
          <div className="grid gap-4 sm:grid-cols-2 p-4 border rounded-lg bg-card">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">iekļauts polises segumā</span>
              </div>
              <div className="flex items-center gap-2">
                <Minus className="h-4 w-4 text-red-600" />
                <span className="text-sm text-muted-foreground">nav iekļauts polises segumā</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm">
                <span className="text-muted-foreground">{t('company')}:</span>
                <span className="ml-2 font-medium">{companyName || '—'}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">{t('employeeCount')}:</span>
                <span className="ml-2 font-medium">{employeesCount || '—'}</span>
              </div>
            </div>
          </div>

          {/* title + CSV */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t('processingResults')}</h3>
            <Button
              variant="outline"
              onClick={exportToCSV}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {t('exportCsv')}
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab ?? tabMeta[0]?.id} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex flex-wrap gap-2">
              {tabMeta.map(({ id, insurer, label }) => (
                <TabsTrigger key={id} value={id} className="flex items-center gap-2">
                  <InsurerLogo name={insurer} />
                  <span className="truncate max-w-[220px]">{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {results.map((r, i) => (
              <TabsContent key={i} value={`r${i}`} className="mt-4">
                <ResultCard data={r} />
              </TabsContent>
            ))}
          </Tabs>

          {/* Static Info Footer */}
          <div className="space-y-6 text-sm text-muted-foreground mt-8">
            <Separator />

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">
                  PACIENTA IEMAKSA — maksājums, kuru pacients veic, saņemot valsts apmaksātus veselības aprūpes pakalpojumus
                </h4>
                <a
                  href="http://www.vmnvd.gov.lv/lv/veselibas-aprupes-pakalpojumi/ambulatoras-iestades-un-arsti-specialisti"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Ārstniecības iestāžu saraksts un valsts apmaksātie ambulatorie pakalpojumi →
                </a>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold text-foreground mb-2">MAKSAS AMBULATORIE PAKALPOJUMI</h4>
                <a
                  href="http://www.vi.gov.lv/lv/air"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline block mb-3"
                >
                  Maksas pakalpojuma saņemšanai iespējams izvēlēties pakalpojuma sniedzēju →
                </a>

                <div className="space-y-1 mb-4">
                  <p>• Maksas diagnostiskajiem pakalpojumiem (laboratorija, diagnostika, terapijas) nepieciešams ārsta nosūtījums</p>
                  <p>• Veicot čeku norēķinus par maksas pakalpojumiem, tiek piemērots apdrošinātāja pakalpojuma apmaksas cenrādis (piem.skat.tabulā)</p>
                  <p>• Par apdrošinātāja neapmaksāto pakalpojuma daļu iespējams saņemt pārmaksāto IIN, iesniedzot VID gadas ienākuma deklarāciju.</p>
                </div>

                <div>
                  <h5 className="font-medium text-foreground mb-2">Ārsta vizītes</h5>
                  <div className="space-y-1">
                    <p>• Ģimenes ārsts (maksas)</p>
                    <p>• Ārsti-speciālisti — kardiologs, LOR, neirologs, ginekologs, urologs u.c.</p>
                    <p>• Dermatologs</p>
                    <p>• Homeopāts</p>
                    <p>• Osteopāts</p>
                    <p>• Sporta ārsts</p>
                    <p>• Fizikālās terapijas ārsts, rehabilitologs, fizioterapeits</p>
                    <p>• Docenta konsultācija</p>
                    <p>• Psihologa, psihoterapeita, psihiatra konsultācijas, pēc čekiem</p>
                    <p>• Attālinātas ārstu konsultācijas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasTab;
