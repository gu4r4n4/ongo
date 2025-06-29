
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardTab from "@/components/dashboard/DashboardTab";
import InvoicesTab from "@/components/dashboard/InvoicesTab";
import InquiriesTab from "@/components/dashboard/InquiriesTab";
import ApiConnectionTab from "@/components/dashboard/ApiConnectionTab";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin</h1>
          <p className="text-gray-600">Pārvaldiet rēķinus, sekojiet veiktspējai un konfigurējiet API savienojumus</p>
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
