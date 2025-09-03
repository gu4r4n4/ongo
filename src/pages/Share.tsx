import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Check, Minus } from 'lucide-react';
import { InsurerLogo } from '@/components/InsurerLogo';
import { Skeleton } from '@/components/ui/skeleton';
import { Language, useTranslation } from '@/utils/translations';
import LanguageSwitcher from '@/components/LanguageSwitcher';

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
  const [currentLanguage, setCurrentLanguage] = useState<Language>('lv');
  const { t } = useTranslation(currentLanguage);
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

      {/* Header with language switcher */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('processingResults')}</h1>
        <LanguageSwitcher
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
        />
      </div>

      {/* Tabs and Results */}
      {data.results.length > 0 && (
        <div>
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

          {/* Static Info Footer */}
          <div className="mt-8">
            <Separator />
            
            <div className="grid gap-6 mt-6 md:grid-cols-2">
              {/* Patient Payment Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    PACIENTA IEMAKSA
                  </CardTitle>
                  <CardDescription>
                    Maksājums, kuru pacients veic, saņemot valsts apmaksātus veselības aprūpes pakalpojumus
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <a
                    href="http://www.vmnvd.gov.lv/lv/veselibas-aprupes-pakalpojumi/ambulatoras-iestades-un-arsti-specialisti"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    Ārstniecības iestāžu saraksts un valsts apmaksātie ambulatorie pakalpojumi →
                  </a>
                </CardContent>
              </Card>

              {/* Paid Services Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    MAKSAS AMBULATORIE PAKALPOJUMI
                  </CardTitle>
                  <CardDescription>
                    Privāti apmaksāti medicīnas pakalpojumi
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <a
                    href="http://www.vi.gov.lv/lv/air"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm block"
                  >
                    Maksas pakalpojuma saņemšanai iespējams izvēlēties pakalpojuma sniedzēju →
                  </a>
                  
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Maksas diagnostiskajiem pakalpojumiem nepieciešams ārsta nosūtījums</p>
                    <p>• Tiek piemērots apdrošinātāja pakalpojuma apmaksas cenrādis</p>
                    <p>• Par neapmaksāto daļu iespējams saņemt pārmaksāto IIN</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Doctor Visits Card */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Ārsta vizītes</CardTitle>
                <CardDescription>Pieejamie medicīnas speciālisti un pakalpojumi</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {/* General */}
                  <div className="space-y-2">
                    <Badge variant="secondary" className="mb-2 bg-badge-category text-black hover:bg-badge-category hover:text-black">{t('general')}</Badge>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>• Ģimenes ārsts (maksas)</p>
                    </div>
                  </div>

                  {/* Specialists */}
                  <div className="space-y-2">
                    <Badge variant="outline" className="mb-2 bg-badge-category text-black">{t('specialist')}</Badge>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>• Kardiologs, LOR, neirologs</p>
                      <p>• Ginekologs, urologs u.c.</p>
                    </div>
                  </div>

                  {/* Skin */}
                  <div className="space-y-2">
                    <Badge variant="outline" className="mb-2 bg-badge-category text-black">{t('skin')}</Badge>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>• Dermatologs</p>
                    </div>
                  </div>

                  {/* Alternative */}
                  <div className="space-y-2">
                    <Badge variant="outline" className="mb-2 bg-badge-category text-black">{t('alternative')}</Badge>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>• Homeopāts</p>
                      <p>• Osteopāts</p>
                    </div>
                  </div>

                  {/* Sports */}
                  <div className="space-y-2">
                    <Badge variant="outline" className="mb-2 bg-badge-category text-black">{t('sports')}</Badge>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>• Sporta ārsts</p>
                    </div>
                  </div>

                  {/* Therapy */}
                  <div className="space-y-2">
                    <Badge variant="outline" className="mb-2 bg-badge-category text-black">{t('therapy')}</Badge>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>• Fizikālās terapijas ārsts</p>
                      <p>• Rehabilitologs, fizioterapeits</p>
                    </div>
                  </div>

                  {/* Academic */}
                  <div className="space-y-2">
                    <Badge variant="outline" className="mb-2 bg-badge-category text-black">{t('academic')}</Badge>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>• Docenta konsultācija</p>
                    </div>
                  </div>

                  {/* Mental Health */}
                  <div className="space-y-2">
                    <Badge variant="outline" className="mb-2 bg-badge-category text-black">{t('mental')}</Badge>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>• Psihologs, psihoterapeits</p>
                      <p>• Psihiatrs (pēc čekiem)</p>
                    </div>
                  </div>

                  {/* Remote */}
                  <div className="space-y-2">
                    <Badge variant="outline" className="mb-2 bg-badge-category text-black">{t('remote')}</Badge>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>• Attālinātas ārstu konsultācijas</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Share;