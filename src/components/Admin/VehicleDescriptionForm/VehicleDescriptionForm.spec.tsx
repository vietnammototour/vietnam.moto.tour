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

  it('shows the active locale value when toggling back and forth', async () => {
    const user = userEvent.setup();
    render(
      <VehicleDescriptionForm
        initial={{en: 'EN-DESC', vi: 'VI-DESC'}}
        onSubmit={jest.fn()}
      />,
    );
    const ta = () =>
      screen.getByLabelText(/Description/i) as HTMLTextAreaElement;

    // Default locale is VI
    expect(ta().value).toBe('VI-DESC');

    await user.click(screen.getByRole('button', {name: /^EN$/i}));
    expect(ta().value).toBe('EN-DESC');

    // Switching back must show VI again, not the stale EN value
    await user.click(screen.getByRole('button', {name: /^VI$/i}));
    expect(ta().value).toBe('VI-DESC');

    // And forward once more
    await user.click(screen.getByRole('button', {name: /^EN$/i}));
    expect(ta().value).toBe('EN-DESC');
  });
});
