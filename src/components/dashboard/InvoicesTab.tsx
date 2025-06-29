
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ArrowUpDown } from "lucide-react";

// Mock invoice data
const mockInvoices = [
  { id: 'INV-001', clientName: 'Acme Corp', date: '2024-06-25', amount: 1250, status: 'Apmaksāts' },
  { id: 'INV-002', clientName: 'TechStart Ltd', date: '2024-06-24', amount: 890, status: 'Neapmaksāts' },
  { id: 'INV-003', clientName: 'Global Solutions', date: '2024-06-23', amount: 2100, status: 'Apmaksāts' },
  { id: 'INV-004', clientName: 'Innovation Hub', date: '2024-06-22', amount: 750, status: 'Nokavēts' },
  { id: 'INV-005', clientName: 'Digital Agency', date: '2024-06-21', amount: 1680, status: 'Apmaksāts' },
  { id: 'INV-006', clientName: 'StartUp Venture', date: '2024-06-20', amount: 920, status: 'Neapmaksāts' },
  { id: 'INV-007', clientName: 'Enterprise Inc', date: '2024-06-19', amount: 3200, status: 'Apmaksāts' },
  { id: 'INV-008', clientName: 'Creative Studio', date: '2024-06-18', amount: 1150, status: 'Nokavēts' },
  { id: 'INV-009', clientName: 'Tech Innovators', date: '2024-06-17', amount: 2750, status: 'Apmaksāts' },
  { id: 'INV-010', clientName: 'Business Partners', date: '2024-06-16', amount: 540, status: 'Neapmaksāts' },
];

const InvoicesTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const getStatusBadge = (status: string) => {
    const variants = {
      'Apmaksāts': 'bg-green-100 text-green-800 border-green-200',
      'Neapmaksāts': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Nokavēts': 'bg-red-100 text-red-800 border-red-200'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const filteredAndSortedInvoices = mockInvoices
    .filter(invoice => {
      const matchesSearch = invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'apmaksāts' && invoice.status === 'Apmaksāts') ||
        (statusFilter === 'neapmaksāts' && invoice.status === 'Neapmaksāts') ||
        (statusFilter === 'nokavēts' && invoice.status === 'Nokavēts');
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      if (sortField === 'date') {
        aValue = new Date(a.date).getTime();
        bValue = new Date(b.date).getTime();
      } else if (sortField === 'amount') {
        aValue = a.amount;
        bValue = b.amount;
      } else {
        aValue = a[sortField as keyof typeof a];
        bValue = b[sortField as keyof typeof b];
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
                placeholder="Meklēt pēc klienta nosaukuma..."
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
                  <TableHead>Rēķina ID</TableHead>
                  <TableHead>Klienta Nosaukums</TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('date')}
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
                      <TableCell className="font-medium">{invoice.id}</TableCell>
                      <TableCell>{invoice.clientName}</TableCell>
                      <TableCell>{new Date(invoice.date).toLocaleDateString('lv-LV')}</TableCell>
                      <TableCell className="font-medium">€{invoice.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Rāda {filteredAndSortedInvoices.length} no {mockInvoices.length} rēķiniem
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoicesTab;
