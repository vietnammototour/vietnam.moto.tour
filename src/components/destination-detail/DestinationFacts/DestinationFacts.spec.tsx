import {render, screen} from '@testing-library/react';
import {DestinationFacts} from './DestinationFacts';

const dest = {
  id: 'd1',
  slug: 'dalat',
  name: 'Da Lat',
  imageUrl: '',
  heroImage: '',
  size: 'large' as const,
  isActive: true,
  description: {en: '', vi: ''},
  highlights: [],
  tours: [{id: 't1'} as never, {id: 't2'} as never],
};

describe('DestinationFacts', () => {
  it('renders the explore tours link when tours exist', () => {
    render(<DestinationFacts destination={dest} />);
    const exploreLink = screen
      .getAllByRole('link')
      .find((a) => a.getAttribute('href') === '/tours?destination=d1');
    expect(exploreLink).toBeDefined();
  });

  it('omits the explore tours link when no tours', () => {
    render(<DestinationFacts destination={{...dest, tours: []}} />);
    const exploreLink = screen
      .queryAllByRole('link')
      .find((a) => a.getAttribute('href') === '/tours?destination=d1');
    expect(exploreLink).toBeUndefined();
  });

  it('renders whatsapp and email contact links', () => {
    render(<DestinationFacts destination={dest} />);
    const links = screen.getAllByRole('link');
    expect(
      links.some((l) =>
        (l.getAttribute('href') ?? '').startsWith('https://wa.me'),
      ),
    ).toBe(true);
    expect(
      links.some((l) => (l.getAttribute('href') ?? '').startsWith('mailto:')),
    ).toBe(true);
  });
});
