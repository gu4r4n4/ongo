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
import { Trash2, Check, Minus, Share2, Edit, Save, X } from "lucide-react"; // replaced Download with Share2
import { InsurerLogo } from "@/components/InsurerLogo";

type Insurer = 'BTA' | 'Balta' | 'BAN' | 'Compensa' | 'ERGO' | 'Gjensidige' | 'If' | 'Seesam';

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

  const handleResultSave = (resultIndex: number, updatedData: ApiResponse) => {
    setResults(prev => prev.map((result, idx) => 
      idx === resultIndex ? updatedData : result
    ));
  };

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

  async function uploadMultipleOffers(files: UploadItem[], inquiryId?: string): Promise<ApiResponse[]> {
    const form = new FormData();
    
    // Add all files
    files.forEach((item) => {
      form.append('files', item.file);
    });
    
    // Add metadata (using the first item's hint as the insurer)
    if (files.length > 0) {
      form.append('insurer', files[0].hint);
    }
    form.append('company', companyName);
    form.append('insured_count', employeesCount.toString());
    if (inquiryId) form.append('inquiry_id', inquiryId);

    const res = await fetch('https://gpt-vis.onrender.com/extract/multiple', {
      method: 'POST',
      body: form
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || `Upload failed (${res.status})`);
    }

    const response = await res.json();
    
    // Convert response to match expected ApiResponse format
    if (Array.isArray(response)) {
      return response;
    } else {
      // If single response, wrap in array
      return [response];
    }
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

      // Upload all files at once using the new multiple endpoint
      try {
        const allResults = await uploadMultipleOffers(items, inquiryId || undefined);
        setResults(allResults);
        if (!activeTab && allResults.length > 0) {
          setActiveTab('r0');
        }
      } catch (err: any) {
        toast.error(`${t('failed') || 'Failed'}: ${err?.message || 'Upload error'}`);
      }
      toast.success(t('finishedProcessing') || 'Finished processing selected files.');
    } finally {
      setIsUploading(false);
    }
  };

  // ----- Share: snapshot current results and open public link -----
  const shareResults = async () => {
    if (results.length === 0) {
      toast.error(t('selectFiles') || 'Please process results before sharing.');
      return;
    }

    const snapshot = {
      company_name: companyName || null,
      employees_count: Number.isFinite(Number(employeesCount)) ? Number(employeesCount) : null,
      document_ids: results.map(r => r.source_file),
      title: "Piedāvājums",
      results: results.map(r => ({
        source_file: r.source_file,
        programs: r.programs, // matches backend Program
      })),
      // expires_in_hours: 720, // optional (default 30 days)
    };

    try {
      const res = await fetch('https://visbrokerhouse.onrender.com/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || `Failed (${res.status})`);
      }

      const { token } = await res.json();
      const url = `${window.location.origin}/share/${encodeURIComponent(token)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      toast.success('Share link created');
    } catch (err: any) {
      toast.error(`${t('failed') || 'Failed'}: ${err?.message || 'Share error'}`);
    }
  };

  const ResultCard = ({ data, onSave }: { data: ApiResponse; onSave: (updatedData: ApiResponse) => void }) => {
    const [editingProgram, setEditingProgram] = useState<number | null>(null);
    const [editData, setEditData] = useState<Program | null>(null);

    // If any program is BTA/BTA2, show the LV title; else default i18n title
    const usesBTA = data.programs.some(p => p.insurer === 'BTA' || p.insurer === 'BTA2');
    const cardTitle = usesBTA ? 'Veselības apdrošināšana' : t('processingResults');

    const startEdit = (programIdx: number) => {
      setEditingProgram(programIdx);
      setEditData({ ...data.programs[programIdx] });
    };

    const cancelEdit = () => {
      setEditingProgram(null);
      setEditData(null);
    };

    const saveEdit = async () => {
      if (editingProgram === null || !editData) return;

      try {
        const updatedPrograms = [...data.programs];
        updatedPrograms[editingProgram] = editData;
        const updatedData = { ...data, programs: updatedPrograms };
        
        onSave(updatedData);
        setEditingProgram(null);
        setEditData(null);
        toast.success('Program updated successfully');
      } catch (error) {
        toast.error('Failed to save changes');
      }
    };

    const updateEditField = (field: keyof Program, value: any) => {
      if (!editData) return;
      setEditData({ ...editData, [field]: value });
    };

    const updateFeature = (key: string, value: any) => {
      if (!editData) return;
      setEditData({
        ...editData,
        features: { ...editData.features, [key]: value }
      });
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle>{cardTitle}</CardTitle>
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
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">{t('premium')}</div>
                    <div className="font-semibold">€{program.premium_eur}</div>
                  </div>
                  {editingProgram === idx ? (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={saveEdit}
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelEdit}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEdit(idx)}
                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {editingProgram === idx && editData ? (
                // Edit mode
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`base-sum-${idx}`} className="text-sm">{t('baseSum')}</Label>
                      <Input
                        id={`base-sum-${idx}`}
                        type="number"
                        value={editData.base_sum_eur || ''}
                        onChange={(e) => updateEditField('base_sum_eur', parseFloat(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`premium-${idx}`} className="text-sm">{t('premium')}</Label>
                      <Input
                        id={`premium-${idx}`}
                        type="number"
                        value={editData.premium_eur || ''}
                        onChange={(e) => updateEditField('premium_eur', parseFloat(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor={`payment-${idx}`} className="text-sm">{t('payment')}</Label>
                     <Select 
                       value={editData.payment_method || 'cenraza'} 
                       onValueChange={(v) => updateEditField('payment_method', v)}
                     >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="cenraza">Cenrāža programma</SelectItem>
                         <SelectItem value="100-percent-full">100% apmaksa līgumiestādēs un ja pakalpojums ir nopirkts</SelectItem>
                         <SelectItem value="100-percent">100% apmaksa līgumiestādēs</SelectItem>
                         <SelectItem value="procentuala">Procentuāla programma</SelectItem>
                       </SelectContent>
                    </Select>
                  </div>

                  {editData.features && Object.keys(editData.features).length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <div className="text-sm font-medium mb-2">{t('features')}:</div>
                        <div className="grid grid-cols-1 gap-3">
                           {Object.entries(editData.features).map(([k, v]) => (
                            <div key={k} className="flex items-center gap-2">
                              <Label className="text-sm flex-1">{k}:</Label>
                              <Input
                                type="text"
                                value={String(v)}
                                onChange={(e) => updateFeature(k, e.target.value)}
                                className="w-32"
                                placeholder="Enter value"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                // View mode
                <>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
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
     const label = p?.insurer || r.source_file || `Result ${i + 1}`;
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
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded border p-3">
                      <div className="text-sm truncate flex-1">{it.file.name}</div>
                      <div className="flex items-center justify-between sm:justify-end gap-2">
                        <InsurerLogo name={it.hint} />
                        <Select value={it.hint} onValueChange={(v: Insurer) => setItemHint(idx, v)}>
                          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BTA">BTA</SelectItem>
                            <SelectItem value="Balta">Balta</SelectItem>
                            <SelectItem value="BAN">BAN</SelectItem>
                            <SelectItem value="Compensa">Compensa</SelectItem>
                            <SelectItem value="ERGO">ERGO</SelectItem>
                            <SelectItem value="Gjensidige">Gjensidige</SelectItem>
                            <SelectItem value="If">If</SelectItem>
                            <SelectItem value="Seesam">Seesam</SelectItem>
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

          {/* title + SHARE */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t('processingResults')}</h3>
            <Button
              variant="outline"
              onClick={shareResults}
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              {t('share')}
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab ?? tabMeta[0]?.id} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-1 h-auto p-1">
               {tabMeta.map(({ id, insurer, label }) => (
                 <TabsTrigger 
                   key={id} 
                   value={id} 
                   className="flex flex-col items-center gap-1 text-xs sm:text-sm p-3 h-auto min-w-[80px]"
                 >
                   <div className="w-8 h-8 flex items-center justify-center">
                     <InsurerLogo name={insurer} className="w-full h-full object-contain" />
                   </div>
                   <span className="truncate text-center leading-tight">{label}</span>
                 </TabsTrigger>
               ))}
            </TabsList>

            {results.map((r, i) => (
              <TabsContent key={i} value={`r${i}`} className="mt-4">
                <ResultCard data={r} onSave={(updatedData) => handleResultSave(i, updatedData)} />
              </TabsContent>
            ))}
          </Tabs>

          {/* Static Info Footer */}
          <div className="mt-8">
            <Separator />
            
            <div className="grid gap-6 mt-6 md:grid-cols-2">
              {/* Patient Payment Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    PACIENTA IEMAKSA
                  </CardTitle>
                  <CardDescription>
                    Maksājums, kuru pacients veic, saņemot valsts apmaksātus veselības aprūpes pakalpojumus
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <a
                    href="http://www.vmnvd.gov.lv/lv/veselibas-aprupes-pakalpojumi/ambulatoras-iestades-un-arsti-specialisti"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    Ārstniecības iestāžu saraksts un valsts apmaksātie ambulatorie pakalpojumi →
                  </a>
                </CardContent>
              </Card>

              {/* Paid Services Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    MAKSAS AMBULATORIE PAKALPOJUMI
                  </CardTitle>
                  <CardDescription>
                    Privāti apmaksāti medicīnas pakalpojumi
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <a
                    href="http://www.vi.gov.lv/lv/air"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm block"
                  >
                    Maksas pakalpojuma saņemšanai iespējams izvēlēties pakalpojuma sniedzēju →
                  </a>
                  
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Maksas diagnostiskajiem pakalpojumiem nepieciešams ārsta nosūtījums</p>
                    <p>• Tiek piemērots apdrošinātāja pakalpojuma apmaksas cenrādis</p>
                    <p>• Par neapmaksāto daļu iespējams saņemt pārmaksāto IIN</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Doctor Visits Card */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Ārsta vizītes</CardTitle>
                <CardDescription>Pieejamie medicīnas speciālisti un pakalpojumi</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {/* General */}
                  <div className="space-y-2">
                    <Badge variant="secondary" className="mb-2 bg-badge-category text-black hover:bg-badge-category hover:text-black">{t('general')}</Badge>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>• Ģimenes ārsts (maksas)</p>
                    </div>
                  </div>

                  {/* Specialists */}
                  <div className="space-y-2">
                    <Badge variant="outline" className="mb-2 bg-badge-category text-black">{t('specialist')}</Badge>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>• Kardiologs, LOR, neirologs</p>
                      <p>• Ginekologs, urologs u.c.</p>
                    </div>
                  </div>

                  {/* Skin */}
                  <div className="space-y-2">
                    <Badge variant="outline" className="mb-2 bg-badge-category text-black">{t('skin')}</Badge>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>• Dermatologs</p>
                    </div>
                  </div>

                  {/* Alternative */}
                  <div className="space-y-2">
                    <Badge variant="outline" className="mb-2 bg-badge-category text-black">{t('alternative')}</Badge>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>• Homeopāts</p>
                      <p>• Osteopāts</p>
                    </div>
                  </div>

                  {/* Sports */}
                  <div className="space-y-2">
                    <Badge variant="outline" className="mb-2 bg-badge-category text-black">{t('sports')}</Badge>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>• Sporta ārsts</p>
                    </div>
                  </div>

                  {/* Therapy */}
                  <div className="space-y-2">
                    <Badge variant="outline" className="mb-2 bg-badge-category text-black">{t('therapy')}</Badge>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>• Fizikālās terapijas ārsts</p>
                      <p>• Rehabilitologs, fizioterapeits</p>
                    </div>
                  </div>

                  {/* Academic */}
                  <div className="space-y-2">
                    <Badge variant="outline" className="mb-2 bg-badge-category text-black">{t('academic')}</Badge>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>• Docenta konsultācija</p>
                    </div>
                  </div>

                  {/* Mental Health */}
                  <div className="space-y-2">
                    <Badge variant="outline" className="mb-2 bg-badge-category text-black">{t('mental')}</Badge>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>• Psihologs, psihoterapeits</p>
                      <p>• Psihiatrs (pēc čekiem)</p>
                    </div>
                  </div>

                  {/* Remote */}
                  <div className="space-y-2">
                    <Badge variant="outline" className="mb-2 bg-badge-category text-black">{t('remote')}</Badge>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>• Attālinātas ārstu konsultācijas</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasTab;
