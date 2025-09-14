import { useEffect, useMemo, useRef, useState } from "react";

export type Program = {
  insurer?: string;
  program_code?: string | null;
  base_sum_eur?: number | null;
  premium_eur?: number | null;
  payment_method?: string | null;
  features: Record<string, any>;
};

export type OfferGroup = {
  source_file: string;
  inquiry_id?: number | null;
  programs: Program[];
};

export type OfferResult = OfferGroup; // alias for backward compatibility

export type Column = {
  id: string;
  label: string;
  source_file: string;
  insurer?: string;
  program_code?: string | null;
  premium_eur?: number | null;
  base_sum_eur?: number | null;
  payment_method?: string | null;
  features: Record<string, any>;
  group: OfferGroup;
};

type Job = { total: number; done: number; errors: Array<{ document_id: string; error: string }>; docs?: string[] };

type UseAsyncOffersArgs = {
  backendUrl: string;
  jobId?: string | null;
  // optional: if you want to pull by known documents instead of job:
  documentIds?: string[] | null;
  pollMs?: number;
};

export function useAsyncOffers({ backendUrl, jobId, documentIds, pollMs = 2000 }: UseAsyncOffersArgs) {
  const [offers, setOffers] = useState<OfferGroup[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const stopRef = useRef(false);

  // Debug logging
  console.log('=== useAsyncOffers Debug ===');
  console.log('backendUrl:', backendUrl);
  console.log('jobId:', jobId);
  console.log('documentIds:', documentIds);
  console.log('offers.length:', offers.length);
  console.log('job:', job);
  console.log('=== End useAsyncOffers Debug ===');

  // fetch helpers
  const fetchJob = async (id: string) => {
    const res = await fetch(`${backendUrl}/jobs/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`Job fetch failed (${res.status})`);
    return (await res.json()) as Job;
  };

  const fetchOffersByJob = async (id: string) => {
    const res = await fetch(`${backendUrl}/offers/by-job/${encodeURIComponent(id)}`, { method: "GET" });
    if (!res.ok) throw new Error(`Offers fetch failed (${res.status})`);
    return (await res.json()) as OfferGroup[];
  };

  const fetchOffersByDocs = async (docs: string[]) => {
    const res = await fetch(`${backendUrl}/offers/by-documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_ids: docs }),
    });
    if (!res.ok) throw new Error(`Offers by docs failed (${res.status})`);
    return (await res.json()) as OfferGroup[];
  };

  // polling
  useEffect(() => {
    console.log('=== useAsyncOffers useEffect triggered ===');
    console.log('Dependencies changed:', { backendUrl, jobId, documentIds });
    
    // Always stop previous polling first
    stopRef.current = true;
    
    // Reset to clean state immediately
    setOffers([]);
    setJob(null);
    setIsLoading(false);
    
    // If no jobId or documentIds, stay in clean state
    if (!jobId && !documentIds?.length) {
      console.log('No jobId or documentIds, maintaining clean state');
      return;
    }

    // Small delay to allow cleanup, then start fresh polling
    const startFreshPolling = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      stopRef.current = false;
      console.log('Starting fresh polling for jobId:', jobId);

      let t: any;
      const loop = async () => {
        try {
          setIsLoading(true);
          if (jobId && !stopRef.current) {
            // 1) get job status
            const j = await fetchJob(jobId);
            if (stopRef.current) return;
            setJob(j);

            // 2) get offers for that job
            const o = await fetchOffersByJob(jobId);
            if (stopRef.current) return;
            setOffers(o);

            // stop when done, else keep polling
            if (j.done >= j.total) {
              setIsLoading(false);
              return;
            }
          } else if (documentIds?.length && !stopRef.current) {
            const o = await fetchOffersByDocs(documentIds);
            if (stopRef.current) return;
            setOffers(o);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('Polling error:', error);
          // keep polling; transient errors happen while background tasks run
        } finally {
          if (!stopRef.current && (jobId || documentIds?.length)) {
            t = setTimeout(loop, pollMs);
          } else {
            setIsLoading(false);
          }
        }
      };

      loop();
      
      return () => {
        stopRef.current = true;
        if (t) clearTimeout(t);
        setIsLoading(false);
      };
    };
    
    startFreshPolling();
    
    return () => {
      stopRef.current = true;
    };
  }, [backendUrl, jobId, JSON.stringify(documentIds), pollMs]);

  // build columns & feature keys for ComparisonMatrix
  const { columns, allFeatureKeys } = useMemo(() => {
    const cols = offers.flatMap((g, groupIndex) =>
      g.programs.map((program, programIndex) => ({
        id: `${g.source_file}::${program.insurer}::${program.program_code}::${groupIndex}::${programIndex}`,
        label: program.insurer || g.source_file,
        source_file: g.source_file,
        insurer: program.insurer,
        program_code: program.program_code,
        premium_eur: program.premium_eur,
        base_sum_eur: program.base_sum_eur,
        payment_method: program.payment_method,
        features: program.features || {},
        group: g,
      }))
    );

    const featureSet = new Set<string>();
    for (const col of cols) {
      Object.keys(col.features || {}).forEach((k) => featureSet.add(k));
    }
    return { columns: cols, allFeatureKeys: Array.from(featureSet).sort() };
  }, [offers]);

  return { offers, job, columns, allFeatureKeys, isLoading };
}
