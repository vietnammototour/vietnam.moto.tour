import {render, screen} from '@testing-library/react';
import {HighlightCard} from './HighlightCard';

const baseHighlight = {
  id: 'h1',
  destinationId: 'd1',
  titleEn: 'Waterfalls',
  titleVi: 'Thác nước',
  descriptionEn: 'Stunning cascades',
  descriptionVi: 'Thác hùng vĩ',
  imageUrl: '/img/wf.jpg',
};

describe('HighlightCard', () => {
  it('renders English title and description when locale is en', () => {
    render(<HighlightCard highlight={baseHighlight} locale="en" index={0} />);
    expect(screen.getByText('Waterfalls')).toBeInTheDocument();
    expect(screen.getByText('Stunning cascades')).toBeInTheDocument();
  });

  it('renders Vietnamese title and description when locale is vi', () => {
    render(<HighlightCard highlight={baseHighlight} locale="vi" index={0} />);
    expect(screen.getByText('Thác nước')).toBeInTheDocument();
    expect(screen.getByText('Thác hùng vĩ')).toBeInTheDocument();
  });

  it('renders image with localized title as alt', () => {
    render(<HighlightCard highlight={baseHighlight} locale="en" index={0} />);
    expect(screen.getByAltText('Waterfalls')).toBeInTheDocument();
  });

  it('renders an index label padded to two digits', () => {
    render(<HighlightCard highlight={baseHighlight} locale="en" index={4} />);
    expect(screen.getByText('05')).toBeInTheDocument();
  });

  it('omits image when imageUrl is null', () => {
    render(
      <HighlightCard
        highlight={{...baseHighlight, imageUrl: null}}
        locale="en"
        index={0}
      />,
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
