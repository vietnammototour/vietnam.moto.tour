import {render, screen} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {CardTab} from './CardTab';
import {savedSlot} from '@/lib/image-slot';

const messages = {tourCard: {}};

function renderTab(props: Partial<React.ComponentProps<typeof CardTab>> = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CardTab
        tourId="t1"
        locale="en"
        initialData={{imageCard: savedSlot('/img.webp')}}
        previewTour={{
          id: 't1',
          slug: 'mui-ne',
          destinationId: 'd1',
          destinationName: {en: 'Mui Ne', vi: 'Mui Ne'},
          destinationHeroImage: '',
          title: {en: 'Mui Ne', vi: 'Mui Ne'},
          description: {en: '', vi: ''},
          imageUrl: '/img.webp',
          images: [],
          duration: 1,
          distance: 0,
          transportation: '',
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
        }}
        {...props}
      />
    </NextIntlClientProvider>,
  );
}

describe('CardTab', () => {
  it('renders an image upload control and the live TourCard preview title', () => {
    renderTab();
    expect(screen.getByText(/card image/i)).toBeInTheDocument();
    expect(screen.getAllByText('Mui Ne').length).toBeGreaterThan(0);
  });

  it('disables Save when there are no pending changes', () => {
    renderTab();
    expect(screen.getByRole('button', {name: /save card/i})).toBeDisabled();
  });
});
