import {useTranslations} from 'next-intl';
import type {PricingGroup} from '@/types';
import {useEditable} from '@/components/admin/EditableContext';

type VehiclePricingProps = {
  groups: PricingGroup[];
  locale: 'en' | 'vi';
  selectedIndex: {groupIdx: number; tierIdx: number};
  onSelect: (groupIdx: number, tierIdx: number) => void;
  pathPrefix?: string;
};

function EditableInline({
  value,
  path,
  className,
  type = 'text',
}: {
  value: string | number;
  path: string;
  className?: string;
  type?: 'text' | 'number';
}) {
  const ctx = useEditable();
  if (!ctx || !ctx.editable) {
    return (
      <span className={className}>
        {type === 'number' ? `$${value}` : value}
      </span>
    );
  }

  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    const raw = e.currentTarget.textContent ?? '';
    const newValue =
      type === 'number' ? Number(raw.replace(/[^0-9.]/g, '')) : raw;
    if (newValue !== value) {
      ctx.onFieldChange(path, newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const display = String(value);

  return (
    <span
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`${className ?? ''} outline-none border border-dashed border-transparent hover:border-primary/40 focus:border-primary rounded px-0.5 cursor-text`}
    >
      {display}
    </span>
  );
}

export function VehiclePricing({
  groups,
  locale,
  selectedIndex,
  onSelect,
  pathPrefix = '',
}: VehiclePricingProps) {
  const t = useTranslations('tourDetail');
  const ctx = useEditable();
  const activeLocale = ctx?.locale ?? locale;

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group, gIdx) => (
        <div key={gIdx}>
          <div className="flex items-center gap-2 mb-3">
            {group.icon && (
              <i className={`fas fa-${group.icon} text-primary`} />
            )}
            <h4 className="type-title-sm text-on-surface font-semibold">
              <EditableInline
                value={group.label[activeLocale]}
                path={`${pathPrefix}${gIdx}.label.${activeLocale}`}
              />
            </h4>
          </div>
          <div
            role="radiogroup"
            aria-label={group.label[activeLocale]}
            className="flex flex-col rounded-lg border border-border-subtle overflow-hidden"
          >
            {group.tiers.map((tier, tIdx) => {
              const isSelected =
                selectedIndex.groupIdx === gIdx &&
                selectedIndex.tierIdx === tIdx;
              return (
                <button
                  key={tIdx}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onSelect(gIdx, tIdx)}
                  className={`flex items-start gap-3 p-3 text-left transition-colors border-b border-border-subtle last:border-b-0 cursor-pointer ${
                    isSelected
                      ? 'bg-primary/10 border-l-2 border-l-primary'
                      : 'hover:bg-surface-elevated'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      isSelected
                        ? 'border-primary'
                        : 'border-on-surface-secondary'
                    }`}
                  >
                    {isSelected && (
                      <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <EditableInline
                        value={tier.label[activeLocale]}
                        path={`${pathPrefix}${gIdx}.tiers.${tIdx}.label.${activeLocale}`}
                        className="type-body-sm text-on-surface font-medium"
                      />
                      <span className="type-title-sm text-on-surface font-semibold ml-2 shrink-0">
                        <EditableInline
                          value={tier.price}
                          path={`${pathPrefix}${gIdx}.tiers.${tIdx}.price`}
                          type="number"
                        />
                        <span className="type-label-sm text-on-surface-secondary font-normal">
                          {t('pricingPerPerson')}
                        </span>
                      </span>
                    </div>
                    {tier.description && (
                      <p className="type-label-sm text-on-surface-secondary mt-0.5">
                        <EditableInline
                          value={tier.description[activeLocale]}
                          path={`${pathPrefix}${gIdx}.tiers.${tIdx}.description.${activeLocale}`}
                        />
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
