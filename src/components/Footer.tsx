import { Language, useTranslation } from "@/utils/translations";
import { Badge } from "@/components/ui/badge";

interface FooterProps {
  currentLanguage: Language;
}

const Footer = ({ currentLanguage }: FooterProps) => {
  const { t } = useTranslation(currentLanguage);

  const medicalCategories = [
    {
      title: t('general'),
      color: 'bg-teal-100 text-teal-800',
      services: [
        'Ģimenes ārsts (maksas)',
      ]
    },
    {
      title: t('specialist'),
      color: 'bg-teal-100 text-teal-800',
      services: [
        'Kardiologs, LOR, neirologs',
        'Ginekologs, urologs u.c.'
      ]
    },
    {
      title: t('skin'),
      color: 'bg-red-100 text-red-800',
      services: [
        'Dermatologs'
      ]
    },
    {
      title: t('alternative'),
      color: 'bg-teal-100 text-teal-800',
      services: [
        'Homeopāts',
        'Osteopāts'
      ]
    },
    {
      title: t('sports'),
      color: 'bg-teal-100 text-teal-800',
      services: [
        'Sporta ārsts'
      ]
    },
    {
      title: t('therapy'),
      color: 'bg-red-100 text-red-800',
      services: [
        'Fizikālās terapijas ārsts',
        'Rehabilitologs, fizioterapeits'
      ]
    },
    {
      title: 'Akadēmisks',
      color: 'bg-teal-100 text-teal-800',
      services: [
        'Docenta konsultācija'
      ]
    },
    {
      title: 'Mentāls', 
      color: 'bg-teal-100 text-teal-800',
      services: [
        'Psihologs, psihoterapeits',
        'Psihiatrs (pēc ćēkeniem)'
      ]
    },
    {
      title: 'Attālintas',
      color: 'bg-red-100 text-red-800',
      services: [
        'Attālinatas ārstu konsultācijas'
      ]
    }
  ];

  return (
    <div className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 border border-border rounded-xl p-6 mb-8 shadow-sm">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Patient Payment Section */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">
              {t('patientPayment')}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('patientPaymentDesc')}
            </p>
            <p className="text-sm text-muted-foreground">
              Ārsniecības iestāžu saraksts un valsts apmaksātie ambulatorie pakalpojumi →
            </p>
          </div>

          {/* Paid Services Section */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">
              {t('paidServices')}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('paidServicesDesc')}
            </p>
            <p className="text-sm text-muted-foreground mb-2">
              Maksas pakalpojuma saņemšanai iespējams izvēlēties pakalpojuma sniedzēju →
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Maksas diagnostiskajiem pakalpojumiem nepieciešams ārsta nosūtījums</li>
              <li>• Tiek piemērots apdrošinātāja pakalpojuma apmaksas cenrādis</li>
              <li>• Par neapmaksāto daļu iespējams saņemt pārmaksāto IIN</li>
            </ul>
          </div>

          {/* Doctor Visits Section */}  
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">
              {t('doctorVisits')}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {t('doctorVisitsDesc')}
            </p>
          </div>
        </div>

        {/* Medical Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {medicalCategories.map((category, index) => (
            <div key={index} className="space-y-3">
              <Badge className={category.color}>
                {category.title}
              </Badge>
              <ul className="space-y-1">
                {category.services.map((service, serviceIndex) => (
                  <li key={serviceIndex} className="text-sm text-muted-foreground">
                    • {service}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Footer;