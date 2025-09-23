import React, { createContext, useContext } from "react";
import type { BrandTheme } from "./brandTheme";

const BrandThemeCtx = createContext<BrandTheme | null>(null);
export const useBrandTheme = () => useContext(BrandThemeCtx);

export const BrandThemeProvider: React.FC<{ theme: BrandTheme; children: React.ReactNode }> = ({ theme, children }) => {
  // Expose CSS vars once, so components can use Tailwind "arbitrary value" classes like bg-[var(--brand-primary)]
  const style: React.CSSProperties = {
    // colors
    ["--brand-primary" as any]: theme.primary,
    ["--brand-primary-hover" as any]: theme.primaryHover ?? theme.primary,
    ["--brand-surface" as any]: theme.surface ?? "white",
    ["--brand-text" as any]: theme.text ?? "inherit",
    ["--brand-muted-text" as any]: theme.mutedText ?? "inherit",
    ["--brand-ring" as any]: theme.ring ?? theme.primary,
    // watermark not a CSS var; handled where needed
  };

  return (
    <BrandThemeCtx.Provider value={theme}>
      <div style={style} className={theme.fontClass ?? ""}>
        {children}
      </div>
    </BrandThemeCtx.Provider>
  );
};