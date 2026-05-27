import {useDraggable} from '@dnd-kit/core';
import {useTranslations} from 'next-intl';
import type * as VMT from '@/domain';
import {Button, type AdminLocale as Locale} from '@/components/ui';

type PerkChipProps = {
  perk: VMT.Perk;
  locale: Locale;
  zone: 'available' | 'included' | 'excluded';
  onRemove?: () => void;
};

export function PerkChip({perk, locale, zone, onRemove}: PerkChipProps) {
  const tPerks = useTranslations('admin.perks');
  const {attributes, listeners, setNodeRef, transform, isDragging} =
    useDraggable({
      id: `${zone}:${perk.id}`,
      data: {perkId: perk.id, sourceZone: zone},
    });

  const label = locale === 'vi' && perk.labelVi ? perk.labelVi : perk.labelEn;
  const style = transform
    ? {transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`}
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-pointer inline-flex items-center gap-2 px-3 py-2 border border-border rounded bg-surface-elevated ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <i className={`${perk.icon} text-base`} />
      <span className="text-sm">{label}</span>
      <span className="text-xs text-on-surface-secondary">
        ({tPerks(`category.${perk.category}`)})
      </span>
      {onRemove && (
        <Button
          variant="ghost-danger"
          size="sm"
          iconOnly
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Remove"
          className="ml-1"
        >
          <i className="fa fa-times" />
        </Button>
      )}
    </div>
  );
}
