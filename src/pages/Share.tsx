import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Language, useTranslation } from '@/utils/translations';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ComparisonMatrix } from '@/components/dashboard/ComparisonMatrix';
import { OfferResult, Column } from '@/hooks/useAsyncOffers';

const BACKEND_URL = 'https://gpt-vis.onrender.com';

interface ShareData {
  ok: boolean;
  token: string;
  inquiry_id: number;
  payload: {
    company_name: string;
    employees_count: number;
  };
  offers: OfferResult[];
}

const Share = () => {
  const { token } = useParams<{ token: string }>();
  const [currentLanguage, setCurrentLanguage] = useState<Language>('lv');
  const { t } = useTranslation(currentLanguage);
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShareData = async () => {
      if (!token) return;
      
      setLoading(true);
      try {
        const response = await fetch(`${BACKEND_URL}/shares/${token}`);
        if (!response.ok) {
          throw new Error('Share not found');
        }
        const data: ShareData = await response.json();
        setShareData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load share');
      } finally {
        setLoading(false);
      }
    };

    fetchShareData();
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
          canEdit={false}
        />
      </div>
    </div>
  );
};

export default Share;