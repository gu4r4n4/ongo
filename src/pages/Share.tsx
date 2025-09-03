import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Check, Minus } from 'lucide-react';
import { InsurerLogo } from '@/components/InsurerLogo';
import { Skeleton } from '@/components/ui/skeleton';

// Types based on user requirements
interface Program {
  insurer: string;
  program_code: string;
  base_sum_eur: number;
  premium_eur: number;
  payment_method?: string | null;
  features: Record<string, any>;
}

interface ShareResult {
  source_file: string;
  programs: Program[];
}

interface ShareViewOut {
  company_name?: string | null;
  employees_count?: number | null;
  results: ShareResult[];
}

const Share = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<ShareViewOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  useEffect(() => {
    const fetchShare = async () => {
      if (!token) {
        setError('No token provided');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`https://visbrokerhouse.onrender.com/shares/${encodeURIComponent(token)}`);
        
        if (response.status === 404) {
          setError('not_found');
          setLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result: ShareViewOut = await response.json();
        setData(result);
        
        // Set first tab as active
        if (result.results.length > 0) {
          setActiveTab('r0');
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load share');
      } finally {
        setLoading(false);
      }
    };

    fetchShare();
  }, [token]);

  const ShareResultCard = ({ data }: { data: ShareResult }) => {
    // If any program is BTA/BTA2, show the LV title; else default title
    const usesBTA = data.programs.some(p => p.insurer === 'BTA' || p.insurer === 'BTA2');
    const cardTitle = usesBTA ? 'Veselības apdrošināšana' : 'Processing Results';

    return (
      <Card>
        <CardHeader>
          <CardTitle>{cardTitle}</CardTitle>
          <CardDescription>
            File: {data.source_file} • {data.programs?.length || 0} programs found
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.programs.map((program, idx) => (
            <div key={idx} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{program.insurer}</Badge>
                  <Badge>{program.program_code}</Badge>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Premium</div>
                  <div className="font-semibold">€{program.premium_eur}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Base Sum:</span>
                  <span className="ml-2 font-medium">€{program.base_sum_eur?.toLocaleString?.() ?? program.base_sum_eur}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Payment:</span>
                  <span className="ml-2 font-medium capitalize">{program.payment_method || '-'}</span>
                </div>
              </div>

              {program.features && Object.keys(program.features).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm font-medium mb-2">Features:</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {Object.entries(program.features).map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-muted-foreground">{k}:</span>
                          <span className={v === 'Yes' || v === 'v' || v === true ? 'text-green-600' : v === 'No' || v === '-' || v === false ? 'text-red-600' : ''}>
                            {v === 'v' || v === 'Yes' || v === true ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : v === '-' || v === 'No' || v === false ? (
                              <Minus className="h-4 w-4 text-red-600" />
                            ) : (
                              String(v)
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 p-4 border rounded-lg">
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error === 'not_found') {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[50vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Link Not Found</CardTitle>
            <CardDescription className="text-center">
              This share link has expired or does not exist.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[50vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Error Loading Share</CardTitle>
            <CardDescription className="text-center">
              {error || 'Failed to load shared data'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const tabMeta = data.results.map((r, i) => {
    const p = r.programs?.[0];
    const label = p
      ? `${(p.insurer || '').toUpperCase()} — ${p.program_code || ''}`.trim()
      : r.source_file || `Result ${i + 1}`;
    return { id: `r${i}`, label, insurer: p?.insurer, file: r.source_file };
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Top info panel */}
      <div className="grid gap-4 sm:grid-cols-2 p-4 border rounded-lg bg-card">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-sm text-muted-foreground">iekļauts polises segumā</span>
          </div>
          <div className="flex items-center gap-2">
            <Minus className="h-4 w-4 text-red-600" />
            <span className="text-sm text-muted-foreground">nav iekļauts polises segumā</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-sm">
            <span className="text-muted-foreground">Company:</span>
            <span className="ml-2 font-medium">{data.company_name || '—'}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Employee Count:</span>
            <span className="ml-2 font-medium">{data.employees_count || '—'}</span>
          </div>
        </div>
      </div>

      {/* Header - no Share button on this page */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Processing Results</h1>
      </div>

      {/* Tabs and Results */}
      {data.results.length > 0 && (
        <Tabs value={activeTab ?? tabMeta[0]?.id} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-1 h-auto p-1">
            {tabMeta.map(({ id, insurer, label }) => (
              <TabsTrigger 
                key={id} 
                value={id} 
                className="flex items-center gap-2 text-xs sm:text-sm p-2 h-auto justify-start"
              >
                <InsurerLogo name={insurer} />
                <span className="truncate">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {data.results.map((r, i) => (
            <TabsContent key={i} value={`r${i}`} className="mt-4">
              <ShareResultCard data={r} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
};

export default Share;