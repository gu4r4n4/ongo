export type BrandTheme = {
  name: string;
  primary: string;         // main button/badge bg
  primaryHover?: string;
  surface?: string;        // cards / rows
  text?: string;           // default text color
  mutedText?: string;
  ring?: string;           // focus ring
  rounded?: string;        // e.g. "rounded-2xl"
  fontClass?: string;      // e.g. "font-sans" or a custom font class
  logoUrl?: string;        // large faint bg or header logo
  watermarkOpacity?: number;
};

// Neutral app default (PAS/internal)
export const appTheme: BrandTheme = {
  name: "app",
  primary: "#16A34A",
  primaryHover: "#15803D",
  surface: "white",
  text: "rgb(15,23,42)",
  mutedText: "rgb(100,116,139)",
  ring: "#16A34A",
  rounded: "rounded-xl",
};

// Broker look (ShareView)
export const brokerTheme: BrandTheme = {
  name: "broker",
  primary: "#0EA5E9",
  primaryHover: "#0284C7",
  surface: "white",
  text: "rgb(15,23,42)",
  mutedText: "rgb(100,116,139)",
  ring: "#0EA5E9",
  rounded: "rounded-2xl",
  // fontClass: "font-broker", // if you have a custom font class
};

// Example insurer brand themes (fill real brand colors/logos)
export const insurerThemes: Record<string, BrandTheme> = {
  // Key by insurer name exactly as it appears in `column.insurer`
  "BALTA": {
    name: "balta",
    primary: "#005BBB",
    primaryHover: "#004C9A",
    surface: "white",
    text: "rgb(15,23,42)",
    mutedText: "rgb(100,116,139)",
    ring: "#005BBB",
    rounded: "rounded-2xl",
    logoUrl: "/logos/balta.svg",
    watermarkOpacity: 0.06,
  },
  "BTA": {
    name: "bta",
    primary: "#E11D48",
    primaryHover: "#BE123C",
    surface: "white",
    text: "rgb(15,23,42)",
    mutedText: "rgb(100,116,139)",
    ring: "#E11D48",
    rounded: "rounded-2xl",
    logoUrl: "/logos/bta.svg",
    watermarkOpacity: 0.06,
  },
};