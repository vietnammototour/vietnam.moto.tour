import type {FocusEvent, KeyboardEvent} from 'react';
import {useEditable} from './useEditable';

type EditableTextTag = 'span' | 'p' | 'h3' | 'div';

type EditableTextProps = {
  value: string;
  path: string;
  className?: string;
  tag?: EditableTextTag;
  multiline?: boolean;
  placeholder?: string;
};

/**
 * Renders `value` as static text by default. Inside an `EditableProvider`
 * (admin), it becomes an inline `contentEditable` field that commits via
 * `onFieldChange(path, value)` on blur. Single-line by default (Enter blurs);
 * pass `multiline` for paragraph fields.
 */
export function EditableText({
  value,
  path,
  className,
  tag: Tag = 'span',
  multiline = false,
  placeholder,
}: EditableTextProps) {
  const ctx = useEditable();

  if (!ctx || !ctx.editable) {
    return <Tag className={className}>{value}</Tag>;
  }

  const handleBlur = (e: FocusEvent<HTMLElement>) => {
    const next = e.currentTarget.textContent ?? '';
    if (next !== value) {
      ctx.onFieldChange(path, next);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      data-placeholder={placeholder}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`${className ?? ''} cursor-text outline-none border-b border-dashed border-outline/60 hover:border-primary focus:border-primary empty:before:content-[attr(data-placeholder)] empty:before:text-on-surface-tertiary`}
    >
      {value}
    </Tag>
  );
}
