import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, ArrowUpDown, MoreHorizontal } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { usePagination } from "@/hooks/usePagination";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Language, useTranslation } from "@/utils/translations";

interface InvoicesTabProps {
  currentLanguage: Language;
}

const InvoicesTab = ({ currentLanguage }: InvoicesTabProps) => {
  const { t } = useTranslation(currentLanguage);
  const { invoices, isLoading } = useDashboardData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const getStatusBadge = (status: string) => {
    const variants = {
      'paid': 'bg-green-100 text-green-800 border-green-200',
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'overdue': 'bg-red-100 text-red-800 border-red-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200',
      'notified': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'invoiced': 'bg-green-100 text-green-800 border-green-200'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return t('paid');
      case 'pending':
        return t('pending');
      case 'overdue':
        return t('overdue');
      case 'cancelled':
        return t('cancelled');
      case 'notified':
        return t('notified');
      case 'invoiced':
        return t('invoiced');
      default:
        return status;
    }
  };

  const handleStatusChange = async (invoiceId: number, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status: newStatus,
          paid_at: newStatus === 'paid' ? new Date().toISOString() : null
        })
        .eq('id', invoiceId);

      if (error) {
        toast.error(t('errorChangingStatus'));
        console.error('Error updating invoice status:', error);
        return;
      }

      toast.success(`${t('statusChanged')} "${getStatusLabel(newStatus)}"`);
    } catch (error) {
      toast.error(t('errorChangingStatus'));
      console.error('Error updating invoice status:', error);
    }
  };

  const filteredAndSortedInvoices = invoices
    .filter(invoice => {
      const matchesSearch = invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'apmaksāts' && invoice.status === 'paid') ||
        (statusFilter === 'neapmaksāts' && invoice.status === 'pending') ||
        (statusFilter === 'nokavēts' && invoice.status === 'overdue') ||
        (statusFilter === 'atcelts' && invoice.status === 'cancelled') ||
        (statusFilter === 'paziņots' && invoice.status === 'notified') ||
        (statusFilter === 'rēķins' && invoice.status === 'invoiced');
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
  } = usePagination({ data: filteredAndSortedInvoices, itemsPerPage: 10 });

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
        <div className="text-lg text-gray-600">{t('loadingInvoices')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('invoiceManagement')}</CardTitle>
          <CardDescription>{t('invoiceManagementDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('searchByInvoiceNumber')}
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
                <SelectItem value="apmaksāts">{t('paid')}</SelectItem>
                <SelectItem value="neapmaksāts">{t('pending')}</SelectItem>
                <SelectItem value="nokavēts">{t('overdue')}</SelectItem>
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
                  <TableHead>{t('invoiceNumber')}</TableHead>
                  <TableHead>{t('inquiryId')}</TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('created_at')}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      {t('date')} <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('amount')}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      {t('amount')} <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      {t('noInvoicesFound')}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{invoice.invoice_number || `INV-${invoice.id}`}</TableCell>
                      <TableCell>{invoice.inquiry_id ? `INQ-${invoice.inquiry_id}` : 'N/A'}</TableCell>
                      <TableCell>{new Date(invoice.created_at || '').toLocaleDateString(currentLanguage === 'lv' ? 'lv-LV' : currentLanguage === 'en' ? 'en-US' : `${currentLanguage}-${currentLanguage.toUpperCase()}`)}</TableCell>
                      <TableCell className="font-medium">€{Number(invoice.amount || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(invoice.status || 'pending')}>
                          {getStatusLabel(invoice.status || 'pending')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white">
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(invoice.id, 'paid')}
                              disabled={invoice.status === 'paid'}
                            >
                              {t('markAsPaid')}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(invoice.id, 'cancelled')}
                              disabled={invoice.status === 'cancelled'}
                            >
                              {t('markAsCancelled')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                {t('showing')} {startIndex} {t('to')} {endIndex} {t('of')} {totalItems} {t('invoicesTotal')}
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
            {t('totalOf')} {filteredAndSortedInvoices.length} {t('of')} {invoices.length} {t('invoicesText')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoicesTab;
