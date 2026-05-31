import {render, screen, waitFor, fireEvent} from '@testing-library/react';
import LogsPage from '@/pages/admin/logs';
import {api} from '@/routes';

jest.mock('@/routes', () => ({
  api: {admin: {logs: {list: jest.fn()}}},
  routes: {admin: {logs: {list: {path: () => '/admin/logs'}}}},
}));

jest.mock('@/components/Admin/AdminPageShell', () => ({
  AdminPageShell: ({children}: {children: React.ReactNode}) => <div>{children}</div>,
  AdminPageHeader: () => <div />,
}));

const row = {
  id: 'l1',
  createdAt: '2026-05-31T10:00:00.000Z',
  type: 'ERROR',
  level: 'ERROR',
  message: 'boom',
  userId: null,
  userEmail: null,
  method: 'GET',
  path: '/api/admin/tours',
  statusCode: 500,
  resource: 'tours',
  resourceId: null,
  durationMs: 5,
  ip: null,
  meta: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  (api.admin.logs.list as jest.Mock).mockResolvedValue({
    data: {rows: [row], total: 1},
    error: null,
  });
});

it('loads and renders log rows', async () => {
  render(<LogsPage />);
  await waitFor(() => expect(screen.getByText('boom')).toBeInTheDocument());
});

it('refetches when a filter changes', async () => {
  render(<LogsPage />);
  await waitFor(() => expect(api.admin.logs.list).toHaveBeenCalledTimes(1));
  fireEvent.change(screen.getByLabelText('Type'), {target: {value: 'AUDIT'}});
  await waitFor(() =>
    expect(api.admin.logs.list).toHaveBeenCalledWith(
      expect.objectContaining({type: 'AUDIT'}),
    ),
  );
});
