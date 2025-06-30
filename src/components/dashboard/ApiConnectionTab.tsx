
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Upload, CheckCircle, XCircle, Loader2, Plus } from "lucide-react";
import { Language, useTranslation } from "@/utils/translations";

interface ApiConnectionTabProps {
  currentLanguage: Language;
}

const ApiConnectionTab = ({ currentLanguage }: ApiConnectionTabProps) => {
  const { t } = useTranslation(currentLanguage);
  const [formData, setFormData] = useState({
    companyName: '',
    apiKey: '',
    username: '',
    password: ''
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTestConnection = async () => {
    if (!formData.companyName || !formData.apiKey || !formData.username || !formData.password) {
      toast({
        title: t('missingInfo'),
        description: t('fillAllFields'),
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('idle');

    // Simulate API connection test
    setTimeout(() => {
      const isSuccess = Math.random() > 0.3; // 70% success rate for demo
      
      if (isSuccess) {
        setConnectionStatus('success');
        toast({
          title: t('connectionSuccessful'),
          description: t('connectionSuccessfulDesc'),
        });
      } else {
        setConnectionStatus('error');
        toast({
          title: t('connectionFailed'),
          description: t('connectionFailedDesc'),
          variant: "destructive"
        });
      }
      
      setIsConnecting(false);
    }, 2000);
  };

  const getConnectionStatusBadge = () => {
    switch (connectionStatus) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />{t('connected')}</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1" />{t('failed')}</Badge>;
      default:
        return <Badge variant="secondary">{t('notConnected')}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('apiConnectionSettings')}</CardTitle>
              <CardDescription>{t('apiConnectionDesc')}</CardDescription>
            </div>
            {getConnectionStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Company Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('insurerInfo')}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-2">
                <Label htmlFor="companyName">{t('insurerName')}</Label>
                <Input
                  id="companyName"
                  placeholder={t('enterInsurerName')}
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">{t('insurerLogo')}</Label>
                <div className="flex items-center space-x-4">
                  <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                    {logoPreview ? (
                      <img 
                        src={logoPreview} 
                        alt="Company logo preview" 
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-center">
                        <img 
                          src="https://bot.ongo.lv/wp-content/uploads/2025/06/letas-octas-logo-icona-black-256x256.png" 
                          alt="Default logo" 
                          className="w-full h-full object-cover rounded-lg opacity-50"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      id="logo-upload"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {t('uploadLogo')}
                    </Button>
                    <p className="text-xs text-gray-500 mt-1">{t('fileFormats')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* API Credentials Section */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold">{t('apiCredentials')}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">{t('apiKey')}</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder={t('enterApiKey')}
                  value={formData.apiKey}
                  onChange={(e) => handleInputChange('apiKey', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">{t('username')}</Label>
                <Input
                  id="username"
                  placeholder={t('enterUsername')}
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="password">{t('password')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('enterPassword')}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Test Connection */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{t('connectionTest')}</h3>
                <p className="text-sm text-gray-600">{t('connectionTestDesc')}</p>
              </div>
              <Button 
                onClick={handleTestConnection}
                disabled={isConnecting}
                className="min-w-32 bg-black text-white hover:bg-[#81D8D0] hover:text-black transition-colors"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('testing')}
                  </>
                ) : (
                  t('testConnection')
                )}
              </Button>
            </div>
          </div>

          {/* Save Settings */}
          <div className="border-t pt-6">
            <Button 
              size="lg" 
              className="w-full md:w-auto bg-black text-white hover:bg-[#81D8D0] hover:text-black transition-colors"
              onClick={() => {
                toast({
                  title: t('settingsSaved'),
                  description: t('settingsSavedDesc'),
                });
              }}
            >
              {t('saveSettings')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add API Connector Button - Centered below the card */}
      <div className="flex justify-center">
        <Button 
          size="lg"
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={() => {
            toast({
              title: t('newApiConnection'),
              description: t('newApiConnectionDesc'),
            });
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('addNewApi')}
        </Button>
      </div>
    </div>
  );
};

export default ApiConnectionTab;
