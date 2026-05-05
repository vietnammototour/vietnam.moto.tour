'use client';

import {createContext, useContext} from 'react';

interface EditableContextValue {
  editable: boolean;
  locale: 'en' | 'vi';
  onFieldChange: (path: string, value: string | number) => void;
}

const EditableContext = createContext<EditableContextValue | null>(null);

export function EditableProvider({
  locale,
  onFieldChange,
  children,
}: {
  locale: 'en' | 'vi';
  onFieldChange: (path: string, value: string | number) => void;
  children: React.ReactNode;
}) {
  return (
    <EditableContext.Provider value={{editable: true, locale, onFieldChange}}>
      {children}
    </EditableContext.Provider>
  );
}

export function useEditable(): EditableContextValue | null {
  return useContext(EditableContext);
}
