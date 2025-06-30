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
import { Language, useTranslation } from "@/utils/translations";

interface InquiriesTabProps {
  currentLanguage: Language;
}

const InquiriesTab = ({ currentLanguage }: InquiriesTabProps) => {
  const { t } = useTranslation(currentLanguage);
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
      'cancelled': 'bg-red-100 text-red-800 border-red-200',
      'notified': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'invoiced': 'bg-green-100 text-green-800 border-green-200'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, keyof ReturnType<typeof useTranslation>['t']> = {
      'new': 'new',
      'processed': 'processed',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'notified': 'notified',
      'invoiced': 'invoiced'
    };
    
    const translationKey = statusMap[status];
    return translationKey ? t(translationKey) : status || t('new');
  };

  const getProductTypeLabel = (productType: string) => {
    const productTypeMap: Record<string, keyof ReturnType<typeof useTranslation>['t']> = {
      'auto': 'auto',
      'health': 'health',
      'home': 'home',
      'life': 'life',
      'travel': 'travel'
    };
    
    const translationKey = productTypeMap[productType];
    return translationKey ? t(translationKey) : productType || t('notSpecified');
  };

  const filteredAndSortedInquiries = inquiries
    .filter(inquiry => {
      const matchesSearch = inquiry.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'jauns' && (inquiry.status === 'new' || !inquiry.status)) ||
        (statusFilter === 'apstrādāts' && inquiry.status === 'processed') ||
        (statusFilter === 'pabeigts' && inquiry.status === 'completed') ||
        (statusFilter === 'atcelts' && inquiry.status === 'cancelled') ||
        (statusFilter === 'paziņots' && inquiry.status === 'notified') ||
        (statusFilter === 'rēķins' && inquiry.status === 'invoiced');
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
        <div className="text-lg text-gray-600">{t('loadingInquiries')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader> 
          <CardTitle>{t('inquiryManagement')}</CardTitle>
          <CardDescription>{t('inquiryManagementDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('searchByClientName')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={t('filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allStatuses')}</SelectItem>
                <SelectItem value="jauns">{t('new')}</SelectItem>
                <SelectItem value="apstrādāts">{t('processed')}</SelectItem>
                <SelectItem value="pabeigts">{t('completed')}</SelectItem>
                <SelectItem value="atcelts">{t('cancelled')}</SelectItem>
                <SelectItem value="paziņots">{t('notified')}</SelectItem>
                <SelectItem value="rēķins">{t('invoiced')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('inquiryIdShort')}</TableHead>
                  <TableHead>{t('clientName')}</TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('received_at')}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      {t('date')} <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>{t('insuranceType')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      {t('noInquiriesFound')}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((inquiry) => (
                    <TableRow key={inquiry.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">INQ-{inquiry.id}</TableCell>
                      <TableCell>{inquiry.full_name}</TableCell>
                      <TableCell>{new Date(inquiry.received_at || '').toLocaleDateString(currentLanguage === 'lv' ? 'lv-LV' : currentLanguage === 'en' ? 'en-US' : `${currentLanguage}-${currentLanguage.toUpperCase()}`)}</TableCell>
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
                {t('showing')} {startIndex} {t('to')} {endIndex} {t('of')} {totalItems} {t('inquiriesTotal')}
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
            {t('totalOf')} {filteredAndSortedInquiries.length} {t('of')} {inquiries.length} {t('inquiriesTotal')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InquiriesTab;
