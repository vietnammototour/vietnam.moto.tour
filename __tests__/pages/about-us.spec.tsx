import {render, screen} from '@/test-utils/render';
import AboutUs, {getStaticProps} from '@/pages/about-us';
import type {TeamMember} from '@/domain';

jest.mock('@/data/queries', () => ({
  getMessagesFromDb: jest.fn().mockResolvedValue(null),
  getTeamForPublic: jest.fn().mockResolvedValue([]),
}));

const team: TeamMember[] = [];

describe('AboutUs page', () => {
  it('renders meta title translation key', () => {
    render(<AboutUs team={team} locale="en" />);
    expect(document.title).toBe('title');
  });

  it('renders meta description', () => {
    render(<AboutUs team={team} locale="en" />);
    const meta = document.querySelector('meta[name="description"]');
    expect(meta?.getAttribute('content')).toBe('description');
  });

  it('renders the team empty-state when team is empty', () => {
    render(<AboutUs team={team} locale="en" />);
    expect(screen.getByTestId('team-empty')).toBeInTheDocument();
  });
});

describe('AboutUs getStaticProps', () => {
  it('returns messages, team, and locale for vi locale', async () => {
    const result = await getStaticProps({locale: 'vi'} as never);
    expect(result).toHaveProperty('props.messages');
    expect(result).toHaveProperty('props.team');
    expect((result as {props: {locale: string}}).props.locale).toBe('vi');
  });

  it('defaults to vi locale when undefined', async () => {
    const result = await getStaticProps({} as never);
    expect((result as {props: {locale: string}}).props.locale).toBe('vi');
  });
});
