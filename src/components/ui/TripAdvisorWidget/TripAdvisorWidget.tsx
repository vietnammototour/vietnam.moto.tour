import {TripAdvisorIcon} from '@/components/ui/TripAdvisorIcon';
import {Button} from '@/components/ui/Button';
import {WidgetShell} from './WidgetShell';
import type {ScriptVariant} from './buildWidgetUrl';

type TripAdvisorWidgetProps = {
  variant: ScriptVariant | 'cta';
  locationId: string;
  locale: 'en' | 'vi';
  className?: string;
  eyebrow?: string;
  href?: string;
  ctaLabel?: string;
};

export function TripAdvisorWidget(props: TripAdvisorWidgetProps) {
  const {variant, locationId, locale, className, eyebrow, href, ctaLabel} =
    props;

  if (variant === 'cta') {
    return (
      <Button
        variant="secondary"
        href={href}
        icon={<TripAdvisorIcon className="h-4 w-auto" />}
        className={className}
      >
        {ctaLabel}
      </Button>
    );
  }

  return (
    <WidgetShell
      variant={variant}
      locationId={locationId}
      locale={locale}
      className={className}
      eyebrow={eyebrow}
    />
  );
}
