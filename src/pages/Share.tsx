import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Language, useTranslation } from '@/utils/translations';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ComparisonMatrix } from '@/components/dashboard/ComparisonMatrix';
import { OfferResult, Column } from '@/hooks/useAsyncOffers';
import { supabase } from '@/integrations/supabase/client';

import { BACKEND_URL } from "@/config";

interface ShareData {
  ok: boolean;
  token: string;
  inquiry_id: number;
  payload: {
    company_name: string;
    employees_count: number;
  };
  offers: OfferResult[];
  editable?: boolean;
  view_prefs?: {
    column_order: string[];
    hidden_features: string[];
  };
}

const Share = () => {
  const { token } = useParams<{ token: string }>();
  const [currentLanguage, setCurrentLanguage] = useState<Language>('lv');
  const { t } = useTranslation(currentLanguage);
  const [shareData, setShareData] = useState<ShareData | null>(null);
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
        const data = await res.json(); // shape: { ok, token, payload, offers, ... }
        setShareData(data);
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

  if (error || !shareData?.ok) {
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

  // Normalize offers into columns
  const columns: Column[] = shareData.offers.flatMap(offer =>
    offer.programs.map(program => ({
      id: `${offer.source_file}::${program.insurer}::${program.program_code}`,
      label: program.insurer || offer.source_file,
      source_file: offer.source_file,
      row_id: (program as any).row_id,
      insurer: program.insurer,
      program_code: program.program_code,
      premium_eur: program.premium_eur,
      base_sum_eur: program.base_sum_eur,
      payment_method: program.payment_method,
      features: program.features || {},
      group: offer,
    }))
  );

  // Get all unique feature keys
  const allFeatureKeys = Array.from(
    new Set(columns.flatMap(col => Object.keys(col.features)))
  ).sort();

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
          companyName={shareData.payload?.company_name}
          employeesCount={shareData.payload?.employees_count}
          canEdit={true}
          showBuyButtons={true}
          isShareView={true}
          backendUrl={BACKEND_URL}
          shareToken={token}
        />
      </div>
    </div>
  );
};

export default Share;