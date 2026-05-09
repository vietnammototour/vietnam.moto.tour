import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {DestinationHighlights} from './DestinationHighlights';
import {api} from '@/routes';

jest.mock('@/routes', () => ({
  api: {
    destinations: {
      highlights: jest.fn(),
    },
  },
}));

const h = (id: string, titleEn: string) => ({
  id,
  destinationId: 'd1',
  titleEn,
  titleVi: 'vi',
  descriptionEn: 'desc',
  descriptionVi: 'mô tả',
  imageUrl: null,
});

const mockedApi = api as unknown as {
  destinations: {
    highlights: jest.Mock;
  };
};

describe('DestinationHighlights', () => {
  beforeEach(() => {
    mockedApi.destinations.highlights.mockReset();
  });

  it('renders one HighlightCard per highlight', () => {
    render(
      <DestinationHighlights
        slug="da-lat"
        initialHighlights={[h('1', 'Alpha'), h('2', 'Beta')]}
        total={2}
        locale="en"
      />,
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('renders the highlights count summary using total', () => {
    render(
      <DestinationHighlights
        slug="da-lat"
        initialHighlights={[h('1', 'Alpha')]}
        total={24}
        locale="en"
      />,
    );
    expect(
      screen.getByText('highlightsCount:{"count":24}'),
    ).toBeInTheDocument();
  });

  it('renders empty state when total is 0', () => {
    render(
      <DestinationHighlights
        slug="da-lat"
        initialHighlights={[]}
        total={0}
        locale="en"
      />,
    );
    expect(screen.getByText('noHighlights')).toBeInTheDocument();
  });

  it('shows Show more button labeled with next batch size', () => {
    render(
      <DestinationHighlights
        slug="da-lat"
        initialHighlights={[h('1', 'Alpha')]}
        total={10}
        locale="en"
      />,
    );
    expect(
      screen.getByText('showMoreHighlights:{"count":6}'),
    ).toBeInTheDocument();
  });

  it('hides Show more button when all highlights are loaded', () => {
    render(
      <DestinationHighlights
        slug="da-lat"
        initialHighlights={[h('1', 'Alpha'), h('2', 'Beta')]}
        total={2}
        locale="en"
      />,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('caps Show more label at remaining count', () => {
    render(
      <DestinationHighlights
        slug="da-lat"
        initialHighlights={Array.from({length: 6}, (_, i) =>
          h(String(i + 1), `T${i}`),
        )}
        total={8}
        locale="en"
      />,
    );
    expect(
      screen.getByText('showMoreHighlights:{"count":2}'),
    ).toBeInTheDocument();
  });

  it('fetches and appends next batch on click', async () => {
    mockedApi.destinations.highlights.mockResolvedValueOnce({
      data: {items: [h('2', 'Beta'), h('3', 'Gamma')], total: 3},
      error: null,
    });
    render(
      <DestinationHighlights
        slug="da-lat"
        initialHighlights={[h('1', 'Alpha')]}
        total={3}
        locale="en"
      />,
    );

    await userEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Beta')).toBeInTheDocument();
    });
    expect(screen.getByText('Gamma')).toBeInTheDocument();
    expect(mockedApi.destinations.highlights).toHaveBeenCalledWith('da-lat', {
      skip: 1,
      take: 6,
    });
  });

  it('shows error message when fetch fails', async () => {
    mockedApi.destinations.highlights.mockResolvedValueOnce({
      data: null,
      error: 'boom',
    });
    render(
      <DestinationHighlights
        slug="da-lat"
        initialHighlights={[h('1', 'Alpha')]}
        total={3}
        locale="en"
      />,
    );

    await userEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('highlightsLoadError')).toBeInTheDocument();
    });
  });
});
