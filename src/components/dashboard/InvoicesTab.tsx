
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ArrowUpDown } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";

const InvoicesTab = () => {
  const { invoices, isLoading } = useDashboardData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const getStatusBadge = (status: string) => {
    const variants = {
      'paid': 'bg-green-100 text-green-800 border-green-200',
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'overdue': 'bg-red-100 text-red-800 border-red-200'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'paid': 'Apmaksāts',
      'pending': 'Neapmaksāts',
      'overdue': 'Nokavēts'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const filteredAndSortedInvoices = invoices
    .filter(invoice => {
      const matchesSearch = invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'apmaksāts' && invoice.status === 'paid') ||
        (statusFilter === 'neapmaksāts' && invoice.status === 'pending') ||
        (statusFilter === 'nokavēts' && invoice.status === 'overdue');
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      if (sortField === 'created_at') {
        aValue = new Date(a.created_at || '').getTime();
        bValue = new Date(b.created_at || '').getTime();
      } else if (sortField === 'amount') {
        aValue = Number(a.amount || 0);
        bValue = Number(b.amount || 0);
      } else {
        aValue = a[sortField as keyof typeof a] || '';
        bValue = b[sortField as keyof typeof b] || '';
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Ielādē rēķinus...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rēķinu Pārvaldība</CardTitle>
          <CardDescription>Skatiet un pārvaldiet visus savus rēķinus</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Meklēt pēc rēķina numura..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrēt pēc statusa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Visi Statusi</SelectItem>
                <SelectItem value="apmaksāts">Apmaksāts</SelectItem>
                <SelectItem value="neapmaksāts">Neapmaksāts</SelectItem>
                <SelectItem value="nokavēts">Nokavēts</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rēķina Numurs</TableHead>
                  <TableHead>Pieprasījuma ID</TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('created_at')}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      Datums <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('amount')}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      Summa <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Statuss</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Nav atrasti rēķini, kas atbilst jūsu kritērijiem
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{invoice.invoice_number || `INV-${invoice.id}`}</TableCell>
                      <TableCell>{invoice.inquiry_id ? `INQ-${invoice.inquiry_id}` : 'N/A'}</TableCell>
                      <TableCell>{new Date(invoice.created_at || '').toLocaleDateString('lv-LV')}</TableCell>
                      <TableCell className="font-medium">€{Number(invoice.amount || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(invoice.status || 'pending')}>
                          {getStatusLabel(invoice.status || 'pending')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Rāda {filteredAndSortedInvoices.length} no {invoices.length} rēķiniem
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoicesTab;
