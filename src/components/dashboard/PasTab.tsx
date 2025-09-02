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
import { Plus, Trash2, Download } from "lucide-react";

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

interface UploadForm {
  id: string;
  inquiryId: string;
  companyHint: string;
  pdfFile: File | null;
}

const PasTab = ({ currentLanguage }: PasTabProps) => {
  const { t } = useTranslation(currentLanguage);
  const [uploadForms, setUploadForms] = useState<UploadForm[]>([{
    id: '1',
    inquiryId: '',
    companyHint: '',
    pdfFile: null
  }]);
  const [isUploading, setIsUploading] = useState(false);
  const [apiResponses, setApiResponses] = useState<ApiResponse[]>([]);

  const addUploadForm = () => {
    const newForm: UploadForm = {
      id: Date.now().toString(),
      inquiryId: '',
      companyHint: '',
      pdfFile: null
    };
    setUploadForms(prev => [...prev, newForm]);
  };

  const removeUploadForm = (id: string) => {
    if (uploadForms.length > 1) {
      setUploadForms(prev => prev.filter(form => form.id !== id));
    }
  };

  const handleInputChange = (id: string, field: keyof UploadForm, value: string) => {
    setUploadForms(prev => prev.map(form => 
      form.id === id ? { ...form, [field]: value } : form
    ));
  };

  const handleFileChange = (id: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setUploadForms(prev => prev.map(form => 
        form.id === id ? { ...form, pdfFile: file } : form
      ));
    } else if (file) {
      toast.error('Please select a PDF file');
    }
  };

  const uploadOffer = async (file: File, companyHint: string, inquiryId?: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('company_hint', companyHint);
    if (inquiryId) form.append('inquiry_id', String(inquiryId));

    const res = await fetch('https://visbrokerhouse.onrender.com/ingest', {
      method: 'POST',
      body: form
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Upload failed');
    }
    
    return res.json();
  };

  const handleSubmit = async () => {
    const validForms = uploadForms.filter(form => form.companyHint && form.pdfFile);
    
    if (validForms.length === 0) {
      toast.error(t('fillAllFields'));
      return;
    }

    setIsUploading(true);
    setApiResponses([]);
    
    try {
      const responses = await Promise.all(
        validForms.map(form =>
          uploadOffer(
            form.pdfFile!,
            form.companyHint,
            form.inquiryId || undefined
          )
        )
      );
      
      setApiResponses(responses);
      toast.success(`${responses.length} offer(s) processed successfully`);
    } catch (error) {
      console.error('Error uploading offers:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const exportToCSV = () => {
    if (apiResponses.length === 0) return;

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
    const rows = apiResponses.flatMap(response => 
      response.programs.map(program => [
        response.source_file,
        program.insurer,
        program.program_code,
        program.base_sum_eur,
        program.premium_eur,
        program.payment_method,
        Object.entries(program.features).map(([key, value]) => `${key}: ${value}`).join('; ')
      ])
    );

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
          {uploadForms.map((form, index) => (
            <div key={form.id} className="space-y-4 p-4 border rounded-lg relative">
              {uploadForms.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                  onClick={() => removeUploadForm(form.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor={`pas-inquiry-id-${form.id}`}>{t('inquiryIdOptional')}</Label>
                  <Input
                    id={`pas-inquiry-id-${form.id}`}
                    placeholder={t('enterId')}
                    value={form.inquiryId}
                    onChange={(e) => handleInputChange(form.id, 'inquiryId', e.target.value)}
                    type="number"
                  />
                </div>

                <div>
                  <Label htmlFor={`pas-insurer-${form.id}`}>{t('insurer')} *</Label>
                  <Select 
                    value={form.companyHint} 
                    onValueChange={(value) => handleInputChange(form.id, 'companyHint', value)}
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
                  <Label htmlFor={`pas-pdf-${form.id}`}>{t('offerUpload')} *</Label>
                  <Input
                    id={`pas-pdf-${form.id}`}
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileChange(form.id, e)}
                    className="cursor-pointer"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('uploadOffer')}
                  </p>
                  {form.pdfFile && (
                    <p className="text-sm text-green-600 mt-1">
                      Selected: {form.pdfFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={addUploadForm}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('addAnotherFile')}
            </Button>
            <Button 
              onClick={handleSubmit}
              className="flex-1 hover:bg-[rgb(129,216,208)] hover:text-black"
              disabled={isUploading}
            >
              {isUploading ? t('processing') : `${t('uploadProcess')} (${uploadForms.filter(f => f.companyHint && f.pdfFile).length})`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {apiResponses.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Processing Results</h3>
            <Button 
              variant="outline" 
              onClick={exportToCSV}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {t('exportCsv')}
            </Button>
          </div>
          {apiResponses.map((response, responseIndex) => (
            <Card key={responseIndex}>
              <CardHeader>
                <CardTitle>Processing Results {responseIndex + 1}</CardTitle>
                <CardDescription>
                  File: {response.source_file} • {response.programs.length} program(s) found
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {response.programs.map((program, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{program.insurer}</Badge>
                        <Badge>{program.program_code}</Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Premium</div>
                        <div className="font-semibold">€{program.premium_eur}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Base Sum:</span>
                        <span className="ml-2 font-medium">€{program.base_sum_eur.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Payment:</span>
                        <span className="ml-2 font-medium capitalize">{program.payment_method}</span>
                      </div>
                    </div>

                    {Object.keys(program.features).length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <div className="text-sm font-medium mb-2">Features:</div>
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
          ))}
        </div>
      )}
    </div>
  );
};

export default PasTab;