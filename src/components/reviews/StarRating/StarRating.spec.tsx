import {render, screen, fireEvent} from '@testing-library/react';
import {StarRating} from './StarRating';

describe('StarRating', () => {
  it('renders 5 star icons total', () => {
    render(<StarRating rating={3} />);
    expect(screen.getAllByTestId('star')).toHaveLength(5);
  });

  it('marks `rating` stars as filled', () => {
    render(<StarRating rating={4} />);
    const filled = screen
      .getAllByTestId('star')
      .filter((el) => el.getAttribute('data-filled') === 'true');
    expect(filled).toHaveLength(4);
  });

  it('exposes an accessible label', () => {
    render(<StarRating rating={5} />);
    expect(screen.getByLabelText('5 out of 5 stars')).toBeInTheDocument();
  });

  it('calls onRate with the clicked star value when interactive', () => {
    const onRate = jest.fn();
    render(<StarRating rating={3} onRate={onRate} />);
    fireEvent.click(screen.getByRole('radio', {name: '4 stars'}));
    expect(onRate).toHaveBeenCalledWith(4);
  });
});
