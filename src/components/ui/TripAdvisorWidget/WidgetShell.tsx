import {TripAdvisorIcon} from '@/components/ui/TripAdvisorIcon';
import {useTripAdvisorWidget} from './useTripAdvisorWidget';
import type {ScriptVariant} from './buildWidgetUrl';

type WidgetShellProps = {
  variant: ScriptVariant;
  locationId: string;
  locale: 'en' | 'vi';
  className?: string;
  eyebrow?: string;
};

export function WidgetShell(props: WidgetShellProps) {
  const {variant, locationId, locale, className, eyebrow} = props;
  const {containerId, containerRef} = useTripAdvisorWidget({
    variant,
    locationId,
    locale,
  });

  return (
    <div className={`min-h-32 ${className ?? ''}`}>
      {eyebrow && (
        <span className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.05em] text-on-surface-secondary">
          <TripAdvisorIcon className="h-4 w-auto" />
          {eyebrow}
        </span>
      )}
      <div id={containerId} ref={containerRef} />
    </div>
  );
}
