import {render, screen} from '@testing-library/react';
import {DestinationIntro} from './DestinationIntro';

const dest = {
  id: 'd1',
  slug: 'dalat',
  name: 'Da Lat',
  imageUrl: '',
  heroImage: '',
  size: 'large' as const,
  isActive: true,
  description: {en: 'Mountain city in Vietnam.', vi: 'Thành phố ngàn hoa.'},
  highlights: [],
  highlightsTotal: 0,
  tours: [],
};

describe('DestinationIntro', () => {
  it('renders the localized description', () => {
    render(<DestinationIntro destination={dest} locale="en" />);
    expect(screen.getByText('Mountain city in Vietnam.')).toBeInTheDocument();
  });

  it('renders the about title key', () => {
    render(<DestinationIntro destination={dest} locale="en" />);
    expect(
      screen.getByText('aboutTitle:{"name":"Da Lat"}'),
    ).toBeInTheDocument();
  });

  it('renders nothing when description is empty', () => {
    const {container} = render(
      <DestinationIntro
        destination={{...dest, description: {en: '', vi: ''}}}
        locale="en"
      />,
    );
    expect(container.firstChild).toBeNull();
  });
});
