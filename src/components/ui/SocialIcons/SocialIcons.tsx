import {contactInfo} from '@/utils';

type Variant = 'compact' | 'default';

type Props = {
  variant?: Variant;
  className?: string;
};

const VARIANTS: Record<Variant, {box: string; icon: string; gap: string}> = {
  compact: {
    box: 'w-11 h-11 bg-transparent hover:bg-primary hover:text-on-primary text-on-surface-inverse',
    icon: 'text-xl',
    gap: 'gap-2',
  },
  default: {
    box: 'w-11 h-11 bg-surface-alt hover:bg-primary hover:text-on-primary text-on-surface-secondary',
    icon: 'text-xl',
    gap: 'gap-3',
  },
};

export function SocialIcons({variant = 'default', className}: Props) {
  const v = VARIANTS[variant];
  const whatsAppHref = `https://wa.me/${contactInfo.whatsApp.replace(/[^0-9]/g, '')}`;

  return (
    <div className={`flex items-center ${v.gap} ${className ?? ''}`}>
      <a
        href={contactInfo.youtubeLink}
        aria-label="YouTube"
        target="_blank"
        rel="noopener noreferrer"
        className={`${v.box} ${v.icon} flex items-center justify-center transition-colors cursor-pointer`}
      >
        <i className="fab fa-youtube" aria-hidden="true" />
      </a>
      <a
        href={contactInfo.tripadvisorLink}
        aria-label="TripAdvisor"
        target="_blank"
        rel="noopener noreferrer"
        className={`${v.box} ${v.icon} flex items-center justify-center transition-colors cursor-pointer`}
      >
        <i className="fab fa-tripadvisor" aria-hidden="true" />
      </a>
      <a
        href={whatsAppHref}
        aria-label="WhatsApp"
        target="_blank"
        rel="noopener noreferrer"
        className={`${v.box} ${v.icon} flex items-center justify-center transition-colors cursor-pointer`}
      >
        <i className="fab fa-whatsapp" aria-hidden="true" />
      </a>
    </div>
  );
}
