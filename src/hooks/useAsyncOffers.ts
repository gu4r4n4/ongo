import { useState, useEffect, useRef } from 'react';

const BACKEND_URL = 'https://gpt-vis.onrender.com';

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
      const response = await fetch(`${BACKEND_URL}/jobs/${currentJobId}`);
      if (response.ok) {
        const jobData: JobStatus = await response.json();
        console.log('Job data:', jobData);
        setJob(jobData);
        
        if (jobData.done >= jobData.total) {
          if (jobIntervalRef.current) {
            clearInterval(jobIntervalRef.current);
            jobIntervalRef.current = null;
          }
          
          // Continue polling offers for 6 more seconds to catch last writes
          extraPollingTimeoutRef.current = setTimeout(() => {
            if (offersIntervalRef.current) {
              clearInterval(offersIntervalRef.current);
              offersIntervalRef.current = null;
            }
            setIsLoading(false);
          }, 6000);
        }
      } else {
        console.error('Job polling failed:', response.status, response.statusText);
      }
    } catch (err) {
      console.error('Failed to poll job:', err);
    }
  };

  const pollOffers = async (currentInquiryId: number) => {
    try {
      console.log('Polling offers for inquiry:', currentInquiryId);
      const response = await fetch(`${BACKEND_URL}/offers/by-inquiry/${currentInquiryId}`);
      if (response.ok) {
        const offersData: OfferResult[] = await response.json();
        console.log('Offers data:', offersData);
        setOffers(offersData);
      } else {
        console.error('Offers polling failed:', response.status, response.statusText);
      }
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