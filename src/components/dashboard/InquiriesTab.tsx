
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ArrowUpDown } from "lucide-react";

// Mock inquiry data
const mockInquiries = [
  { id: 'INQ-001', clientName: 'Jānis Bērziņš', date: '2024-06-29', type: 'Dzīvības apdrošināšana', status: 'Jauns' },
  { id: 'INQ-002', clientName: 'Anna Kalniņa', date: '2024-06-28', type: 'Auto apdrošināšana', status: 'Apstrādāts' },
  { id: 'INQ-003', clientName: 'Pēteris Ozols', date: '2024-06-27', type: 'Mājas apdrošināšana', status: 'Pabeigts' },
  { id: 'INQ-004', clientName: 'Līga Liepa', date: '2024-06-26', type: 'Ceļojumu apdrošināšana', status: 'Jauns' },
  { id: 'INQ-005', clientName: 'Māris Krūmiņš', date: '2024-06-25', type: 'Dzīvības apdrošināšana', status: 'Apstrādāts' },
  { id: 'INQ-006', clientName: 'Dace Priede', date: '2024-06-24', type: 'Auto apdrošināšana', status: 'Pabeigts' },
  { id: 'INQ-007', clientName: 'Andris Siliņš', date: '2024-06-23', type: 'Mājas apdrošināšana', status: 'Jauns' },
  { id: 'INQ-008', clientName: 'Ilze Kļava', date: '2024-06-22', type: 'Ceļojumu apdrošināšana', status: 'Apstrādāts' },
  { id: 'INQ-009', clientName: 'Raimonds Strazds', date: '2024-06-21', type: 'Dzīvības apdrošināšana', status: 'Pabeigts' },
  { id: 'INQ-010', clientName: 'Sanita Vītola', date: '2024-06-20', type: 'Auto apdrošināšana', status: 'Jauns' },
];

const InquiriesTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const getStatusBadge = (status: string) => {
    const variants = {
      'Jauns': 'bg-blue-100 text-blue-800 border-blue-200',
      'Apstrādāts': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Pabeigts': 'bg-green-100 text-green-800 border-green-200'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const filteredAndSortedInquiries = mockInquiries
    .filter(inquiry => {
      const matchesSearch = inquiry.clientName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'jauns' && inquiry.status === 'Jauns') ||
        (statusFilter === 'apstrādāts' && inquiry.status === 'Apstrādāts') ||
        (statusFilter === 'pabeigts' && inquiry.status === 'Pabeigts');
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      if (sortField === 'date') {
        aValue = new Date(a.date).getTime();
        bValue = new Date(b.date).getTime();
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
          <CardTitle>Pieteikumu Pārvaldība</CardTitle>
          <CardDescription>Skatiet un pārvaldiet visus apdrošināšanas pieteikumus</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Meklēt pēc klienta vārda..."
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
                <SelectItem value="jauns">Jauns</SelectItem>
                <SelectItem value="apstrādāts">Apstrādāts</SelectItem>
                <SelectItem value="pabeigts">Pabeigts</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pieteikuma ID</TableHead>
                  <TableHead>Klienta Vārds</TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('date')}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      Datums <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Apdrošināšanas Veids</TableHead>
                  <TableHead>Statuss</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedInquiries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Nav atrasti pieteikumi, kas atbilst jūsu kritērijiem
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedInquiries.map((inquiry) => (
                    <TableRow key={inquiry.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{inquiry.id}</TableCell>
                      <TableCell>{inquiry.clientName}</TableCell>
                      <TableCell>{new Date(inquiry.date).toLocaleDateString('lv-LV')}</TableCell>
                      <TableCell>{inquiry.type}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(inquiry.status)}>
                          {inquiry.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Rāda {filteredAndSortedInquiries.length} no {mockInquiries.length} pieteikumiem
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InquiriesTab;
