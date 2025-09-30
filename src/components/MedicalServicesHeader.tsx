import { Language, useTranslation } from "@/utils/translations";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

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
        {/* New Informational Block */}
        <div className="space-y-6 mb-8 pb-8 border-b border-border">
          {/* Title Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              {t('patientPaymentTitle')}
            </h3>
            <a 
              href="https://www.rindapiearsta.lv/lv/mekle_isako"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 underline block"
            >
              {t('waitingTimeLink')}
            </a>
          </div>

          {/* Service Availability Section */}
          <div className="space-y-3">
            <h4 className="text-base font-medium text-foreground">
              {t('serviceAvailability')}
            </h4>
            <div className="flex flex-wrap gap-2">
              <Badge className="text-white hover:bg-[#004287]" variant="secondary" style={{ backgroundColor: '#004287' }}>
                {t('contractedFacilityService')}
              </Badge>
              <Badge className="text-white hover:bg-[#004287] inline-flex items-center gap-1.5" variant="secondary" style={{ backgroundColor: '#004287' }}>
                <span>{t('receiptPayment')}</span>
                <Check className="h-3.5 w-3.5 text-white" />
              </Badge>
              <Badge className="text-white hover:bg-[#004287]" variant="secondary" style={{ backgroundColor: '#004287' }}>
                {t('familyDoctorVisit')}
              </Badge>
              <Badge className="text-white hover:bg-[#004287]" variant="secondary" style={{ backgroundColor: '#004287' }}>
                {t('specialistVisit')}
              </Badge>
              <Badge className="text-white hover:bg-[#004287]" variant="secondary" style={{ backgroundColor: '#004287' }}>
                {t('hospitalTreatment')}
              </Badge>
              <Badge className="text-white hover:bg-[#004287]" variant="secondary" style={{ backgroundColor: '#004287' }}>
                {t('dayCareHospital')}
              </Badge>
            </div>
          </div>

          {/* Health Checks Section */}
          <div className="space-y-3">
            <a 
              href="https://likumi.lv/doc.php?id=189070"
              target="_blank"
              rel="noopener noreferrer"
              className="text-base font-medium text-foreground hover:text-blue-600 underline block"
            >
              {t('mandatoryHealthChecksTitle')}
            </a>
            <a 
              href="https://www.csdd.lv/veselibas-parbaude/karteja-parbaude"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 underline block"
            >
              {t('driverLicenseInfoLink')}
            </a>
          </div>
        </div>

        {/* Top Row - 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Patient Payment Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              {t('patientPayment')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('patientPaymentDesc')}
            </p>
            <a 
              href="https://www.vmnvd.gov.lv/lv/veselibas-aprupes-pakalpojumi/ambulatoras-iestades-un-arsti-specialisti"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 underline block"
            >
              {t('treatmentFacilitiesLink')}
            </a>
          </div>

          {/* Paid Services Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              {t('paidServices')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('paidServicesDesc')}
            </p>
            <a 
              href="https://registri.vi.gov.lv/air"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 underline block mb-4"
            >
              {t('paidServiceProviderLink')}
            </a>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• {t('diagnosticsReferralNote')}</li>
              <li>• {t('insurerPricelistNote')}</li>
              <li>• {t('taxRefundNote')}</li>
            </ul>
          </div>
        </div>

        {/* Bottom Row - Full Width Doctor Visits Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            {t('doctorVisits')}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {t('doctorVisitsDesc')}
          </p>
          
          {/* Medical Categories - 3 Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Column 1 */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Badge className="text-white" variant="secondary" style={{ backgroundColor: '#004287' }}>
                  {t('general')}
                </Badge>
                <ul className="space-y-1 ml-2">
                  <li className="text-sm text-muted-foreground">• {t('familyDoctorPaid')}</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Badge className="text-white" variant="secondary" style={{ backgroundColor: '#004287' }}>
                  {t('alternative')}
                </Badge>
                <ul className="space-y-1 ml-2">
                  <li className="text-sm text-muted-foreground">• {t('homeopath')}</li>
                  <li className="text-sm text-muted-foreground">• {t('osteopath')}</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Badge className="text-white" variant="secondary" style={{ backgroundColor: '#004287' }}>
                  {t('academic')}
                </Badge>
                <ul className="space-y-1 ml-2">
                  <li className="text-sm text-muted-foreground">• {t('docentConsultation')}</li>
                </ul>
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Badge className="text-white" variant="secondary" style={{ backgroundColor: '#004287' }}>
                  {t('specialist')}
                </Badge>
                <ul className="space-y-1 ml-2">
                  <li className="text-sm text-muted-foreground">• {t('cardiologistEtc')}</li>
                  <li className="text-sm text-muted-foreground">• {t('gynecologistEtc')}</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Badge className="text-white" variant="secondary" style={{ backgroundColor: '#004287' }}>
                  {t('sports')}
                </Badge>
                <ul className="space-y-1 ml-2">
                  <li className="text-sm text-muted-foreground">• {t('sportsDoctor')}</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Badge className="text-white" variant="secondary" style={{ backgroundColor: '#004287' }}>
                  {t('mental')}
                </Badge>
                <ul className="space-y-1 ml-2">
                  <li className="text-sm text-muted-foreground">• {t('psychologistTherapist')}</li>
                  <li className="text-sm text-muted-foreground">• {t('psychiatristReceipts')}</li>
                </ul>
              </div>
            </div>

            {/* Column 3 */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Badge className="text-white" variant="secondary" style={{ backgroundColor: '#004287' }}>
                  {t('skin')}
                </Badge>
                <ul className="space-y-1 ml-2">
                  <li className="text-sm text-muted-foreground">• {t('dermatologist')}</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Badge className="text-white" variant="secondary" style={{ backgroundColor: '#004287' }}>
                  {t('therapy')}
                </Badge>
                <ul className="space-y-1 ml-2">
                  <li className="text-sm text-muted-foreground">• {t('physicalTherapyDoctor')}</li>
                  <li className="text-sm text-muted-foreground">• {t('rehabilitationPhysio')}</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Badge className="text-white" variant="secondary" style={{ backgroundColor: '#004287' }}>
                  {t('remote')}
                </Badge>
                <ul className="space-y-1 ml-2">
                  <li className="text-sm text-muted-foreground">• {t('remoteDoctorConsultations')}</li>
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