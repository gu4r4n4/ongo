import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, Minus, Edit, Save, X, Share2 } from 'lucide-react';
import { InsurerLogo } from '@/components/InsurerLogo';
import { Column } from '@/hooks/useAsyncOffers';
import { Language, useTranslation } from '@/utils/translations';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

// Feature name translation utility
const translateFeatureName = (featureKey: string, t: (key: any) => string): string => {
  // Common feature translations - you can expand this mapping
  const featureTranslations: Record<string, string> = {
    // English to translation key mappings
    'Doctor visits': t('doctorVisits'),
    'General practitioner': t('familyDoctorPaid'),
    'Specialist': t('specialist'),
    'Dermatologist': t('dermatologist'),
    'Cardiologist': t('cardiologistEtc'),
    'Psychologist': t('psychologistTherapist'),
    'Sports doctor': t('sportsDoctor'),
    'Physical therapy': t('physicalTherapyDoctor'),
    'Remote consultations': t('remoteDoctorConsultations'),
    // Add more feature translations as needed
  };
  
  // Return translation if exists, otherwise return original key
  return featureTranslations[featureKey] || featureKey;
};

interface ComparisonMatrixProps {
  columns: Column[];
  allFeatureKeys: string[];
  currentLanguage: Language;
  onShare?: () => void;
  companyName?: string;
  employeesCount?: number;
  canEdit?: boolean;
  showBuyButtons?: boolean;
  isShareView?: boolean;
  backendUrl?: string;
  onRefreshOffers?: () => void;
}

export const ComparisonMatrix: React.FC<ComparisonMatrixProps> = ({
  columns,
  allFeatureKeys,
  currentLanguage,
  onShare,
  companyName,
  employeesCount,
  canEdit = true,
  showBuyButtons = false,
  isShareView = false,
  backendUrl,
  onRefreshOffers,
}) => {
  const { t } = useTranslation(currentLanguage);
  const isMobile = useIsMobile();
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Column>>({});
  const [localColumns, setLocalColumns] = useState<Column[]>(columns);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Update local columns when new data arrives - but preserve edits
  useEffect(() => {
    if (editingColumn) {
      // If currently editing, don't update at all to preserve edits
      return;
    }
    // Only update when not editing
    setLocalColumns(columns);
  }, [columns, editingColumn]);

  // Drag scrolling functionality
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      setIsDragging(true);
      setStartX(e.pageX - container.offsetLeft);
      setScrollLeft(container.scrollLeft);
      container.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 2;
      container.scrollLeft = scrollLeft - walk;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      container.style.cursor = 'grab';
    };

    const handleMouseLeave = () => {
      setIsDragging(false);
      container.style.cursor = 'grab';
    };

    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseLeave);

    container.style.cursor = 'grab';

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isDragging, startX, scrollLeft]);

  const renderValue = (value: any) => {
    if (value === true || value === 'v' || value === 'Yes') {
      return <Check className="h-4 w-4 text-green-600" />;
    }
    if (value === false || value === '-' || value === 'No' || value === null || value === '') {
      return <Minus className="h-4 w-4 text-red-600" />;
    }
    return <span className="text-sm">{String(value)}</span>;
  };

  const startEdit = (columnId: string) => {
    if (!canEdit) return;
    const column = localColumns.find(col => col.id === columnId);
    if (column) {
      setEditingColumn(columnId);
      setEditFormData({ ...column });
    }
  };

  const cancelEdit = () => {
    setEditingColumn(null);
    setEditFormData({});
  };

  const savePremium = async (program: { row_id?: number }, value: string | number) => {
    if (!program.row_id) throw new Error("Missing row_id from offers payload");
    if (!backendUrl) throw new Error("Backend URL not provided");
    
    const num = Number(String(value).replace(",", "."));
    if (Number.isNaN(num)) throw new Error("Invalid number");

    const res = await fetch(`${backendUrl}/offers/${program.row_id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ premium_eur: num }),
    });
    if (!res.ok) throw new Error(await res.text());

    if (onRefreshOffers) {
      await onRefreshOffers(); // refetch GET /offers/by-job/{job_id}
    }
    toast.success('Premium updated successfully');
  };

  const saveEdit = async () => {
    if (!editingColumn) return;
    
    try {
      const column = localColumns.find(col => col.id === editingColumn);
      if (!column) return;

      // Save premium if changed
      if (editFormData.premium_eur !== undefined && editFormData.premium_eur !== column.premium_eur) {
        await savePremium(column, editFormData.premium_eur);
      }

      // For now, only handle premium updates. Base sum and payment method will be added later
      setEditingColumn(null);
      setEditFormData({});
    } catch (error: any) {
      toast.error(`Failed to save: ${error.message}`);
    }
  };

  if (localColumns.length === 0) {
    return null;
  }

  const metaRows = [
    { key: 'base_sum_eur', label: t('baseSum') },
    { key: 'payment_method', label: t('payment') },
  ];

  return (
    <div className="space-y-4">
      {/* Legend and company info */}
      {(companyName || employeesCount) && (
        <div className="grid gap-4 sm:grid-cols-2 p-4 border rounded-lg bg-card">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">{t('includedInPolicy')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Minus className="h-4 w-4 text-red-600" />
              <span className="text-sm text-muted-foreground">{t('notIncludedInPolicy')}</span>
            </div>
          </div>
          <div className="space-y-1">
            {companyName && (
              <div className="text-sm">
                <span className="text-muted-foreground">{t('company')}:</span>
                <span className="ml-2 font-medium">{companyName}</span>
              </div>
            )}
            {employeesCount && (
              <div className="text-sm">
                <span className="text-muted-foreground">{t('employeeCount')}:</span>
                <span className="ml-2 font-medium">{employeesCount}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Title and Share button - only show in editable mode */}
      {canEdit && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('processingResults')}</h3>
          {onShare && (
            <Button
              variant="outline"
              onClick={onShare}
              disabled={localColumns.length === 0}
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              {t('share')}
            </Button>
          )}
        </div>
      )}

      {/* Comparison Matrix */}
      <Card>
        <div ref={scrollContainerRef} className="overflow-x-auto select-none">
          <div className="min-w-fit">
            {/* Header Row */}
            <div className={`flex border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${isShareView && !isMobile ? 'sticky top-0 z-50' : 'sticky top-0 z-20'}`}>
              {/* Sticky Feature Names Column Header */}
              <div className={`w-[280px] bg-card border-r p-4 ${isMobile ? '' : 'sticky left-0 z-30'}`}>
                <div className="font-semibold text-sm">{t('features')}</div>
              </div>
              
              {/* Program Column Headers */}
              {localColumns.map((column) => {
                const isEditing = editingColumn === column.id;
                
                // Handle error columns
                if (column.type === 'error') {
                  return (
                    <div key={column.id} className="w-[240px] flex-shrink-0 p-4 border-r last:border-r-0 bg-red-50 dark:bg-red-950/20">
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className="w-12 h-12 flex items-center justify-center rounded-md bg-red-100 dark:bg-red-900/30">
                          <X className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="font-semibold text-sm text-red-600">{column.label}</div>
                        <Badge variant="destructive" className="text-xs">FAILED</Badge>
                        <div className="text-xs text-red-600 max-w-full break-words">
                          Processing Failed
                        </div>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div key={column.id} className="w-[240px] flex-shrink-0 p-4 border-r last:border-r-0 bg-card">
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="w-12 h-12 flex items-center justify-center rounded-md bg-muted/30">
                        <InsurerLogo name={column.insurer} className="w-10 h-10 object-contain" />
                      </div>
                      <div className="font-semibold text-sm truncate w-full">{column.insurer}</div>
                      <Badge variant="outline" className="text-xs truncate max-w-full">{column.program_code}</Badge>
                      
                      {isEditing ? (
                        <div className="w-full space-y-2">
                          <Input
                            placeholder={t('premium')}
                            type="number"
                            value={editFormData.premium_eur || ''}
                            onChange={(e) => setEditFormData(prev => ({
                              ...prev,
                              premium_eur: e.target.value ? Number(e.target.value) : null
                            }))}
                            className="text-center"
                          />
                          <div className="flex gap-1">
                            <Button size="sm" onClick={saveEdit} className="flex-1">
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelEdit} className="flex-1">
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-lg font-bold text-primary truncate">
                            €{column.premium_eur?.toLocaleString() || '—'}
                          </div>
                          {canEdit && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEdit(column.id)}
                              className="h-6 w-full p-0 text-xs"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Meta Rows */}
            {metaRows.map((row) => (
              <div key={row.key} className="flex border-b">
                {/* Sticky Feature Name */}
                <div className={`w-[280px] bg-black border-r p-4 z-10 shadow-lg ${isMobile ? '' : 'sticky left-0'}`}>
                  <div className="font-medium text-sm text-white">{row.label}</div>
                </div>
                
                {/* Values */}
                {localColumns.map((column) => {
                  const isEditing = editingColumn === column.id;
                  const value = (column as any)[row.key];
                  
                  // Handle error columns - show error message for first meta row, dash for others
                  if (column.type === 'error') {
                    return (
                      <div key={column.id} className="w-[240px] flex-shrink-0 p-4 border-r last:border-r-0 flex items-center justify-center bg-red-50 dark:bg-red-950/20">
                        {row.key === 'base_sum_eur' ? (
                          <div className="text-xs text-red-600 text-center max-w-full break-words px-2">
                            {column.error || 'Processing failed'}
                          </div>
                        ) : (
                          <span className="text-sm text-red-400">—</span>
                        )}
                      </div>
                    );
                  }
                  
                  return (
                    <div key={column.id} className="w-[240px] flex-shrink-0 p-4 border-r last:border-r-0 flex items-center justify-center">
                      {isEditing && row.key === 'payment_method' ? (
                        <Select
                          value={editFormData.payment_method || ''}
                          onValueChange={(value) => setEditFormData(prev => ({
                            ...prev,
                            payment_method: value
                          }))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                            <SelectItem value="one-time">One-time</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : isEditing && row.key === 'base_sum_eur' ? (
                        <Input
                          type="number"
                          value={editFormData.base_sum_eur || ''}
                          onChange={(e) => setEditFormData(prev => ({
                            ...prev,
                            base_sum_eur: e.target.value ? Number(e.target.value) : null
                          }))}
                          className="text-center"
                        />
                      ) : row.key === 'base_sum_eur' ? (
                        <span className="text-sm font-medium">
                          €{value?.toLocaleString() || '—'}
                        </span>
                      ) : (
                        <span className="text-sm">{value || '—'}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Feature Rows */}
            {allFeatureKeys.map((featureKey, index) => (
              <div 
                key={featureKey} 
                className={`flex border-b ${index % 2 === 0 ? 'bg-muted/10' : ''}`}
              >
                {/* Sticky Feature Name */}
                <div className={`w-[280px] bg-black border-r p-4 z-10 shadow-lg ${isMobile ? '' : 'sticky left-0'}`}>
                  <div className="text-sm font-medium text-white">{translateFeatureName(featureKey, t)}</div>
                </div>
                
                {/* Feature Values */}
                {localColumns.map((column) => {
                  const isEditing = editingColumn === column.id;
                  const value = column.features?.[featureKey];
                  
                  // Handle error columns - show dash for all features
                  if (column.type === 'error') {
                    return (
                      <div key={column.id} className="w-[240px] flex-shrink-0 p-4 border-r last:border-r-0 flex items-center justify-center bg-red-50 dark:bg-red-950/20">
                        <Minus className="h-4 w-4 text-red-400" />
                      </div>
                    );
                  }
                  
                  return (
                    <div key={column.id} className="w-[240px] flex-shrink-0 p-4 border-r last:border-r-0 flex items-center justify-center">
                      {isEditing ? (
                        <Input
                          value={editFormData.features?.[featureKey] || ''}
                          onChange={(e) => setEditFormData(prev => ({
                            ...prev,
                            features: {
                              ...(prev.features || {}),
                              [featureKey]: e.target.value
                            }
                          }))}
                          className="text-center"
                        />
                      ) : (
                        renderValue(value)
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Buy Buttons Row - only in share view */}
            {showBuyButtons && (
              <div className="flex bg-muted/20">
                {/* Empty space for feature name column */}
                <div className={`w-[280px] bg-card border-r p-4 z-10 ${isMobile ? '' : 'sticky left-0'}`}>
                  <div className="text-sm font-medium opacity-0">-</div>
                </div>
                
                {/* Buy Buttons */}
                {localColumns.map((column) => (
                  <div key={column.id} className="w-[240px] flex-shrink-0 p-4 border-r last:border-r-0 flex items-center justify-center">
                    {column.type === 'error' ? (
                      <Button 
                        disabled
                        className="w-full bg-gray-300 text-gray-500 cursor-not-allowed"
                      >
                        Unavailable
                      </Button>
                    ) : (
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                        onClick={() => {
                          // TODO: Connect buy logic later
                          console.log('Buy clicked for:', column.insurer, column.program_code);
                        }}
                      >
                        Pirkt
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};