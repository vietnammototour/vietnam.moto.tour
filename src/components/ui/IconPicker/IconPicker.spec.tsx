import {render, screen, fireEvent} from '@testing-library/react';
import {IconPicker} from './IconPicker';

describe('IconPicker', () => {
  it('renders the currently-selected icon class', () => {
    render(<IconPicker value="fa-solid fa-motorcycle" onChange={() => {}} />);
    const icon = screen.getByTestId('icon-picker-current');
    expect(icon.className).toContain('fa-motorcycle');
  });

  it('opens the modal on button click', () => {
    render(<IconPicker value="" onChange={() => {}} />);
    fireEvent.click(screen.getByRole('button', {name: /pick icon/i}));
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it('calls onChange and closes when an icon is picked', () => {
    const onChange = jest.fn();
    render(<IconPicker value="" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', {name: /pick icon/i}));
    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: {value: 'motorcycle'},
    });
    fireEvent.click(screen.getAllByTestId('icon-option')[0]);
    expect(onChange).toHaveBeenCalledWith('fa-solid fa-motorcycle');
  });
});
