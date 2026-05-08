import {useTranslations} from 'next-intl';
import {contactInfo} from '@/utils';

type TourCTAProps = {
  tourTitle: string;
};

export function TourCTA({tourTitle}: TourCTAProps) {
  const t = useTranslations('tourDetail');

  const whatsappMessage = encodeURIComponent(
    `Hi! I'm interested in the "${tourTitle}" tour.`,
  );
  const whatsappUrl = `https://wa.me/${contactInfo.whatsApp.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`;

  const emailSubject = encodeURIComponent(`Inquiry: ${tourTitle}`);
  const emailUrl = `mailto:${contactInfo.email}?subject=${emailSubject}`;

  return (
    <div className="flex flex-col gap-3 mb-5">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 px-4 rounded-lg type-title-sm font-semibold hover:brightness-105 cursor-pointer elevation-2 hover:elevation-3 transition-[box-shadow,filter] duration-200"
      >
        <i className="fab fa-whatsapp text-lg" />
        {t('whatsappUs')}
      </a>
      <a
        href={emailUrl}
        className="flex items-center justify-center gap-2 bg-primary text-on-primary py-3 px-4 rounded-lg type-title-sm font-semibold hover:brightness-105 cursor-pointer elevation-2 hover:elevation-3 transition-[box-shadow,filter] duration-200"
      >
        <i className="fa fa-envelope" />
        {t('emailInquiry')}
      </a>
    </div>
  );
}
