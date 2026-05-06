import {useTranslations} from 'next-intl';
import {motion} from 'framer-motion';
import {contactInfo} from '@/utils';
import {useMagnetic} from '@/hooks/use-magnetic';

type TourCTAProps = {
  tourTitle: string;
};

export function TourCTA({tourTitle}: TourCTAProps) {
  const t = useTranslations('tourDetail');

  const {
    ref: whatsappRef,
    x: whatsappX,
    y: whatsappY,
    onMouseMove: whatsappMouseMove,
    onMouseLeave: whatsappMouseLeave,
  } = useMagnetic(0.3, 80);

  const {
    ref: emailRef,
    x: emailX,
    y: emailY,
    onMouseMove: emailMouseMove,
    onMouseLeave: emailMouseLeave,
  } = useMagnetic(0.3, 80);

  const whatsappMessage = encodeURIComponent(
    `Hi! I'm interested in the "${tourTitle}" tour.`,
  );
  const whatsappUrl = `https://wa.me/${contactInfo.whatsApp.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`;

  const emailSubject = encodeURIComponent(`Inquiry: ${tourTitle}`);
  const emailUrl = `mailto:${contactInfo.email}?subject=${emailSubject}`;

  return (
    <div className="flex flex-col gap-3 mb-5">
      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        ref={whatsappRef as React.RefObject<HTMLAnchorElement>}
        onMouseMove={whatsappMouseMove}
        onMouseLeave={whatsappMouseLeave}
        style={{x: whatsappX, y: whatsappY}}
        whileHover={{scale: 1.02}}
        whileTap={{scale: 0.97}}
        className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 px-4 rounded-lg type-title-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer elevation-2 hover:elevation-3 transition-shadow"
      >
        <i className="fab fa-whatsapp text-lg" />
        {t('whatsappUs')}
      </motion.a>
      <motion.a
        href={emailUrl}
        ref={emailRef as React.RefObject<HTMLAnchorElement>}
        onMouseMove={emailMouseMove}
        onMouseLeave={emailMouseLeave}
        style={{x: emailX, y: emailY}}
        whileHover={{scale: 1.02}}
        whileTap={{scale: 0.97}}
        className="flex items-center justify-center gap-2 bg-primary text-on-primary py-3 px-4 rounded-lg type-title-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer elevation-2 hover:elevation-3 transition-shadow"
      >
        <i className="fa fa-envelope" />
        {t('emailInquiry')}
      </motion.a>
    </div>
  );
}
