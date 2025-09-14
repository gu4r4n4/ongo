import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Language, useTranslation } from "@/utils/translations";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { InsurerLogo } from "@/components/InsurerLogo";
import { ComparisonMatrix } from "./ComparisonMatrix";
import MedicalServicesHeader from "@/components/MedicalServicesHeader";
import { BACKEND_URL } from "@/config";

type Insurer = 'BTA' | 'Balta' | 'BAN' | 'Compensa' | 'ERGO' | 'Gjensidige' | 'If' | 'Seesam';

interface PasTabProps {
  currentLanguage: Language;
}

interface UploadItem {
  file: File;
  hint: Insurer;
}

const PasTab = ({ currentLanguage }: PasTabProps) => {
  const { t } = useTranslation(currentLanguage);

  // Form fields
  const [companyName, setCompanyName] = useState<string>("LDZ");
  const [employeesCount, setEmployeesCount] = useState<number>(45);
  const [inquiryId, setInquiryId] = useState<string>('');
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // New state for document-based polling
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [docIds, setDocIds] = useState<string[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [allFeatureKeys, setAllFeatureKeys] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [job, setJob] = useState<{ total: number; done: number; errors: any[] } | null>(null);

  // Build matrix from offers data
  function buildMatrix(grouped: any[]) {
    const cols = grouped.flatMap((g) =>
      g.programs.map((program: any) => ({
        id: `${g.source_file}::${program.insurer}::${program.program_code}`,
        label: program.insurer || g.source_file,
        source_file: g.source_file,
        insurer: program.insurer,
        program_code: program.program_code,
        premium_eur: program.premium_eur,
        base_sum_eur: program.base_sum_eur,
        payment_method: program.payment_method,
        features: program.features || {},
        group: g,
      }))
    );
    setColumns(cols);

    const featureSet = new Set<string>();
    for (const col of cols) {
      Object.keys(col.features || {}).forEach((k) => featureSet.add(k));
    }
    setAllFeatureKeys(Array.from(featureSet).sort());
  }

  // Save offers to Supabase database
  async function saveOffersToDatabase(offersData: any[]) {
    const { supabase } = await import('@/integrations/supabase/client');
    
    for (const group of offersData) {
      for (const program of group.programs || []) {
        // Extract filename from document ID (format: job_id::n::filename)
        const sourceFile = group.source_file;
        const filenamePart = sourceFile.split('::').pop(); // Get the last part after ::
        
        // Find the corresponding insurer hint from the original file selection
        const originalItem = items.find(item => 
          item.file.name === filenamePart || 
          filenamePart?.includes(item.file.name) ||
          item.file.name.includes(filenamePart || '')
        );
        
        const company_hint = originalItem?.hint || null;
        
        console.log('Saving offer with:', {
          sourceFile,
          filenamePart, 
          originalFileName: originalItem?.file.name,
          company_hint,
          insurer: program.insurer
        });
        
        const offerData = {
          filename: sourceFile,
          insurer: program.insurer,
          company_hint: company_hint,
          program_code: program.program_code,
          base_sum_eur: program.base_sum_eur,
          premium_eur: program.premium_eur,
          payment_method: program.payment_method,
          features: program.features || {},
          company_name: companyName,
          employee_count: employeesCount,
          inquiry_id: inquiryId ? parseInt(inquiryId) : null
        };

        try {
          const { error } = await supabase.rpc('upsert_offer_with_features', { 
            p: offerData 
          });
          if (error) {
            console.error('Error saving offer to database:', error);
          }
        } catch (err) {
          console.error('Failed to save offer:', err);
        }
      }
    }
  }

  // Polling by document IDs
  function startOffersPolling(ids: string[]) {
    if (!ids || ids.length === 0) return;

    setIsLoading(true);

    // Immediate fetch
    fetch(`${BACKEND_URL}/offers/by-documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_ids: ids })
    })
    .then(r => r.json())
    .then(data => {
      setOffers(data || []);
      buildMatrix(data || []);
      saveOffersToDatabase(data || []); // Save to database
      setIsLoading(false);
    })
    .catch(() => { 
      setIsLoading(false);
    });

    // Interval polling
    const timer = setInterval(async () => {
      try {
        const r = await fetch(`${BACKEND_URL}/offers/by-documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ document_ids: ids })
        });
        const data = await r.json();
        setOffers(data || []);
        buildMatrix(data || []);
        saveOffersToDatabase(data || []); // Save to database
      } catch {}
    }, 2500);

    return () => clearInterval(timer);
  }

  // Optional job progress tracking
  useEffect(() => {
    if (!currentJobId) return;
    let alive = true;
    const tick = async () => {
      try {
        const r = await fetch(`${BACKEND_URL}/jobs/${currentJobId}`);
        if (r.ok) {
          const j = await r.json();
          setJob(j);
          // Stop loading when job is complete
          if (j.done >= j.total) {
            setIsUploading(false);
          }
        }
      } catch {}
      if (alive) setTimeout(tick, 2500);
    };
    tick();
    return () => { alive = false; };
  }, [currentJobId]);

  // Start polling when docIds change
  useEffect(() => {
    if (!docIds.length) return;
    return startOffersPolling(docIds);
  }, [docIds]);

  const onFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Clear old results immediately when new files selected
    setOffers([]);
    setColumns([]);
    setAllFeatureKeys([]);
    setDocIds([]);
    setCurrentJobId(null);
    setJob(null);
    
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
    console.log(`Setting hint for file ${idx} to: ${value}`);
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, hint: value } : it)));
    console.log('Updated items after hint change:', items.map(it => ({ name: it.file.name, hint: it.hint })));
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  async function startAsyncProcessing(files: UploadItem[], inquiryId?: string): Promise<{ job_id: string; documents: string[] }> {
    const form = new FormData();
    files.forEach((item, index) => {
      form.append('files', item.file);
      form.append(`file_${index}_insurer`, item.hint);
    });
    form.append('company', companyName);
    form.append('insured_count', employeesCount.toString());
    if (inquiryId) form.append('inquiry_id', inquiryId);
    const res = await fetch(`${BACKEND_URL}/extract/multiple-async`, { method: 'POST', body: form });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || `Upload failed (${res.status})`);
    }
    const response = await res.json();
    return { job_id: response.job_id, documents: response.documents || [] };
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

    // Clear previous state before starting new upload
    setOffers([]);
    setColumns([]);
    setAllFeatureKeys([]);
    setDocIds([]);
    setCurrentJobId(null);
    setJob(null);
    setIsUploading(true);

    try {
      const { job_id, documents } = await startAsyncProcessing(items, inquiryId || undefined);
      setCurrentJobId(job_id);
      setDocIds(documents);
      toast.success('Processing started...');
    } catch (err: any) {
      toast.error(`${t('failed') || 'Failed'}: ${err?.message || 'Upload error'}`);
      setIsUploading(false);
    }
  };

  // Share functionality
  const shareResults = async () => {
    if (!docIds.length) {
      toast.error('No processed results to share.');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: "Piedāvājums",
          company_name: companyName,
          employees_count: employeesCount,
          document_ids: docIds
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.detail || `Failed (${response.status})`);
      }

      const { url } = await response.json();
      window.open(url, '_blank', 'noopener,noreferrer');
      toast.success('Share link created');
    } catch (err: any) {
      toast.error(`${t('failed') || 'Failed'}: ${err?.message || 'Share error'}`);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('pasSettings')}</CardTitle>
          <CardDescription>{t('pasDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            {/* Company */}
            <div>
              <Label htmlFor="company">{t('company')}</Label>
              <Input
                id="company"
                placeholder="LDZ"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            {/* Employee Count */}
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

            {/* File picker */}
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

          <Button onClick={handleSubmit} className="w-full" disabled={isUploading || isLoading}>
            {isUploading || isLoading ? (t('processing') || 'Processing…') : `${t('uploadProcess')} (${items.length || 0} ${t('files')})`}
          </Button>
          
          {/* Processing Status */}
          {job && (
            <div className="text-sm text-muted-foreground text-center">
              Processed {job.done}/{job.total} files...
            </div>
          )}
        </CardContent>
      </Card>


      {/* Results Matrix */}
      {currentJobId && columns.length > 0 && (
        <ComparisonMatrix
          key={currentJobId}               // forces a fresh matrix per run
          columns={columns}
          allFeatureKeys={allFeatureKeys}
          currentLanguage={currentLanguage}
          onShare={shareResults}
          companyName={companyName}
          employeesCount={employeesCount}
        />
      )}

      {/* Medical Services Footer - Legend */}
      {currentJobId && columns.length > 0 && (
        <MedicalServicesHeader currentLanguage={currentLanguage} />
      )}
    </div>
  );
};

export default PasTab;