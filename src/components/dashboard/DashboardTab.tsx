
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Euro, FileText, MessageSquare, AlertCircle } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useMemo } from "react";

const DashboardTab = () => {
  const { inquiries, invoices, isLoading } = useDashboardData();

  const dashboardStats = useMemo(() => {
    const totalIncome = invoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
    
    const unpaidInvoices = invoices.filter(invoice => invoice.status === 'pending');
    const unpaidAmount = unpaidInvoices.reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
    
    const thisMonthInquiries = inquiries.filter(inquiry => {
      const inquiryDate = new Date(inquiry.received_at || '');
      const now = new Date();
      return inquiryDate.getMonth() === now.getMonth() && 
             inquiryDate.getFullYear() === now.getFullYear();
    });

    return {
      totalIncome,
      totalInvoices: invoices.length,
      totalInquiries: inquiries.length,
      unpaidInvoicesCount: unpaidInvoices.length,
      unpaidAmount,
      thisMonthInquiries: thisMonthInquiries.length
    };
  }, [inquiries, invoices]);

  const incomeData = useMemo(() => {
    // Group paid invoices by date for the last 30 days
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last30Days.map(date => {
      const dayInvoices = invoices.filter(invoice => 
        invoice.paid_at && 
        invoice.status === 'paid' &&
        invoice.paid_at.split('T')[0] === date
      );
      
      const dailyIncome = dayInvoices.reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
      
      return {
        date,
        income: dailyIncome
      };
    }).filter(item => item.income > 0);
  }, [invoices]);

  const inquiriesData = useMemo(() => {
    // Group inquiries by date for the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayInquiries = inquiries.filter(inquiry => 
        inquiry.received_at && 
        inquiry.received_at.split('T')[0] === date
      );
      
      return {
        date,
        inquiries: dayInquiries.length
      };
    });
  }, [inquiries]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Ielādē datus...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Kopējie Ienākumi</CardTitle>
            <Euro className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">€{dashboardStats.totalIncome.toLocaleString()}</div>
            <p className="text-xs text-blue-600">No apmaksātajiem rēķiniem</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Kopējie Rēķini</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{dashboardStats.totalInvoices}</div>
            <p className="text-xs text-green-600">Visi izrakstītie rēķini</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Kopējie Pieprasījumi</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{dashboardStats.totalInquiries}</div>
            <p className="text-xs text-purple-600">{dashboardStats.thisMonthInquiries} šomēnes</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Neapmaksātie Rēķini</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{dashboardStats.unpaidInvoicesCount}</div>
            <p className="text-xs text-red-600">€{dashboardStats.unpaidAmount.toLocaleString()} neapmaksāts</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Income Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Kopējie Ienākumi</CardTitle>
            <CardDescription>Dienas ienākumi no apmaksātajiem rēķiniem EUR</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={incomeData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                  <XAxis 
                    dataKey="date" 
                    className="text-sm text-gray-600"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('lv-LV', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis className="text-sm text-gray-600" />
                  <Tooltip 
                    formatter={(value) => [`€${value}`, 'Ienākumi']}
                    labelFormatter={(value) => new Date(value).toLocaleDateString('lv-LV')}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#2563eb" 
                    strokeWidth={3}
                    dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Inquiries Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Apdrošināšanas Pieprasījumi</CardTitle>
            <CardDescription>Dienas laikā saņemto pieprasījumu skaits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inquiriesData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                  <XAxis 
                    dataKey="date" 
                    className="text-sm text-gray-600"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('lv-LV', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis className="text-sm text-gray-600" />
                  <Tooltip 
                    formatter={(value) => [`${value}`, 'Pieprasījumi']}
                    labelFormatter={(value) => new Date(value).toLocaleDateString('lv-LV')}
                  />
                  <Bar 
                    dataKey="inquiries" 
                    fill="#7c3aed" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardTab;
