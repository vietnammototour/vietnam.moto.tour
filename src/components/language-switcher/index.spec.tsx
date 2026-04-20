import {render, screen} from '@/test-utils/render';
import userEvent from '@testing-library/user-event';
import {LanguageSwitcher} from './index';
import {useRouter} from 'next/router';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

describe('LanguageSwitcher', () => {
  const push = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      locale: 'vi',
      asPath: '/tours',
      push,
    });
  });

  it('renders VI and EN buttons', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByText('VI')).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('renders separator between buttons', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByText('|')).toBeInTheDocument();
  });

  it('calls router.push with en locale when EN is clicked', async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);
    await user.click(screen.getByText('EN'));
    expect(push).toHaveBeenCalledWith('/tours', '/tours', {locale: 'en'});
  });

  it('calls router.push with vi locale when VI is clicked', async () => {
    (useRouter as jest.Mock).mockReturnValue({
      locale: 'en',
      asPath: '/',
      push,
    });
    const user = userEvent.setup();
    render(<LanguageSwitcher />);
    await user.click(screen.getByText('VI'));
    expect(push).toHaveBeenCalledWith('/', '/', {locale: 'vi'});
  });
});
