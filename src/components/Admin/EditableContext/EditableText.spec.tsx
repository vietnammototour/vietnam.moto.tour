import {render, screen, fireEvent} from '@testing-library/react';
import {EditableProvider} from './EditableContext';
import {EditableText} from './EditableText';

describe('EditableText', () => {
  it('renders static text when outside an EditableProvider', () => {
    render(<EditableText value="Hello" path="title" />);
    const node = screen.getByText('Hello');
    expect(node).toBeInTheDocument();
    expect(node).not.toHaveAttribute('contenteditable');
  });

  it('becomes editable and commits on blur when inside a provider', () => {
    const onFieldChange = jest.fn();
    render(
      <EditableProvider locale="en" onFieldChange={onFieldChange}>
        <EditableText value="Hello" path="title" />
      </EditableProvider>,
    );
    const box = screen.getByRole('textbox');
    expect(box).toHaveAttribute('contenteditable', 'true');
    box.textContent = 'Goodbye';
    fireEvent.blur(box);
    expect(onFieldChange).toHaveBeenCalledWith('title', 'Goodbye');
  });

  it('does not fire onFieldChange when the value is unchanged', () => {
    const onFieldChange = jest.fn();
    render(
      <EditableProvider locale="en" onFieldChange={onFieldChange}>
        <EditableText value="Hello" path="title" />
      </EditableProvider>,
    );
    fireEvent.blur(screen.getByRole('textbox'));
    expect(onFieldChange).not.toHaveBeenCalled();
  });
});
