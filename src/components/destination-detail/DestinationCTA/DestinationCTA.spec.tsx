import {render, screen} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {DestinationCTA} from './DestinationCTA';

const messages = {
  destinationDetail: {
    cta: {title: 'Plan your trip', button: 'Contact us'},
  },
};

describe('DestinationCTA', () => {
  it('renders title and contact link', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <DestinationCTA />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('title')).toBeInTheDocument();
    const link = screen.getByRole('link', {name: 'button'});
    expect(link).toHaveAttribute('href', '/contact');
  });
});
