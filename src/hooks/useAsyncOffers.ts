import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Program {
  insurer: string;
  program_code: string;
  base_sum_eur: number | null;
  premium_eur: number | null;
  payment_method: string | null;
  features: Record<string, any>;
}

export interface OfferResult {
  source_file: string;
  inquiry_id: number;
  programs: Program[];
}

export interface JobStatus {
  inquiry_id: number;
  total: number;
  done: number;
  errors: string[];
}

export interface Column {
  id: string;
  source_file: string;
  insurer: string;
  program_code: string;
  premium_eur: number | null;
  base_sum_eur: number | null;
  payment_method: string | null;
  features: Record<string, any>;
}

export const useAsyncOffers = (inquiryId?: number, jobId?: string) => {
  const [offers, setOffers] = useState<OfferResult[]>([]);
  const [job, setJob] = useState<JobStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const jobIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const offersIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const extraPollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearIntervals = () => {
    if (jobIntervalRef.current) {
      clearInterval(jobIntervalRef.current);
      jobIntervalRef.current = null;
    }
    if (offersIntervalRef.current) {
      clearInterval(offersIntervalRef.current);
      offersIntervalRef.current = null;
    }
    if (extraPollingTimeoutRef.current) {
      clearTimeout(extraPollingTimeoutRef.current);
      extraPollingTimeoutRef.current = null;
    }
  };

  const pollJob = async (currentJobId: string) => {
    try {
      console.log('Polling job:', currentJobId);
      
      // Since we're using Supabase now, we'll simulate job completion
      // In a real implementation, you might store job status in Supabase too
      // For now, we'll check if offers exist for the inquiry
      if (inquiryId) {
        const { data: existingOffers, error } = await supabase
          .from('offers')
          .select('id')
          .eq('inquiry_id', inquiryId);

        if (error) {
          console.error('Error checking job status:', error);
          return;
        }

        const offerCount = existingOffers?.length || 0;
        const jobData: JobStatus = {
          inquiry_id: inquiryId,
          total: 1, // Simplified for now
          done: offerCount > 0 ? 1 : 0,
          errors: []
        };

        console.log('Job data:', jobData);
        setJob(jobData);
        
        if (jobData.done >= jobData.total) {
          if (jobIntervalRef.current) {
            clearInterval(jobIntervalRef.current);
            jobIntervalRef.current = null;
          }
          
          // Continue polling offers for 2 more seconds to catch last writes
          extraPollingTimeoutRef.current = setTimeout(() => {
            if (offersIntervalRef.current) {
              clearInterval(offersIntervalRef.current);
              offersIntervalRef.current = null;
            }
            setIsLoading(false);
          }, 2000);
        }
      }
    } catch (err) {
      console.error('Failed to poll job:', err);
    }
  };

  const pollOffers = async (currentInquiryId: number) => {
    try {
      console.log('Polling offers for inquiry:', currentInquiryId);
      
      // Fetch offers from Supabase - get parsed records with actual data
      const { data: offersData, error } = await supabase
        .from('offers')
        .select('*')
        .eq('inquiry_id', currentInquiryId)
        .eq('status', 'parsed');

      if (error) {
        console.error('Error fetching offers:', error);
        return;
      }

      console.log('Raw offers data from Supabase:', offersData);

      // Transform Supabase data to match the expected OfferResult format
      const transformedOffers: OfferResult[] = [];
      const groupedByFile: Record<string, Program[]> = {};

      offersData?.forEach(offer => {
        const filename = offer.filename || 'unknown.pdf';
        if (!groupedByFile[filename]) {
          groupedByFile[filename] = [];
        }
        
        groupedByFile[filename].push({
          insurer: offer.insurer || offer.company_hint || '',
          program_code: offer.program_code || 'Standard',
          base_sum_eur: offer.base_sum_eur,
          premium_eur: offer.premium_eur,
          payment_method: offer.payment_method,
          features: (offer.features as Record<string, any>) || {}
        });
      });

      // Convert grouped data to OfferResult format
      Object.entries(groupedByFile).forEach(([filename, programs]) => {
        transformedOffers.push({
          source_file: filename,
          inquiry_id: currentInquiryId,
          programs
        });
      });

      console.log('Transformed offers data:', transformedOffers);
      setOffers(transformedOffers);
    } catch (err) {
      console.error('Failed to poll offers:', err);
    }
  };

  useEffect(() => {
    if (!jobId || !inquiryId) return;

    setIsLoading(true);
    setError(null);

    // Start polling job status
    jobIntervalRef.current = setInterval(() => pollJob(jobId), 2000);
    
    // Start polling offers
    offersIntervalRef.current = setInterval(() => pollOffers(inquiryId), 2000);

    // Initial calls
    pollJob(jobId);
    pollOffers(inquiryId);

    return clearIntervals;
  }, [jobId, inquiryId]);

  // Also fetch offers when only inquiryId is available (for existing data)
  useEffect(() => {
    if (inquiryId && !jobId) {
      // Just fetch once if we don't have an active job
      pollOffers(inquiryId);
    }
  }, [inquiryId, jobId]);

  useEffect(() => {
    return clearIntervals;
  }, []);

  // Normalize offers into columns
  const columns: Column[] = offers.flatMap(offer =>
    offer.programs.map(program => ({
      id: `${offer.source_file}::${program.insurer}::${program.program_code}`,
      source_file: offer.source_file,
      insurer: program.insurer,
      program_code: program.program_code,
      premium_eur: program.premium_eur,
      base_sum_eur: program.base_sum_eur,
      payment_method: program.payment_method,
      features: program.features,
    }))
  );

  // Get all unique feature keys
  const allFeatureKeys = Array.from(
    new Set(columns.flatMap(col => Object.keys(col.features)))
  ).sort();

  return {
    offers,
    job,
    columns,
    allFeatureKeys,
    isLoading,
    error,
  };
};