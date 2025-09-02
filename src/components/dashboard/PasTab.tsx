import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Language, useTranslation } from "@/utils/translations";
import { toast } from "sonner";
import { Trash2, Download } from "lucide-react";

interface PasTabProps {
  currentLanguage: Language;
}

interface Program {
  insurer: string;
  program_code: string;
  base_sum_eur: number;
  premium_eur: number;
  payment_method: string;
  features: Record<string, string>;
}

interface ApiResponse {
  source_file: string;
  programs: Program[];
}

interface FormData {
  inquiryId: string;
  companyHint: string;
}

const PasTab = ({ currentLanguage }: PasTabProps) => {
  const { t } = useTranslation(currentLanguage);
  const [formData, setFormData] = useState<FormData>({
    inquiryId: '',
    companyHint: ''
  });
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const pdfFiles = selectedFiles.filter(file => 
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );
    
    if (pdfFiles.length !== selectedFiles.length) {
      toast.error('Only PDF files are allowed');
    }
    
    setFiles(pdfFiles);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadOfferSingle = async (file: File, companyHint: string, inquiryId?: string) => {
    const form = new FormData();
    form.append('file', file);
    if (companyHint) form.append('company_hint', companyHint);
    if (inquiryId) form.append('inquiry_id', String(inquiryId));

    const res = await fetch('https://visbrokerhouse.onrender.com/ingest', {
      method: 'POST',
      body: form
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Upload failed for ${file.name}`);
    }
    
    return res.json();
  };

  const handleSubmit = async () => {
    if (!formData.companyHint || files.length === 0) {
      toast.error(t('fillAllFields'));
      return;
    }

    setIsUploading(true);
    setProgress({ current: 0, total: files.length });
    setApiResponse(null);
    
    try {
      const allResponses: ApiResponse[] = [];
      let successCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress({ current: i + 1, total: files.length });

        try {
          const response = await uploadOfferSingle(
            file,
            formData.companyHint,
            formData.inquiryId || undefined
          );
          allResponses.push(response);
          successCount++;
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          toast.error(error instanceof Error ? error.message : `Failed: ${file.name}`);
        }
      }

      // Aggregate results
      if (allResponses.length > 0) {
        const aggregated: ApiResponse = {
          source_file: allResponses.map(r => r.source_file).join(', '),
          programs: allResponses.flatMap(r => r.programs)
        };
        setApiResponse(aggregated);
        toast.success(`Processed ${successCount} of ${files.length} file(s) successfully`);
      }
    } finally {
      setIsUploading(false);
      setProgress(null);
    }
  };

  const exportToCSV = () => {
    if (!apiResponse || apiResponse.programs.length === 0) return;

    // Create CSV headers
    const headers = [
      'Source File',
      'Insurer', 
      'Program Code',
      'Base Sum (EUR)',
      'Premium (EUR)',
      'Payment Method',
      'Features'
    ];

    // Convert data to CSV rows
    const rows = apiResponse.programs.map(program => [
      apiResponse.source_file,
      program.insurer,
      program.program_code,
      program.base_sum_eur,
      program.premium_eur,
      program.payment_method,
      Object.entries(program.features).map(([key, value]) => `${key}: ${value}`).join('; ')
    ]);

    // Create CSV content
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pas-results-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('CSV exported successfully');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('pasSettings')}</CardTitle>
          <CardDescription>{t('pasDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="pas-inquiry-id">{t('inquiryIdOptional')}</Label>
              <Input
                id="pas-inquiry-id"
                placeholder={t('enterId')}
                value={formData.inquiryId}
                onChange={(e) => handleInputChange('inquiryId', e.target.value)}
                type="number"
              />
            </div>

            <div>
              <Label htmlFor="pas-insurer">{t('insurer')} *</Label>
              <Select 
                value={formData.companyHint} 
                onValueChange={(value) => handleInputChange('companyHint', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectInsurer')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BTA">BTA</SelectItem>
                  <SelectItem value="BTA2">BTA2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pas-pdf">{t('offerUpload')} *</Label>
              <Input
                id="pas-pdf"
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              <p className="text-sm text-muted-foreground mt-1">
                {t('uploadOffer')} (Multiple PDFs allowed)
              </p>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Files ({files.length})</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm truncate flex-1">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-6 w-6 p-0 ml-2"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {progress && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing files...</span>
                  <span>{progress.current}/{progress.total}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <Button 
            onClick={handleSubmit}
            className="w-full hover:bg-[rgb(129,216,208)] hover:text-black"
            disabled={isUploading || !formData.companyHint || files.length === 0}
          >
            {isUploading 
              ? progress 
                ? `${t('processing')} ${progress.current}/${progress.total}...`
                : t('processing') 
              : `${t('uploadProcess')} (${files.length} ${files.length === 1 ? 'file' : 'files'})`
            }
          </Button>
        </CardContent>
      </Card>

      {apiResponse && (
        <div className="space-y-4">
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
          
          <Card>
            <CardHeader>
              <CardTitle>{t('processingResults')}</CardTitle>
              <CardDescription>
                {t('file')}: {apiResponse.source_file} • {apiResponse.programs.length} {t('programsFound')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {apiResponse.programs.map((program, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
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
                      <span className="ml-2 font-medium">€{program.base_sum_eur.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('payment')}:</span>
                      <span className="ml-2 font-medium capitalize">{program.payment_method}</span>
                    </div>
                  </div>

                  {Object.keys(program.features).length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <div className="text-sm font-medium mb-2">{t('features')}:</div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(program.features).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-muted-foreground">{key}:</span>
                              <span className={value === 'Yes' ? 'text-green-600' : value === 'No' ? 'text-red-600' : ''}>
                                {value}
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
        </div>
      )}
    </div>
  );
};

export default PasTab;