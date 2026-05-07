import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {PerksTab} from './PerksTab';

jest.mock('@/routes', () => ({
  api: {
    admin: {
      perks: {
        list: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'p1',
              labelEn: 'Bike',
              labelVi: 'Xe',
              icon: 'fa-solid fa-motorcycle',
              category: 'TRANSPORT',
              archived: false,
              updatedAt: new Date(),
            },
            {
              id: 'p2',
              labelEn: 'Lunch',
              labelVi: 'Bữa trưa',
              icon: 'fa-solid fa-utensils',
              category: 'FOOD',
              archived: false,
              updatedAt: new Date(),
            },
          ],
          error: null,
        }),
      },
    },
  },
}));

describe('PerksTab', () => {
  it('renders Available, Included and Excluded zones', async () => {
    render(
      <PerksTab
        tourId="t1"
        initialIncludedIds={[]}
        initialExcludedIds={[]}
        locale="en"
        onSave={async () => {}}
      />,
    );
    await waitFor(() => expect(screen.getByText('Bike')).toBeInTheDocument());
    expect(screen.getByText('available')).toBeInTheDocument();
    expect(screen.getByText('included')).toBeInTheDocument();
    expect(screen.getByText('excluded')).toBeInTheDocument();
  });

  it('does not show already-assigned perk in Available', async () => {
    render(
      <PerksTab
        tourId="t1"
        initialIncludedIds={['p1']}
        initialExcludedIds={[]}
        locale="en"
        onSave={async () => {}}
      />,
    );
    await waitFor(() => expect(screen.getByText('Bike')).toBeInTheDocument());
    expect(screen.getAllByText('Bike').length).toBe(1);
  });

  it('Save button is disabled until dirty', async () => {
    render(
      <PerksTab
        tourId="t1"
        initialIncludedIds={[]}
        initialExcludedIds={[]}
        locale="en"
        onSave={async () => {}}
      />,
    );
    await waitFor(() => expect(screen.getByText('Bike')).toBeInTheDocument());
    expect(screen.getByRole('button', {name: 'save'})).toBeDisabled();
  });

  it('calls onSave with selected ids', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    render(
      <PerksTab
        tourId="t1"
        initialIncludedIds={['p1']}
        initialExcludedIds={['p2']}
        locale="en"
        onSave={onSave}
      />,
    );
    await waitFor(() =>
      expect(screen.getAllByText(/Bike|Lunch/).length).toBeGreaterThan(0),
    );
    const removeButtons = screen.getAllByRole('button', {name: /remove/i});
    fireEvent.click(removeButtons[0]);
    fireEvent.click(screen.getByRole('button', {name: 'save'}));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          includedPerkIds: expect.any(Array),
          excludedPerkIds: expect.any(Array),
        }),
      ),
    );
  });
});
