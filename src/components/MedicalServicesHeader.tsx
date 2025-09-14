import { Language, useTranslation } from "@/utils/translations";
import { Badge } from "@/components/ui/badge";

interface MedicalServicesHeaderProps {
  currentLanguage: Language;
}

const MedicalServicesHeader = ({ currentLanguage }: MedicalServicesHeaderProps) => {
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
        'Psihiatrs (pēc čekiem)'
      ]
    },
    {
      title: 'Attālintas',
      color: 'bg-red-100 text-red-800',
      services: [
        'Attālinātas ārstu konsultācijas'
      ]
    }
  ];

  return (
    <div className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 border border-border rounded-xl p-6 mb-8 shadow-sm">
      <div className="max-w-7xl mx-auto">
        {/* Top Row - 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Patient Payment Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              PACIENTA IEMAKSA
            </h3>
            <p className="text-sm text-muted-foreground">
              Maksājums, kuru pacients veic, saņemot valsts apmaksātus veselības aprūpes pakalpojumus
            </p>
            <a 
              href="https://www.vmnvd.gov.lv/lv/veselibas-aprupes-pakalpojumi/ambulatoras-iestades-un-arsti-specialisti"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 underline block"
            >
              Ārstniecības iestāžu saraksts un valsts apmaksātie ambulatorie pakalpojumi →
            </a>
          </div>

          {/* Paid Services Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              MAKSAS AMBULATORIE PAKALPOJUMI
            </h3>
            <p className="text-sm text-muted-foreground">
              Privāti apmaksāti medicīnas pakalpojumi
            </p>
            <a 
              href="https://registri.vi.gov.lv/air"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 underline block mb-4"
            >
              Maksas pakalpojuma saņemšanai iespējams izvēlēties pakalpojuma sniedzēju →
            </a>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Maksas diagnostiskajiem pakalpojumiem nepieciešams ārsta nosūtījums</li>
              <li>• Tiek piemērots apdrošinātāja pakalpojuma apmaksas cenrādis</li>
              <li>• Par neapmaksāto daļu iespējams saņemt pārmaksāto IIN</li>
            </ul>
          </div>
        </div>

        {/* Bottom Row - Full Width Doctor Visits Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            Ārsta vizītes
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Pieejamie medicīnas speciālisti un pakalpojumi
          </p>
          
          {/* Medical Categories - 3 Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Column 1 */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Badge className="text-black" variant="secondary" style={{ backgroundColor: '#81d8d0' }}>
                  Vispārīgs
                </Badge>
                <ul className="space-y-1 ml-2">
                  <li className="text-sm text-muted-foreground">• Ģimenes ārsts (maksas)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Badge className="text-black" variant="secondary" style={{ backgroundColor: '#81d8d0' }}>
                  Alternatīvs
                </Badge>
                <ul className="space-y-1 ml-2">
                  <li className="text-sm text-muted-foreground">• Homeopāts</li>
                  <li className="text-sm text-muted-foreground">• Osteopāts</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Badge className="text-black" variant="secondary" style={{ backgroundColor: '#81d8d0' }}>
                  Akadēmisks
                </Badge>
                <ul className="space-y-1 ml-2">
                  <li className="text-sm text-muted-foreground">• Docenta konsultācija</li>
                </ul>
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Badge className="text-black" variant="secondary" style={{ backgroundColor: '#81d8d0' }}>
                  Speciālists
                </Badge>
                <ul className="space-y-1 ml-2">
                  <li className="text-sm text-muted-foreground">• Kardiologs, LOR, neirologs</li>
                  <li className="text-sm text-muted-foreground">• Ginekologs, urologs u.c.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Badge className="text-black" variant="secondary" style={{ backgroundColor: '#81d8d0' }}>
                  Sports
                </Badge>
                <ul className="space-y-1 ml-2">
                  <li className="text-sm text-muted-foreground">• Sporta ārsts</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Badge className="text-black" variant="secondary" style={{ backgroundColor: '#81d8d0' }}>
                  Mentāls
                </Badge>
                <ul className="space-y-1 ml-2">
                  <li className="text-sm text-muted-foreground">• Psihologs, psihoterapeits</li>
                  <li className="text-sm text-muted-foreground">• Psihiatrs (pēc čekiem)</li>
                </ul>
              </div>
            </div>

            {/* Column 3 */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Badge className="text-black" variant="secondary" style={{ backgroundColor: '#81d8d0' }}>
                  Āda
                </Badge>
                <ul className="space-y-1 ml-2">
                  <li className="text-sm text-muted-foreground">• Dermatologs</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Badge className="text-black" variant="secondary" style={{ backgroundColor: '#81d8d0' }}>
                  Terapija
                </Badge>
                <ul className="space-y-1 ml-2">
                  <li className="text-sm text-muted-foreground">• Fizikālās terapijas ārsts</li>
                  <li className="text-sm text-muted-foreground">• Rehabilitologs, fizioterapeits</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Badge className="text-black" variant="secondary" style={{ backgroundColor: '#81d8d0' }}>
                  Attālināts
                </Badge>
                <ul className="space-y-1 ml-2">
                  <li className="text-sm text-muted-foreground">• Attālinātas ārstu konsultācijas</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalServicesHeader;