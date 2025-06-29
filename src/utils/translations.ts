
export type Language = 'lv' | 'en' | 'ru' | 'et' | 'lt' | 'no' | 'sv' | 'da' | 'fr' | 'de' | 'es';

export const languages: { code: Language; name: string; flag: string }[] = [
  { code: 'lv', name: 'Latviešu', flag: '🇱🇻' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'et', name: 'Eesti', flag: '🇪🇪' },
  { code: 'lt', name: 'Lietuvių', flag: '🇱🇹' },
  { code: 'no', name: 'Norsk', flag: '🇳🇴' },
  { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
  { code: 'da', name: 'Dansk', flag: '🇩🇰' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

export const translations = {
  lv: {
    admin: 'Admin',
    dashboard: 'Panelis',
    invoices: 'Rēķini',
    inquiries: 'Pieteikumi',
    apiConnection: 'API Savienojums',
    manageInvoices: 'Pārvaldiet rēķinus un konfigurējiet API savienojumus',
  },
  en: {
    admin: 'Admin',
    dashboard: 'Dashboard',
    invoices: 'Invoices',
    inquiries: 'Inquiries',
    apiConnection: 'API Connection',
    manageInvoices: 'Manage invoices and configure API connections',
  },
  ru: {
    admin: 'Админ',
    dashboard: 'Панель',
    invoices: 'Счета',
    inquiries: 'Запросы',
    apiConnection: 'API Соединение',
    manageInvoices: 'Управляйте счетами и настраивайте API соединения',
  },
  et: {
    admin: 'Admin',
    dashboard: 'Armatuurlaud',
    invoices: 'Arved',
    inquiries: 'Päringud',
    apiConnection: 'API Ühendus',
    manageInvoices: 'Hallake arveid ja konfigureerige API ühendusi',
  },
  lt: {
    admin: 'Admin',
    dashboard: 'Skydelis',
    invoices: 'Sąskaitos',
    inquiries: 'Užklausos',
    apiConnection: 'API Ryšys',
    manageInvoices: 'Valdykite sąskaitas ir konfigūruokite API ryšius',
  },
  no: {
    admin: 'Admin',
    dashboard: 'Dashboard',
    invoices: 'Fakturaer',
    inquiries: 'Forespørsler',
    apiConnection: 'API Tilkobling',
    manageInvoices: 'Administrer fakturaer og konfigurer API-tilkoblinger',
  },
  sv: {
    admin: 'Admin',
    dashboard: 'Dashboard',
    invoices: 'Fakturor',
    inquiries: 'Förfrågningar',
    apiConnection: 'API Anslutning',
    manageInvoices: 'Hantera fakturor och konfigurera API-anslutningar',
  },
  da: {
    admin: 'Admin',
    dashboard: 'Dashboard',
    invoices: 'Fakturaer',
    inquiries: 'Forespørgsler',
    apiConnection: 'API Forbindelse',
    manageInvoices: 'Administrer fakturaer og konfigurer API-forbindelser',
  },
  fr: {
    admin: 'Admin',
    dashboard: 'Tableau de bord',
    invoices: 'Factures',
    inquiries: 'Demandes',
    apiConnection: 'Connexion API',
    manageInvoices: 'Gérez les factures et configurez les connexions API',
  },
  de: {
    admin: 'Admin',
    dashboard: 'Dashboard',
    invoices: 'Rechnungen',
    inquiries: 'Anfragen',
    apiConnection: 'API Verbindung',
    manageInvoices: 'Verwalten Sie Rechnungen und konfigurieren Sie API-Verbindungen',
  },
  es: {
    admin: 'Admin',
    dashboard: 'Panel',
    invoices: 'Facturas',
    inquiries: 'Consultas',
    apiConnection: 'Conexión API',
    manageInvoices: 'Gestione facturas y configure conexiones API',
  },
};

export const useTranslation = (language: Language) => {
  return {
    t: (key: keyof typeof translations.lv) => translations[language][key] || translations.en[key],
    language,
  };
};
