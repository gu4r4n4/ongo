import React from 'react';
import { Shield } from 'lucide-react';

interface InsurerLogoProps {
  name?: string;
  className?: string;
}

export function InsurerLogo({ name, className = 'h-8 w-8' }: InsurerLogoProps) {
  const key = (name || '').toUpperCase();
  
  // Map both old and new company names to logos
  const logoMap: Record<string, string> = {
    // New company names
    'SEESAM': '/logos/seesam.svg',
    'IF': '/logos/if.svg', 
    'GJENSIDIGE': '/logos/gjensidige.svg',
    'ERGO': '/logos/ergo.svg',
    'COMPENSA': '/logos/compensa.svg',
    'BAN': '/logos/ban-new.svg',
    'BALTA': '/logos/balta.svg',
    'BTA': '/logos/bta-square.svg',
    // Legacy mappings for backwards compatibility
    'SEE': '/logos/seesam.svg',
    'IFI': '/logos/if.svg',
    'GJE': '/logos/gjensidige.svg',
    'ERG': '/logos/ergo.svg',
    'COM': '/logos/compensa.svg',
    'BAL': '/logos/balta.svg'
  };
  
  if (logoMap[key]) {
    return <img src={logoMap[key]} alt={key} className={className} />;
  }
  
  // Fallback: simple shield icon
  return <Shield className={className} aria-label="insurer" />;
}