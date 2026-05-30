import {render, screen, fireEvent} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {EditableProvider} from '@/components/Admin/EditableContext';
import {TourHero} from './TourHero';
import type * as VMT from '@/domain';

const messages = {
  tourDetail: {
    days: 'days',
    from: 'From',
    perPerson: 'per person',
    breadcrumbHome: 'Home',
    breadcrumbTours: 'Tours',
  },
};

const baseTour: VMT.Tour = {
  id: 't1',
  slug: 's',
  destinationId: 'd1',
  destinationName: {en: 'Mui Ne', vi: 'Mũi Né'},
  destinationHeroImage: '/img.jpg',
  title: {en: 'Title EN', vi: 'Title VI'},
  description: {en: '', vi: ''},
  imageUrl: '',
  images: [],
  duration: 2,
  distance: 100,
  transportation: 'Car',
  hotel: '',
  guided: '',
  itinerary: [],
  pricingGroups: [],
  paymentDetails: {en: '', vi: ''},
  notes: [],
  mealsInfo: {en: '', vi: ''},
  status: 'PUBLISHED',
  isFeatured: false,
  highlights: [],
  included: [],
  excluded: [],
  tripAdvisorUrl: null,
};

function renderEditable(
  onFieldChange = jest.fn(),
  extra: Partial<VMT.Tour> = {},
) {
  return {
    onFieldChange,
    ...render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <EditableProvider locale="en" onFieldChange={onFieldChange}>
          <TourHero tour={{...baseTour, ...extra}} />
        </EditableProvider>
      </NextIntlClientProvider>,
    ),
  };
}

describe('TourHero editable mode', () => {
  it('renders title as input bound to active locale', () => {
    renderEditable();
    const titleInput = screen.getByRole('textbox', {name: /title/i});
    expect(titleInput).toHaveValue('Title EN');
  });

  it('emits onFieldChange("title.<locale>", value) when title input changes', () => {
    const {onFieldChange} = renderEditable();
    const titleInput = screen.getByRole('textbox', {name: /title/i});
    fireEvent.change(titleInput, {target: {value: 'New title'}});
    expect(onFieldChange).toHaveBeenCalledWith('title.en', 'New title');
  });

  it('renders duration/distance/transportation as inputs and emits changes', () => {
    const {onFieldChange} = renderEditable();
    const duration = screen.getByRole('spinbutton', {name: /duration/i});
    fireEvent.change(duration, {target: {value: '5'}});
    expect(onFieldChange).toHaveBeenCalledWith('duration', 5);

    const distance = screen.getByRole('spinbutton', {name: /distance/i});
    fireEvent.change(distance, {target: {value: '250'}});
    expect(onFieldChange).toHaveBeenCalledWith('distance', 250);

    const transport = screen.getByRole('textbox', {name: /transportation/i});
    fireEvent.change(transport, {target: {value: 'Bike'}});
    expect(onFieldChange).toHaveBeenCalledWith('transportation', 'Bike');
  });

  it('hides the price chip in editable mode', () => {
    renderEditable(jest.fn(), {
      pricingGroups: [
        {
          label: {en: '', vi: ''},
          items: [{price: 99, label: {en: '', vi: ''}}],
        },
      ] as never,
    });
    expect(screen.queryByText(/From \$99/)).toBeNull();
  });

  it('renders destinationSlot in editable mode', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <EditableProvider locale="en" onFieldChange={jest.fn()}>
          <TourHero
            tour={baseTour}
            destinationSlot={<div data-testid="dest-slot">slot</div>}
          />
        </EditableProvider>
      </NextIntlClientProvider>,
    );
    expect(screen.getByTestId('dest-slot')).toBeInTheDocument();
  });
});
