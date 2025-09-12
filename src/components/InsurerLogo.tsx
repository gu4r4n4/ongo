import React from 'react';
import { Shield } from 'lucide-react';

interface InsurerLogoProps {
  name?: string;
  className?: string;
}

export function InsurerLogo({ name, className = 'h-5 w-5' }: InsurerLogoProps) {
  const key = (name || '').toUpperCase();
  
  const logoMap: Record<string, string> = {
    'BTA': '/logos/bta-new.svg',
    'BAL': '/logos/bal.svg',
    'COM': '/logos/com.svg',
    'ERG': '/logos/erg.svg',
    'GJE': '/logos/gje.svg',
    'IFI': '/logos/ifi.svg',
    'SEE': '/logos/see.svg'
  };
  
  if (logoMap[key]) {
    return <img src={logoMap[key]} alt={key} className={className} />;
  }
  
  // Fallback: simple shield icon
  return <Shield className={className} aria-label="insurer" />;
}