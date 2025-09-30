import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Language, useTranslation } from '@/utils/translations';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ComparisonMatrix } from '@/components/dashboard/ComparisonMatrix';
import type { Column } from '@/hooks/useAsyncOffers';
import { BACKEND_URL } from '@/config';

type ApiShare = {
  ok: boolean;
  token: string;
  payload?: {
    company_name?: string;
    employees_count?: number;
    editable?: boolean;
    role?: string;
    allow_edit_fields?: string[];
    view_prefs?: {
      column_order?: string[];
      hidden_features?: string[];
    };
  };
  offers: Array<{
    source_file: string;
    inquiry_id?: number | null;
    programs: Array<{
      row_id?: number;
      id?: number;
      insurer?: string | null;
      program_code?: string | null;
      base_sum_eur?: number | null;
      premium_eur?: number | null;
      payment_method?: string | null;
      features?: Record<string, any>;
    }>;
  }>;
};

const Share = () => {
  const { token } = useParams<{ token: string }>();
  const [currentLanguage, setCurrentLanguage] = useState<Language>('lv');
  const { t } = useTranslation(currentLanguage);
  const [data, setData] = useState<ApiShare | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${BACKEND_URL}/shares/${encodeURIComponent(token)}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json(); // { ok, payload, offers: [...] }
        setData(json);
      } catch (e: any) {
        console.error('Share fetch error:', e);
        setError(e?.message || 'Failed to load share');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.ok) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Share Not Found</CardTitle>
            <CardDescription className="text-center">
              The shared link you're looking for doesn't exist or has expired.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Build columns from groups returned by the API
  const columns: Column[] = (data.offers || []).flatMap(g =>
    (g.programs || []).map(p => {
      const rid = (p as any).row_id ?? (p as any).id;
      return {
        id: rid ? String(rid) : `${g.source_file}::${p.insurer ?? ''}::${p.program_code ?? ''}`,
        label: p.insurer || g.source_file,
        source_file: g.source_file,
        row_id: rid,
        insurer: p.insurer || undefined,
        program_code: p.program_code || undefined,
        premium_eur: p.premium_eur ?? null,
        base_sum_eur: p.base_sum_eur ?? null,
        payment_method: p.payment_method ?? null,
        features: p.features || {},
        group: g as any,
      };
    })
  );

  const allFeatureKeys = Array.from(
    new Set(columns.flatMap(col => Object.keys(col.features || {})))
  ).sort();

  const companyName = data.payload?.company_name;
  const employeesCount = data.payload?.employees_count;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Shared Insurance Offers</h1>
            <p className="text-gray-600">Comparison of insurance programs</p>
          </div>
          <LanguageSwitcher
            currentLanguage={currentLanguage}
            onLanguageChange={setCurrentLanguage}
          />
        </div>

        <ComparisonMatrix
          columns={columns}
          allFeatureKeys={allFeatureKeys}
          currentLanguage={currentLanguage}
          companyName={companyName}
          employeesCount={employeesCount}
          sharePrefs={data.payload?.view_prefs}   // ✅ apply saved order/hidden rows
          canEdit={true}            // 🔓 enable editing in Step 1
          showBuyButtons={true}     // show CTA row (approve/insurer links)
          isShareView={true}        // refetches by token after saves
          backendUrl={BACKEND_URL}  // used for PATCH/DELETE and refetch
          shareToken={token}        // lets matrix re-pull /shares/:token
        />
      </div>
    </div>
  );
};

export default Share;
