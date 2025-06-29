
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useDashboardData = () => {
  const { data: inquiries = [], isLoading: inquiriesLoading } = useQuery({
    queryKey: ['insurance_inquiries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('insurance_inquiries')
        .select('*')
        .order('received_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  return {
    inquiries,
    invoices,
    isLoading: inquiriesLoading || invoicesLoading
  };
};
