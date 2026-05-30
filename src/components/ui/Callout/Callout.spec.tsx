import {render, screen} from '@testing-library/react';
import {Callout} from './Callout';

describe('Callout', () => {
  it('renders the title and body content', () => {
    render(<Callout title="Payment">30% deposit required.</Callout>);
    expect(screen.getByText('Payment')).toBeInTheDocument();
    expect(screen.getByText('30% deposit required.')).toBeInTheDocument();
  });

  it('renders a default icon when none is provided', () => {
    const {container} = render(<Callout title="Notice">Body</Callout>);
    expect(container.querySelector('i.fa')).toBeInTheDocument();
  });

  it('renders a custom icon when provided', () => {
    render(
      <Callout title="Notice" icon={<span data-testid="custom-icon" />}>
        Body
      </Callout>,
    );
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });
});
