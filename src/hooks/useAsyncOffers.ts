import { useEffect, useMemo, useRef, useState } from "react";

export type Program = {
  // Backend may include one of these (prefer row_id, else id)
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
  status?: "error" | "parsed" | "success";
  error?: string | null;
  programs: Program[];
};

export type OfferResult = OfferGroup; // legacy alias

export type Column = {
  id: string;
  label: string;
  source_file: string;
  type?: "program" | "error";
  row_id?: number; // optional; edits can resolve on demand if needed
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
  /**
   * Optional extra headers (e.g., multi-tenant):
   * { "X-Org-Id": "123", "X-User-Id": "456" }
   */
  headers?: Record<string, string>;
};

/** Build default tenant headers from localStorage (non-breaking, optional). */
function defaultTenantHeaders(): Record<string, string> {
  try {
    if (typeof window === "undefined") return {};
    const org = window.localStorage?.getItem("orgId");
    const usr = window.localStorage?.getItem("userId");
    const h: Record<string, string> = {};
    if (org) h["X-Org-Id"] = String(org);
    if (usr) h["X-User-Id"] = String(usr);
    return h;
  } catch {
    return {};
  }
}

export function useAsyncOffers({
  backendUrl,
  jobId,
  documentIds,
  pollMs = 2000,
  headers,
}: UseAsyncOffersArgs) {
  const [offers, setOffers] = useState<OfferGroup[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const stopRef = useRef(false);

  // Merge optional caller headers with default tenant headers
  const baseHeaders = useMemo(() => {
    return { ...defaultTenantHeaders(), ...(headers || {}) };
  }, [JSON.stringify(headers || {})]);

  const fetchJob = async (id: string) => {
    const res = await fetch(`${backendUrl}/jobs/${encodeURIComponent(id)}`, {
      headers: { ...baseHeaders },
    });
    if (!res.ok) throw new Error(`Job fetch failed (${res.status})`);
    return (await res.json()) as Job;
  };

  const fetchOffersByJob = async (id: string) => {
    const res = await fetch(`${backendUrl}/offers/by-job/${encodeURIComponent(id)}`, {
      headers: { ...baseHeaders },
    });
    if (!res.ok) throw new Error(`Offers fetch failed (${res.status})`);
    return (await res.json()) as OfferGroup[];
  };

  const fetchOffersByDocs = async (docs: string[]) => {
    const res = await fetch(`${backendUrl}/offers/by-documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...baseHeaders },
      body: JSON.stringify({ document_ids: docs }),
    });
    if (!res.ok) throw new Error(`Offers by docs failed (${res.status})`);
    return (await res.json()) as OfferGroup[];
  };

  useEffect(() => {
    stopRef.current = false;
    setOffers([]);
    setJob(null);

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
            return; // stop when complete
          }
        } else if (documentIds?.length) {
          const o = await fetchOffersByDocs(documentIds);
          if (stopRef.current) return;
          setOffers(o);
        }
      } catch {
        // swallow transient background errors
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
  }, [backendUrl, jobId, JSON.stringify(documentIds), pollMs, JSON.stringify(baseHeaders)]);

  const { columns, allFeatureKeys } = useMemo(() => {
    const cols: Column[] = [];

    for (const g of offers) {
      // If a document failed (no programs + error/status), surface a single "error column"
      if ((!g.programs || g.programs.length === 0) && (g.status === "error" || g.error)) {
        cols.push({
          id: `${g.source_file}::error`,
          label: g.source_file,
          source_file: g.source_file,
          type: "error",
          features: {},
          group: g,
          error: g.error || "Processing failed",
        });
        continue;
      }

      // Normal program columns
      for (const [i, program] of (g.programs || []).entries()) {
        const rid = program.row_id ?? program.id; // prefer DB id
        // Always unique & stable:
        const fallbackId = `${g.source_file}::${program.insurer ?? ""}::${program.program_code ?? ""}::${i}`;

        cols.push({
          id: rid ? String(rid) : fallbackId,
          label: program.insurer || g.source_file,
          source_file: g.source_file,
          type: "program",
          row_id: rid,
          insurer: program.insurer,
          program_code: program.program_code,
          premium_eur: program.premium_eur ?? null,
          base_sum_eur: program.base_sum_eur ?? null,
          payment_method: program.payment_method ?? null,
          features: program.features || {},
          group: g,
        });
      }
    }

    const featureSet = new Set<string>();
    for (const col of cols) {
      if (col.type === "error") continue;
      Object.keys(col.features || {}).forEach((k) => featureSet.add(k));
    }

    return { columns: cols, allFeatureKeys: Array.from(featureSet).sort() };
  }, [offers]);

  return { offers, job, columns, allFeatureKeys, isLoading };
}
