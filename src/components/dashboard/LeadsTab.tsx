
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Trash2, AlertCircle } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { Language, useTranslation } from "@/utils/translations";
import { useToast } from "@/hooks/use-toast";

interface Lead {
  id: number;
  title: string;
  category_name: string | null;
  city: string | null;
  phone: string | null;
  website: string | null;
}

interface LeadsTabProps {
  currentLanguage: Language;
}

const LeadsTab = ({ currentLanguage }: LeadsTabProps) => {
  const { t } = useTranslation(currentLanguage);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('id', { ascending: false });
      
      if (error) {
        console.error('Error fetching leads:', error);
        throw error;
      }
      
      return data as Lead[];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (leadIds: number[]) => {
      const { error } = await supabase
        .from('leads')
        .delete()
        .in('id', leadIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setSelectedLeads([]);
      toast({
        title: "Success",
        description: `${selectedLeads.length} lead(s) deleted successfully`,
      });
    },
    onError: (error) => {
      console.error('Error deleting leads:', error);
      toast({
        title: "Error",
        description: "Failed to delete leads",
        variant: "destructive",
      });
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
  } = usePagination({
    data: leads,
    itemsPerPage: 10
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(paginatedData.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectLead = (leadId: number, checked: boolean) => {
    if (checked) {
      setSelectedLeads(prev => [...prev, leadId]);
    } else {
      setSelectedLeads(prev => prev.filter(id => id !== leadId));
    }
  };

  const handleDelete = () => {
    if (selectedLeads.length === 0) {
      toast({
        title: "No selection",
        description: "Please select leads to delete",
        variant: "destructive",
      });
      return;
    }
    
    deleteMutation.mutate(selectedLeads);
  };

  const handleExportCSV = () => {
    const leadsToExport = selectedLeads.length > 0 
      ? leads.filter(lead => selectedLeads.includes(lead.id))
      : leads;

    if (leadsToExport.length === 0) {
      toast({
        title: "No data",
        description: "No leads to export",
        variant: "destructive",
      });
      return;
    }

    const csvContent = [
      ['ID', 'Title', 'Category', 'City', 'Phone', 'Website'],
      ...leadsToExport.map(lead => [
        lead.id,
        lead.title,
        lead.category_name || '',
        lead.city || '',
        lead.phone || '',
        lead.website || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Success",
      description: `Exported ${leadsToExport.length} lead(s) to CSV`,
    });
  };

  const allCurrentPageSelected = useMemo(() => {
    return paginatedData.length > 0 && paginatedData.every(lead => selectedLeads.includes(lead.id));
  }, [paginatedData, selectedLeads]);

  const someCurrentPageSelected = useMemo(() => {
    return paginatedData.some(lead => selectedLeads.includes(lead.id));
  }, [paginatedData, selectedLeads]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading leads...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <AlertCircle className="h-6 w-6" />
              Leads
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={handleExportCSV}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
                size="sm"
                disabled={selectedLeads.length === 0 || deleteMutation.isPending}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete ({selectedLeads.length})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No leads found
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={allCurrentPageSelected}
                          onCheckedChange={handleSelectAll}
                          indeterminate={someCurrentPageSelected && !allCurrentPageSelected}
                        />
                      </TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Website</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedLeads.includes(lead.id)}
                            onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{lead.id}</TableCell>
                        <TableCell>{lead.title}</TableCell>
                        <TableCell>{lead.category_name || '-'}</TableCell>
                        <TableCell>{lead.city || '-'}</TableCell>
                        <TableCell>{lead.phone || '-'}</TableCell>
                        <TableCell>
                          {lead.website ? (
                            <a 
                              href={lead.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {lead.website}
                            </a>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-600">
                      Showing {startIndex} to {endIndex} of {totalItems} leads
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousPage}
                      disabled={!hasPreviousPage}
                    >
                      Previous
                    </Button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(page)}
                        className="w-8"
                      >
                        {page}
                      </Button>
                    ))}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextPage}
                      disabled={!hasNextPage}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadsTab;
