import {useContext} from 'react';
import {EditableContext, type EditableContextValue} from './context';

export function useEditable(): EditableContextValue | null {
  return useContext(EditableContext);
}
