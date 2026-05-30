import {render, screen} from '@testing-library/react';
import {TripAdvisorWidget} from './TripAdvisorWidget';

describe('TripAdvisorWidget', () => {
  it('renders a script-backed container for the reviews variant', () => {
    const {container} = render(
      <TripAdvisorWidget variant="reviews" locationId="5501636" locale="en" />,
    );
    const script = container.querySelector('script[src*="locationId=5501636"]');
    expect(script).not.toBeNull();
  });

  it('renders a link to the listing for the cta variant', () => {
    render(
      <TripAdvisorWidget
        variant="cta"
        locationId="5501636"
        locale="en"
        href="https://www.tripadvisor.com/x"
        ctaLabel="Read reviews"
      />,
    );
    const link = screen.getByRole('link', {name: 'Read reviews'});
    expect(link).toHaveAttribute('href', 'https://www.tripadvisor.com/x');
  });
});
