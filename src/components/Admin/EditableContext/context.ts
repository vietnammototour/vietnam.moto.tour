import {createContext} from 'react';

export type EditableContextValue = {
  editable: boolean;
  locale: 'en' | 'vi';
  onFieldChange: (path: string, value: string | number) => void;
  onRemoveItem?: (path: string) => void;
};

export const EditableContext = createContext<EditableContextValue | null>(null);
