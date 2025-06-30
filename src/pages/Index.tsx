
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut } from "lucide-react";
import DashboardTab from "@/components/dashboard/DashboardTab";
import InvoicesTab from "@/components/dashboard/InvoicesTab";
import InquiriesTab from "@/components/dashboard/InquiriesTab";
import ApiConnectionTab from "@/components/dashboard/ApiConnectionTab";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Language, useTranslation } from "@/utils/translations";

const Index = () => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('lv');
  const { t } = useTranslation(currentLanguage);

  const handleLanguageChange = (language: Language) => {
    setCurrentLanguage(language);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('admin')}</h1>
            <p className="text-gray-600">{t('manageInvoices')}</p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher 
              currentLanguage={currentLanguage}
              onLanguageChange={handleLanguageChange}
            />
            <LogOut className="h-6 w-6 text-gray-600 cursor-pointer hover:text-gray-800 transition-colors" />
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="dashboard" className="text-lg py-3">{t('dashboard')}</TabsTrigger>
            <TabsTrigger value="invoices" className="text-lg py-3">{t('invoices')}</TabsTrigger>
            <TabsTrigger value="inquiries" className="text-lg py-3">{t('inquiries')}</TabsTrigger>
            <TabsTrigger value="api-connection" className="text-lg py-3">{t('apiConnection')}</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardTab currentLanguage={currentLanguage} />
          </TabsContent>

          <TabsContent value="invoices">
            <InvoicesTab currentLanguage={currentLanguage} />
          </TabsContent>

          <TabsContent value="inquiries">
            <InquiriesTab currentLanguage={currentLanguage} />
          </TabsContent>

          <TabsContent value="api-connection">
            <ApiConnectionTab currentLanguage={currentLanguage} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
