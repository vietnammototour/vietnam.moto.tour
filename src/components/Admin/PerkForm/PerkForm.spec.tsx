import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {PerkForm} from './PerkForm';

describe('PerkForm', () => {
  it('renders all fields with initial values', () => {
    render(
      <PerkForm
        mode="edit"
        initialData={{
          labelEn: 'Bike Hire',
          labelVi: 'Thuê xe',
          icon: 'fa-solid fa-motorcycle',
          category: 'TRANSPORT',
          archived: false,
        }}
        onSubmit={async () => {}}
      />,
    );
    expect(screen.getByLabelText(/form\.labelEn/i)).toHaveValue('Bike Hire');
    expect(screen.getByLabelText(/form\.labelVi/i)).toHaveValue('Thuê xe');
    expect(screen.getByLabelText(/form\.category/i)).toHaveValue('TRANSPORT');
  });

  it('shows validation error when labelEn empty', async () => {
    render(<PerkForm mode="create" onSubmit={async () => {}} />);
    fireEvent.click(screen.getByRole('button', {name: /save/i}));
    await waitFor(() =>
      expect(screen.getByText(/label \(en\) is required/i)).toBeInTheDocument(),
    );
  });

  it('calls onSubmit with values when valid', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<PerkForm mode="create" onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText(/form\.labelEn/i), {
      target: {value: 'Bike'},
    });
    fireEvent.change(screen.getByLabelText(/form\.labelVi/i), {
      target: {value: 'Xe'},
    });
    fireEvent.change(screen.getByLabelText(/form\.category/i), {
      target: {value: 'TRANSPORT'},
    });
    fireEvent.click(screen.getByRole('button', {name: /save/i}));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          labelEn: 'Bike',
          labelVi: 'Xe',
          category: 'TRANSPORT',
        }),
      ),
    );
  });
});
