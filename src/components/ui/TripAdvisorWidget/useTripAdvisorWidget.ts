import {useEffect, useId, useRef} from 'react';
import {WTYPE, buildWidgetUrl, type ScriptVariant} from './buildWidgetUrl';

// TripAdvisor's wejs script parses `uniq` from its own src, then mounts into
// the element with id `TA_{wtype}{uniq}`. The container id and the URL's uniq
// MUST match or nothing renders. Derive a stable numeric uniq from useId.
function toUniq(rawId: string) {
  let hash = 0;
  for (let i = 0; i < rawId.length; i++) {
    hash = (hash * 31 + rawId.charCodeAt(i)) % 1_000_000;
  }
  return String(hash);
}

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
  const uniq = toUniq(rawId);
  const containerId = `TA_${WTYPE[variant]}${uniq}`;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.replaceChildren();

    const script = document.createElement('script');
    script.src = buildWidgetUrl({variant, locationId, locale, uniq});
    script.async = true;
    script.setAttribute('data-ta-widget', containerId);
    container.appendChild(script);

    return () => {
      container.replaceChildren();
    };
  }, [variant, locationId, locale, uniq, containerId]);

  return {containerId, containerRef};
}
