'use client';

import {createContext, useContext} from 'react';

type EditableContextValue = {
  editable: boolean;
  locale: 'en' | 'vi';
  onFieldChange: (path: string, value: string | number) => void;
  onRemoveItem?: (path: string) => void;
};

const EditableContext = createContext<EditableContextValue | null>(null);

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

export function useEditable(): EditableContextValue | null {
  return useContext(EditableContext);
}
