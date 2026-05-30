import {render, screen} from '@testing-library/react';
import {ReviewerAvatar} from './ReviewerAvatar';

describe('ReviewerAvatar', () => {
  it('shows initials when there is no avatar', () => {
    render(<ReviewerAvatar name="Jane Doe" avatarUrl={null} />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders an image with the name as alt when an avatar is provided', () => {
    render(
      <ReviewerAvatar name="Jane Doe" avatarUrl="https://media.ta/avatar.jpg" />,
    );
    expect(screen.getByAltText('Jane Doe')).toBeInTheDocument();
  });
});
