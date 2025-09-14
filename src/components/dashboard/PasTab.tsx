import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Language, useTranslation } from "@/utils/translations";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { InsurerLogo } from "@/components/InsurerLogo";
import { useAsyncOffers } from "@/hooks/useAsyncOffers";
import { ComparisonMatrix } from "./ComparisonMatrix";
// Supabase is not needed on the FE for this flow
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

  // Async processing state
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [docIds, setDocIds] = useState<string[]>([]);

  // Use the async offers hook
  const { offers, job, columns, allFeatureKeys, isLoading } =
    useAsyncOffers({ backendUrl: BACKEND_URL, jobId: currentJobId });

  // Debug logging
  console.log('PasTab debug:', { currentJobId, docIds, offers, job });

  // Force component to re-render with new key when jobId changes
  const componentKey = `pastab-${currentJobId || 'initial'}`;

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

  async function startAsyncProcessing(files: UploadItem[], inquiryId?: string): Promise<{ job_id: string; documents: string[] }> {
    console.log('Creating FormData with files:', files.length);
    const form = new FormData();
    
    // Add all files with their individual hints
    files.forEach((item, index) => {
      console.log(`Adding file ${index}: ${item.file.name} with insurer: ${item.hint}`);
      form.append('files', item.file);
      form.append(`file_${index}_insurer`, item.hint);
    });
    
    // Add metadata
    form.append('company', companyName);
    form.append('insured_count', employeesCount.toString());
    if (inquiryId) form.append('inquiry_id', inquiryId);

    console.log('Making request to:', `${BACKEND_URL}/extract/multiple-async`);
    
    const res = await fetch(`${BACKEND_URL}/extract/multiple-async`, {
      method: 'POST',
      body: form
    });

    console.log('Response status:', res.status);
    
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error('Upload failed with data:', data);
      throw new Error(data?.error || `Upload failed (${res.status})`);
    }

    const response = await res.json();
    console.log('Upload response:', response);
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

    console.log('Starting upload with items:', items);
    setIsUploading(true);
    setCurrentJobId(null);
    setDocIds([]);

    try {
      // Start async processing directly - no separate metadata save needed

      // Start async processing
      try {
        console.log('Starting async processing with files:', items.map(i => ({ name: i.file.name, hint: i.hint })));
        const { job_id, documents } = await startAsyncProcessing(items, inquiryId || undefined);
        console.log('Async processing started:', { job_id, documents });
        
        // Note: Backend will create the offer records when processing completes

        setCurrentJobId(job_id);
        setDocIds(documents);
        toast.success('Processing started...');
      } catch (err: any) {
        console.error('Async processing failed:', err);
        toast.error(`${t('failed') || 'Failed'}: ${err?.message || 'Upload error'}`);
        setIsUploading(false);
      }
    } catch (error) {
      console.error('General upload error:', error);
      setIsUploading(false);
    }
  };

  // Share functionality
  const shareResults = async () => {
    if (!docIds.length) {
      toast.error('No documents to share yet.');
      return;
    }

    try {
      // Live view (keeps updating while backend finishes remaining files):
      const response = await fetch(`${BACKEND_URL}/shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: "Piedāvājums",
          company_name: companyName,
          employees_count: employeesCount,
          document_ids: docIds,          // live-by-documents mode
          // If you want a frozen snapshot instead, send:
          // results: offers,
          expires_in_hours: 168
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || `Failed (${response.status})`);
      }

      const { url } = await response.json();
      window.open(url, '_blank', 'noopener,noreferrer');
      toast.success('Share link created');
    } catch (err: any) {
      console.error('Share creation error:', err);
      toast.error(`${t('failed') || 'Failed'}: ${err?.message || 'Share error'}`);
    }
  };

  // Stop uploading when job is complete
  if (isUploading && job && job.done >= job.total) {
    setIsUploading(false);
  }

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

      {/* Results */}
      {columns.length > 0 && (
        <ComparisonMatrix
          columns={columns}
          allFeatureKeys={allFeatureKeys}
          currentLanguage={currentLanguage}
          onShare={shareResults}
          companyName={companyName}
          employeesCount={employeesCount}
        />
      )}
    </div>
  );
};

export default PasTab;