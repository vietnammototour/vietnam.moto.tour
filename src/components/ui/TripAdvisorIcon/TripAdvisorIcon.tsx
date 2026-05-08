import type {SVGProps} from 'react';

export function TripAdvisorIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 32"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        d="M4 7 Q32 -3 60 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle
        cx="16"
        cy="17"
        r="11"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      <circle cx="16" cy="17" r="3.5" />
      <circle
        cx="48"
        cy="17"
        r="11"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      <circle cx="48" cy="17" r="3.5" />
      <path d="M27 27 L32 32 L37 27 Z" />
    </svg>
  );
}
