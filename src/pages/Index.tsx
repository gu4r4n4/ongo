
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut } from "lucide-react";
import DashboardTab from "@/components/dashboard/DashboardTab";
import InvoicesTab from "@/components/dashboard/InvoicesTab";
import InquiriesTab from "@/components/dashboard/InquiriesTab";
import ApiConnectionTab from "@/components/dashboard/ApiConnectionTab";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin</h1>
            <p className="text-gray-600">Pārvaldiet rēķinus un konfigurējiet API savienojumus</p>
          </div>
          <div className="flex items-center">
            <LogOut className="h-6 w-6 text-gray-600 cursor-pointer hover:text-gray-800 transition-colors" />
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="dashboard" className="text-lg py-3">Panelis</TabsTrigger>
            <TabsTrigger value="invoices" className="text-lg py-3">Rēķini</TabsTrigger>
            <TabsTrigger value="inquiries" className="text-lg py-3">Pieteikumi</TabsTrigger>
            <TabsTrigger value="api-connection" className="text-lg py-3">API Savienojums</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardTab />
          </TabsContent>

          <TabsContent value="invoices">
            <InvoicesTab />
          </TabsContent>

          <TabsContent value="inquiries">
            <InquiriesTab />
          </TabsContent>

          <TabsContent value="api-connection">
            <ApiConnectionTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
