import {useEffect, useId, useRef} from 'react';
import {buildWidgetUrl, type ScriptVariant} from './buildWidgetUrl';

// CSP allowlist (no CSP today). If a Content-Security-Policy is ever added,
// script-src/connect-src/frame-src must include:
//   https://www.jscache.com https://static.tacdn.com https://www.tripadvisor.com
export function useTripAdvisorWidget(args: {
  variant: ScriptVariant;
  locationId: string;
  locale: 'en' | 'vi';
}) {
  const {variant, locationId, locale} = args;
  const rawId = useId();
  const containerId = `ta-widget-${rawId.replace(/[:]/g, '')}`;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.replaceChildren();

    const script = document.createElement('script');
    script.src = buildWidgetUrl({variant, locationId, locale});
    script.async = true;
    script.setAttribute('data-ta-widget', containerId);
    container.appendChild(script);

    return () => {
      container.replaceChildren();
    };
  }, [variant, locationId, locale, containerId]);

  return {containerId, containerRef};
}
