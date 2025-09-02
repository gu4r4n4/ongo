import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Language, useTranslation } from "@/utils/translations";
import { toast } from "sonner";

interface PasTabProps {
  currentLanguage: Language;
}

const PasTab = ({ currentLanguage }: PasTabProps) => {
  const { t } = useTranslation(currentLanguage);
  const [formData, setFormData] = useState({
    id: '',
    insurer: '',
    pdfFile: null as File | null
  });

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

  const handleSubmit = () => {
    if (!formData.id || !formData.insurer || !formData.pdfFile) {
      toast.error(t('fillAllFields'));
      return;
    }

    // Here you would implement the actual submission logic
    toast.success('Offer uploaded successfully');
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
              <Label htmlFor="pas-id">{t('pasId')}</Label>
              <Input
                id="pas-id"
                placeholder={t('enterId')}
                value={formData.id}
                onChange={(e) => handleInputChange('id', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="pas-insurer">{t('insurer')}</Label>
              <Select value={formData.insurer} onValueChange={(value) => handleInputChange('insurer', value)}>
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
              <Label htmlFor="pas-pdf">{t('offerUpload')}</Label>
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
          >
            Upload & Process
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PasTab;