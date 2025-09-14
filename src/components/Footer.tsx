import { Language, useTranslation } from "@/utils/translations";

interface FooterProps {
  currentLanguage: Language;
}

const Footer = ({ currentLanguage }: FooterProps) => {
  const { t } = useTranslation(currentLanguage);

  return (
    <footer className="bg-muted/50 border-t border-border mt-16">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="text-center text-sm text-muted-foreground">
          <p>&copy; 2024 {t('admin') || 'Admin Panel'}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;