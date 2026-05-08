import {render, screen} from '@testing-library/react';
import {DestinationHighlights} from './DestinationHighlights';

const h = (id: string, titleEn: string) => ({
  id,
  destinationId: 'd1',
  titleEn,
  titleVi: 'vi',
  descriptionEn: 'desc',
  descriptionVi: 'mô tả',
  imageUrl: null,
});

describe('DestinationHighlights', () => {
  it('renders one HighlightCard per highlight', () => {
    render(
      <DestinationHighlights
        highlights={[h('1', 'Alpha'), h('2', 'Beta')]}
        locale="en"
      />,
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('renders the highlights count summary', () => {
    render(
      <DestinationHighlights
        highlights={[h('1', 'Alpha'), h('2', 'Beta')]}
        locale="en"
      />,
    );
    expect(screen.getByText('highlightsCount:{"count":2}')).toBeInTheDocument();
  });

  it('renders empty state when no highlights', () => {
    render(<DestinationHighlights highlights={[]} locale="en" />);
    expect(screen.getByText('noHighlights')).toBeInTheDocument();
  });
});
