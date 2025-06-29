
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardTab from "@/components/dashboard/DashboardTab";
import InvoicesTab from "@/components/dashboard/InvoicesTab";
import ApiConnectionTab from "@/components/dashboard/ApiConnectionTab";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Dashboard</h1>
          <p className="text-gray-600">Manage your invoices, track performance, and configure API connections</p>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="dashboard" className="text-lg py-3">Dashboard</TabsTrigger>
            <TabsTrigger value="invoices" className="text-lg py-3">Invoices</TabsTrigger>
            <TabsTrigger value="api-connection" className="text-lg py-3">API Connection</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardTab />
          </TabsContent>

          <TabsContent value="invoices">
            <InvoicesTab />
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
