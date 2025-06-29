
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Euro, FileText, MessageSquare, AlertCircle } from "lucide-react";

// Mock data for charts
const incomeData = [
  { date: '2024-06-01', income: 2400 },
  { date: '2024-06-05', income: 1800 },
  { date: '2024-06-10', income: 3200 },
  { date: '2024-06-15', income: 2800 },
  { date: '2024-06-20', income: 4100 },
  { date: '2024-06-25', income: 3500 },
  { date: '2024-06-29', income: 2900 },
];

const inquiriesData = [
  { date: '2024-06-24', inquiries: 12 },
  { date: '2024-06-25', inquiries: 8 },
  { date: '2024-06-26', inquiries: 15 },
  { date: '2024-06-27', inquiries: 6 },
  { date: '2024-06-28', inquiries: 11 },
  { date: '2024-06-29', inquiries: 9 },
];

const DashboardTab = () => {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Income This Month</CardTitle>
            <Euro className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">€21,700</div>
            <p className="text-xs text-blue-600">+12% from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">47</div>
            <p className="text-xs text-green-600">+3 new this week</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Total Inquiries</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">61</div>
            <p className="text-xs text-purple-600">+8% from last week</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Unpaid Invoices</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">7</div>
            <p className="text-xs text-red-600">€4,320 outstanding</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Income Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Total Income Over Time</CardTitle>
            <CardDescription>Daily income from invoices in EUR</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={incomeData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                  <XAxis 
                    dataKey="date" 
                    className="text-sm text-gray-600"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis className="text-sm text-gray-600" />
                  <Tooltip 
                    formatter={(value) => [`€${value}`, 'Income']}
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
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
            <CardTitle>Insurance Inquiries</CardTitle>
            <CardDescription>Number of inquiries received per day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inquiriesData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                  <XAxis 
                    dataKey="date" 
                    className="text-sm text-gray-600"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis className="text-sm text-gray-600" />
                  <Tooltip 
                    formatter={(value) => [`${value}`, 'Inquiries']}
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
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
