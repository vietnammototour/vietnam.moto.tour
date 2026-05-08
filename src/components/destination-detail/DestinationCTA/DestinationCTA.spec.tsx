import {render, screen} from '@testing-library/react';
import {DestinationCTA} from './DestinationCTA';

describe('DestinationCTA', () => {
  it('renders title, subtitle and contact link', () => {
    render(<DestinationCTA />);
    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('subtitle')).toBeInTheDocument();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/contact');
  });
});
