import {render, screen, fireEvent} from '@testing-library/react';
import {AdminBreadcrumbs} from './AdminBreadcrumbs';

describe('AdminBreadcrumbs editable last segment', () => {
  it('renders label by default with pencil button', () => {
    const onCommit = jest.fn();
    render(
      <AdminBreadcrumbs
        items={[
          {label: 'Admin', href: '/admin'},
          {label: 'Tours', href: '/admin/tours'},
          {label: 'mui-ne-full-day', editable: {fieldLabel: 'Slug', onCommit}},
        ]}
      />,
    );
    expect(screen.getByText('mui-ne-full-day')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {name: /edit slug/i}),
    ).toBeInTheDocument();
  });

  it('switches to input on pencil click and commits on Enter', () => {
    const onCommit = jest.fn();
    render(
      <AdminBreadcrumbs
        items={[
          {label: 'mui-ne-full-day', editable: {fieldLabel: 'Slug', onCommit}},
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('button', {name: /edit slug/i}));
    const input = screen.getByRole('textbox', {name: /slug/i});
    fireEvent.change(input, {target: {value: 'mui-ne-half-day'}});
    fireEvent.keyDown(input, {key: 'Enter'});
    expect(onCommit).toHaveBeenCalledWith('mui-ne-half-day');
  });

  it('cancels on Escape without calling onCommit', () => {
    const onCommit = jest.fn();
    render(
      <AdminBreadcrumbs
        items={[{label: 'orig', editable: {fieldLabel: 'Slug', onCommit}}]}
      />,
    );
    fireEvent.click(screen.getByRole('button', {name: /edit slug/i}));
    const input = screen.getByRole('textbox', {name: /slug/i});
    fireEvent.change(input, {target: {value: 'changed'}});
    fireEvent.keyDown(input, {key: 'Escape'});
    expect(onCommit).not.toHaveBeenCalled();
    expect(screen.getByText('orig')).toBeInTheDocument();
  });
});
