import type {ReactNode} from 'react';

export type CalloutTone = 'danger' | 'warning' | 'info' | 'neutral';

type CalloutProps = {
  title: string;
  children: ReactNode;
  tone?: CalloutTone;
  /** Overrides the default tone icon. */
  icon?: ReactNode;
  className?: string;
};

const toneBox: Record<CalloutTone, string> = {
  danger: 'border-error/40 bg-error/5',
  warning: 'border-primary/40 bg-primary/5',
  info: 'border-on-surface-accent/40 bg-on-surface-accent/5',
  neutral: 'border-border-subtle bg-surface-elevated/40',
};

const toneAccent: Record<CalloutTone, string> = {
  danger: 'text-error',
  warning: 'text-primary',
  info: 'text-on-surface-accent',
  neutral: 'text-on-surface',
};

const toneIcon: Record<CalloutTone, string> = {
  danger: 'fa-info-circle',
  warning: 'fa-exclamation-triangle',
  info: 'fa-info-circle',
  neutral: 'fa-info-circle',
};

export function Callout({
  title,
  children,
  tone = 'neutral',
  icon,
  className = '',
}: CalloutProps) {
  return (
    <div className={`border p-6 ${toneBox[tone]} ${className}`}>
      <div className={`flex items-center gap-2 mb-3 ${toneAccent[tone]}`}>
        {icon ?? (
          <i className={`fa ${toneIcon[tone]} text-sm`} aria-hidden="true" />
        )}
        <h3 className="font-mono text-xs font-medium uppercase tracking-[0.1em]">
          {title}
        </h3>
      </div>
      <div className="font-mono text-sm leading-relaxed text-on-surface-secondary">
        {children}
      </div>
    </div>
  );
}
