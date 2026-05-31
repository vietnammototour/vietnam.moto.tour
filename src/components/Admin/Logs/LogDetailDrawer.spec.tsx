import {render, screen} from '@testing-library/react';
import {LogDetailDrawer} from './LogDetailDrawer';
import type {LogEntryDTO} from '@/domain/log/types';

const entry: LogEntryDTO = {
  id: 'l1',
  createdAt: '2026-05-31T10:00:00.000Z',
  type: 'ERROR',
  level: 'ERROR',
  message: 'boom',
  userId: 'u1',
  userEmail: 'a@b.com',
  method: 'GET',
  path: '/api/admin/tours',
  statusCode: 500,
  resource: 'tours',
  resourceId: null,
  durationMs: 5,
  ip: '1.2.3.4',
  meta: {stack: 'Error: boom\n  at x'},
};

it('renders the entry message and meta when open', () => {
  render(<LogDetailDrawer entry={entry} open onClose={() => {}} />);
  expect(screen.getByText('boom')).toBeInTheDocument();
  expect(screen.getByText(/Error: boom/)).toBeInTheDocument();
});

it('renders nothing when entry is null', () => {
  const {container} = render(
    <LogDetailDrawer entry={null} open={false} onClose={() => {}} />,
  );
  expect(container).toBeEmptyDOMElement();
});
