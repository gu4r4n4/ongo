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
    <footer className="bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200 mt-20">
      <div className="container mx-auto p-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Patient Payment Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {t('patientPayment')}
            </h3>
            <p className="text-sm text-blue-600 mb-4">
              {t('patientPaymentDesc')}
            </p>
            <p className="text-sm text-blue-600">
              Ārsniecības iestāžu saraksts un valsts apmaksātie ambulatorie pakalpojumi →
            </p>
          </div>

          {/* Paid Services Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {t('paidServices')}
            </h3>
            <p className="text-sm text-blue-600 mb-4">
              {t('paidServicesDesc')}
            </p>
            <p className="text-sm text-blue-600 mb-2">
              Maksas pakalpojuma saņemšanai iespējams izvēlēties pakalpojuma sniedzēju →
            </p>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>• Maksas diagnostiskajiem pakalpojumiem nepieciešams ārsta nosūtījums</li>
              <li>• Tiek piemērots apdrošinātāja pakalpojuma apmaksas cenrādis</li>
              <li>• Par neapmaksāto daļu iespējams saņemt pārmaksāto IIN</li>
            </ul>
          </div>

          {/* Doctor Visits Section */}  
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {t('doctorVisits')}
            </h3>
            <p className="text-sm text-blue-600 mb-6">
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
                  <li key={serviceIndex} className="text-sm text-gray-600">
                    • {service}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;