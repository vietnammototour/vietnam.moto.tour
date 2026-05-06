'use client';

import {EditableContext} from './context';

export function EditableProvider({
  locale,
  onFieldChange,
  onRemoveItem,
  children,
}: {
  locale: 'en' | 'vi';
  onFieldChange: (path: string, value: string | number) => void;
  onRemoveItem?: (path: string) => void;
  children: React.ReactNode;
}) {
  return (
    <EditableContext.Provider
      value={{editable: true, locale, onFieldChange, onRemoveItem}}
    >
      {children}
    </EditableContext.Provider>
  );
}
