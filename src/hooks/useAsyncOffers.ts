import { useEffect, useMemo, useRef, useState } from "react";

export type Program = {
  row_id?: number;
  id?: number;
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
  status?: 'error' | 'success';
  error?: string;
  programs: Program[];
};

export type OfferResult = OfferGroup; // alias for backward compatibility

export type Column = {
  id: string;
  label: string;
  source_file: string;
  type?: 'program' | 'error';
  row_id?: number;
  insurer?: string;
  program_code?: string | null;
  premium_eur?: number | null;
  base_sum_eur?: number | null;
  payment_method?: string | null;
  features: Record<string, any>;
  group: OfferGroup;
  error?: string;
};

type Job = { total: number; done: number; errors: Array<{ document_id: string; error: string }> };

type UseAsyncOffersArgs = {
  backendUrl: string;
  jobId?: string | null;
  documentIds?: string[] | null;
  pollMs?: number;
};

export function useAsyncOffers({ backendUrl, jobId, documentIds, pollMs = 2000 }: UseAsyncOffersArgs) {
  const [offers, setOffers] = useState<OfferGroup[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const stopRef = useRef(false);

  const fetchJob = async (id: string) => {
    const res = await fetch(`${backendUrl}/jobs/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`Job fetch failed (${res.status})`);
    return (await res.json()) as Job;
  };

  const fetchOffersByJob = async (id: string) => {
    const res = await fetch(`${backendUrl}/offers/by-job/${encodeURIComponent(id)}`);
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

  useEffect(() => {
    stopRef.current = false;
    setOffers([]);
    setJob(null);

    // IMPORTANT: no jobId AND no docs => do not fetch anything
    if (!jobId && !documentIds?.length) return;

    let t: any;
    const loop = async () => {
      try {
        setIsLoading(true);

        if (jobId) {
          const j = await fetchJob(jobId);
          if (stopRef.current) return;
          setJob(j);

          const o = await fetchOffersByJob(jobId);
          if (stopRef.current) return;
          setOffers(o);

          if (j.done >= j.total) {
            setIsLoading(false);
            return; // stop polling when done
          }
        } else if (documentIds?.length) {
          const o = await fetchOffersByDocs(documentIds);
          if (stopRef.current) return;
          setOffers(o);
        }
      } catch {
        // ignore transient errors during background processing
      } finally {
        if (!stopRef.current && (jobId || documentIds?.length)) {
          t = setTimeout(loop, pollMs);
        }
      }
    };

    loop();
    return () => {
      stopRef.current = true;
      if (t) clearTimeout(t);
    };
  }, [backendUrl, jobId, JSON.stringify(documentIds), pollMs]);

  const { columns, allFeatureKeys } = useMemo(() => {
    const cols = offers.flatMap((g) =>
      g.programs.map((program) => ({
        id: `${g.source_file}::${program.insurer}::${program.program_code}`,
        label: program.insurer || g.source_file,
        source_file: g.source_file,
        row_id: program.row_id || program.id,
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
