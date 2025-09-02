import React from 'react';
import { Shield } from 'lucide-react';

interface InsurerLogoProps {
  name?: string;
  className?: string;
}

export function InsurerLogo({ name, className = 'h-5 w-5' }: InsurerLogoProps) {
  const key = (name || '').toUpperCase();
  
  if (key === 'BTA') {
    return <img src="/logos/bta.svg" alt="BTA" className={className} />;
  }
  
  if (key === 'BTA2') {
    return <img src="/logos/bta2.svg" alt="BTA2" className={className} />;
  }
  
  // Fallback: simple shield icon
  return <Shield className={className} aria-label="insurer" />;
}