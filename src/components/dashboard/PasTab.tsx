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

const PasTab = ({ currentLanguage }: PasTabProps) => {
  const { t } = useTranslation(currentLanguage);
  const [formData, setFormData] = useState({
    inquiryId: '',
    companyHint: '',
    pdfFile: null as File | null
  });
  const [isUploading, setIsUploading] = useState(false);
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setFormData(prev => ({
        ...prev,
        pdfFile: file
      }));
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
    if (!formData.companyHint || !formData.pdfFile) {
      toast.error(t('fillAllFields'));
      return;
    }

    setIsUploading(true);
    setApiResponse(null);
    
    try {
      const response = await uploadOffer(
        formData.pdfFile, 
        formData.companyHint, 
        formData.inquiryId || undefined
      );
      
      setApiResponse(response);
      toast.success('Offer processed successfully');
    } catch (error) {
      console.error('Error uploading offer:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
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
          <div className="space-y-4">
            <div>
              <Label htmlFor="pas-inquiry-id">Inquiry ID (optional)</Label>
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
              <Select value={formData.companyHint} onValueChange={(value) => handleInputChange('companyHint', value)}>
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
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              <p className="text-sm text-muted-foreground mt-1">
                {t('uploadOffer')}
              </p>
              {formData.pdfFile && (
                <p className="text-sm text-green-600 mt-1">
                  Selected: {formData.pdfFile.name}
                </p>
              )}
            </div>
          </div>

          <Button 
            onClick={handleSubmit}
            className="w-full"
            disabled={isUploading}
          >
            {isUploading ? 'Processing...' : 'Upload & Process'}
          </Button>
        </CardContent>
      </Card>

      {apiResponse && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Results</CardTitle>
            <CardDescription>
              File: {apiResponse.source_file} • {apiResponse.programs.length} program(s) found
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
      )}
    </div>
  );
};

export default PasTab;