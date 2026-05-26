import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {VehicleGeneralForm} from './VehicleGeneralForm';

describe('VehicleGeneralForm', () => {
  it('renders required fields', () => {
    render(<VehicleGeneralForm initial={null} onSubmit={() => {}} />);
    expect(screen.getByLabelText(/Brand/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Model/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Engine/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Quantity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Price/i)).toBeInTheDocument();
  });

  it('rejects cc <= 0 via validation error', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<VehicleGeneralForm initial={null} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText(/Brand/i), 'Honda');
    await user.type(screen.getByLabelText(/Model/i), 'X');
    await user.clear(screen.getByLabelText(/Engine/i));
    await user.type(screen.getByLabelText(/Engine/i), '0');
    await user.click(screen.getByRole('button', {name: /Save/i}));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/Engine .* > 0/i)).toBeInTheDocument();
  });
});
