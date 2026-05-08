import {render, screen} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {DestinationHighlights} from './DestinationHighlights';

const messages = {
  destinationDetail: {
    highlightsTitle: 'Highlights',
    noHighlights: 'No highlights yet',
  },
};

const h = (id: string, titleEn: string) => ({
  id,
  destinationId: 'd1',
  titleEn,
  titleVi: 'vi',
  descriptionEn: 'desc',
  descriptionVi: 'mô tả',
  imageUrl: null,
});

function wrap(ui: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('DestinationHighlights', () => {
  it('renders one HighlightCard per highlight', () => {
    render(
      wrap(
        <DestinationHighlights
          highlights={[h('1', 'Alpha'), h('2', 'Beta')]}
          locale="en"
        />,
      ),
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('renders empty state when no highlights', () => {
    render(wrap(<DestinationHighlights highlights={[]} locale="en" />));
    expect(screen.getByText('noHighlights')).toBeInTheDocument();
  });
});
