import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {VehicleDescriptionForm} from './VehicleDescriptionForm';

describe('VehicleDescriptionForm', () => {
  it('persists VI and EN values across locale toggles', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(
      <VehicleDescriptionForm initial={{en: '', vi: ''}} onSubmit={onSubmit} />,
    );

    await user.click(screen.getByRole('button', {name: /VI/i}));
    await user.type(screen.getByLabelText(/Description/i), 'Vietnamese text');

    await user.click(screen.getByRole('button', {name: /EN/i}));
    await user.type(screen.getByLabelText(/Description/i), 'English text');

    await user.click(screen.getByRole('button', {name: /Save/i}));
    expect(onSubmit).toHaveBeenCalledWith({
      en: 'English text',
      vi: 'Vietnamese text',
    });
  });
});
