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

interface ComparisonMatrixProps {
  columns: Column[];
  allFeatureKeys: string[];
  currentLanguage: Language;
  onShare?: () => void;
  companyName?: string;
  employeesCount?: number;
  canEdit?: boolean;
  showBuyButtons?: boolean;
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
}) => {
  const { t } = useTranslation(currentLanguage);
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Column>>({});
  const [localColumns, setLocalColumns] = useState<Column[]>(columns);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    console.log('=== ComparisonMatrix useEffect ===');
    console.log('New columns received:', columns.length);
    console.log('Columns data:', columns);
    setLocalColumns(columns);
  }, [columns]);

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

  const saveEdit = () => {
    if (!editingColumn) return;
    
    const updatedColumns = localColumns.map(col =>
      col.id === editingColumn ? { ...col, ...editFormData } : col
    );
    
    setLocalColumns(updatedColumns);
    setEditingColumn(null);
    setEditFormData({});
    toast.success('Program updated successfully');
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
            <div className="flex border-b bg-muted/50 sticky top-0 z-20">
              {/* Sticky Feature Names Column Header */}
              <div className="sticky left-0 w-[280px] bg-card border-r p-4 z-30">
                <div className="font-semibold text-sm">{t('features')}</div>
              </div>
              
              {/* Program Column Headers */}
              {localColumns.map((column) => {
                const isEditing = editingColumn === column.id;
                
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
                <div className="sticky left-0 w-[280px] bg-black border-r p-4 z-10 shadow-lg">
                  <div className="font-medium text-sm text-white">{row.label}</div>
                </div>
                
                {/* Values */}
                {localColumns.map((column) => {
                  const isEditing = editingColumn === column.id;
                  const value = (column as any)[row.key];
                  
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
                <div className="sticky left-0 w-[280px] bg-black border-r p-4 z-10 shadow-lg">
                  <div className="text-sm font-medium text-white">{featureKey}</div>
                </div>
                
                {/* Feature Values */}
                {localColumns.map((column) => {
                  const isEditing = editingColumn === column.id;
                  const value = column.features[featureKey];
                  
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
                <div className="sticky left-0 w-[280px] bg-card border-r p-4 z-10">
                  <div className="text-sm font-medium opacity-0">-</div>
                </div>
                
                {/* Buy Buttons */}
                {localColumns.map((column) => (
                  <div key={column.id} className="w-[240px] flex-shrink-0 p-4 border-r last:border-r-0 flex items-center justify-center">
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                      onClick={() => {
                        // TODO: Connect buy logic later
                        console.log('Buy clicked for:', column.insurer, column.program_code);
                      }}
                    >
                      Pirkt
                    </Button>
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