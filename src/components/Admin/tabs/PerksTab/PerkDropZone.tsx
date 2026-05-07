import type {ReactNode} from 'react';
import {useDroppable} from '@dnd-kit/core';

type PerkDropZoneProps = {
  id: 'available' | 'included' | 'excluded';
  title: string;
  children: ReactNode;
};

export function PerkDropZone({id, title, children}: PerkDropZoneProps) {
  const {isOver, setNodeRef} = useDroppable({id});

  return (
    <div
      ref={setNodeRef}
      className={`p-4 border-2 rounded min-h-32 ${
        isOver ? 'border-primary bg-primary-container' : 'border-border'
      }`}
    >
      <h3 className="type-title-sm mb-3">{title}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
