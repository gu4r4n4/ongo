import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Search, ArrowUpDown } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { usePagination } from "@/hooks/usePagination";

const InquiriesTab = () => {
  const { inquiries, isLoading } = useDashboardData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('received_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const getStatusBadge = (status: string) => {
    const variants = {
      'new': 'bg-blue-100 text-blue-800 border-blue-200',
      'processed': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'new': 'Jauns',
      'processed': 'Apstrādāts',
      'completed': 'Pabeigts',
      'cancelled': 'Atcelts'
    };
    return labels[status as keyof typeof labels] || status || 'Jauns';
  };

  const getProductTypeLabel = (productType: string) => {
    const labels = {
      'life': 'Dzīvības apdrošināšana',
      'auto': 'Auto apdrošināšana', 
      'property': 'Mājas apdrošināšana',
      'travel': 'Ceļojumu apdrošināšana',
      'cargo': 'Kravas apdrošināšana',
      'crop': 'Lauksaimniecības apdrošināšana',
      'livestock': 'Lopkopības apdrošināšana',
      'equipment': 'Tehnikas apdrošināšana'
    };
    return labels[productType as keyof typeof labels] || productType || 'Nav norādīts';
  };

  const filteredAndSortedInquiries = inquiries
    .filter(inquiry => {
      const matchesSearch = inquiry.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'jauns' && (inquiry.status === 'new' || !inquiry.status)) ||
        (statusFilter === 'apstrādāts' && inquiry.status === 'processed') ||
        (statusFilter === 'pabeigts' && inquiry.status === 'completed') ||
        (statusFilter === 'atcelts' && inquiry.status === 'cancelled');
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      if (sortField === 'received_at') {
        aValue = new Date(a.received_at || '').getTime();
        bValue = new Date(b.received_at || '').getTime();
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

  const {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    startIndex,
    endIndex,
    totalItems,
    hasNextPage,
    hasPreviousPage
  } = usePagination({ data: filteredAndSortedInquiries, itemsPerPage: 10 });

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
        <div className="text-lg text-gray-600">Ielādē pieteikumus...</div>
      </div>
    );
  }

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
                <SelectItem value="atcelts">Atcelts</SelectItem>
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
                      onClick={() => handleSort('received_at')}
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
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Nav atrasti pieteikumi, kas atbilst jūsu kritērijiem
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((inquiry) => (
                    <TableRow key={inquiry.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">INQ-{inquiry.id}</TableCell>
                      <TableCell>{inquiry.full_name}</TableCell>
                      <TableCell>{new Date(inquiry.received_at || '').toLocaleDateString('lv-LV')}</TableCell>
                      <TableCell>{getProductTypeLabel(inquiry.product_type || '')}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(inquiry.status || 'new')}>
                          {getStatusLabel(inquiry.status || 'new')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Rāda {startIndex} līdz {endIndex} no {totalItems} pieteikumiem
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={goToPreviousPage}
                      className={!hasPreviousPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => goToPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={goToNextPage}
                      className={!hasNextPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-600">
            Kopā {filteredAndSortedInquiries.length} no {inquiries.length} pieteikumiem
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InquiriesTab;
