import { useEffect, useMemo, useRef, useState } from "react";

export type Program = {
  row_id?: number;            // returned by BE (_aggregate_offers_rows maps DB id -> row_id)
  id?: number;                // fallback if row_id is missing
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
  status?: "error" | "success" | "parsed";
  error?: string;
  programs: Program[];
};

export type OfferResult = OfferGroup; // alias for backward compatibility

export type Column = {
  id: string;
  label: string;
  source_file: string;
  type?: "program" | "error";
  row_id: number; // required for PATCH
  insurer?: string;
  program_code?: string | null;
  premium_eur?: number | null;
  base_sum_eur?: number | null;
  payment_method?: string | null;
  features: Record<string, any>;
  group: OfferGroup;
  error?: string;
};

type Job = {
  total: number;
  done: number;
  errors: Array<{ document_id: string; error: string }>;
};

type UseAsyncOffersArgs = {
  backendUrl: string;
  jobId?: string | null;
  documentIds?: string[] | null;
  pollMs?: number;
};

export function useAsyncOffers({
  backendUrl,
  jobId,
  documentIds,
  pollMs = 2000,
}: UseAsyncOffersArgs) {
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

    // Nothing to poll
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
          setIsLoading(false); // docs mode: considered loaded after first fetch
        }
      } catch {
        // swallow transient polling errors
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
    const cols: Column[] = [];

    for (const g of offers) {
      // if backend reported an error group (no programs), render an error column
      if ((!g.programs || g.programs.length === 0) && (g.status === "error" || g.error)) {
        cols.push({
          id: `${g.source_file}::error`,
          label: g.source_file,
          source_file: g.source_file,
          type: "error",
          row_id: 0, // no edits on error columns
          insurer: undefined,
          program_code: undefined,
          premium_eur: undefined,
          base_sum_eur: undefined,
          payment_method: undefined,
          features: {},
          group: g,
          error: g.error || "Processing failed",
        });
        continue;
      }

      // normal programs
      for (const program of g.programs || []) {
        const rid = (program.row_id ?? program.id) as number | undefined;
        if (!rid) {
          // skip silently; BE should always return row_id, but this keeps UI resilient
          // console.warn(`Missing row_id for program in ${g.source_file}`, program);
          continue;
        }
        cols.push({
          id: `${g.source_file}::${program.insurer ?? ""}::${program.program_code ?? ""}`,
          label: program.insurer || g.source_file,
          source_file: g.source_file,
          type: "program",
          row_id: rid,
          insurer: program.insurer,
          program_code: program.program_code,
          premium_eur: program.premium_eur,
          base_sum_eur: program.base_sum_eur,
          payment_method: program.payment_method,
          features: program.features || {},
          group: g,
        });
      }
    }

    const featureSet = new Set<string>();
    for (const col of cols) {
      Object.keys(col.features || {}).forEach((k) => featureSet.add(k));
    }

    return { columns: cols, allFeatureKeys: Array.from(featureSet).sort() };
  }, [offers]);

  return { offers, job, columns, allFeatureKeys, isLoading };
}
