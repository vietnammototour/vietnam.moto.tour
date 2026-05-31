import {render, screen, fireEvent} from '@testing-library/react';
import {LogFilters} from './LogFilters';

it('calls onChange when the type filter changes', () => {
  const onChange = jest.fn();
  render(<LogFilters value={{}} onChange={onChange} />);
  fireEvent.change(screen.getByLabelText('Type'), {target: {value: 'ERROR'}});
  expect(onChange).toHaveBeenCalledWith({type: 'ERROR'});
});

it('calls onChange when a date is set', () => {
  const onChange = jest.fn();
  render(<LogFilters value={{}} onChange={onChange} />);
  fireEvent.change(screen.getByLabelText('From'), {
    target: {value: '2026-05-01'},
  });
  expect(onChange).toHaveBeenCalledWith({from: '2026-05-01'});
});
