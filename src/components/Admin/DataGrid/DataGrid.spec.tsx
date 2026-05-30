import {render, screen, fireEvent} from '@testing-library/react';
import {DataGrid} from './DataGrid';
import type {GridColumn} from './DataGrid.types';

type Row = {id: string; name: string; cc: number};

const columns: GridColumn<Row>[] = [
  {key: 'name', header: 'Vehicle', track: 'minmax(0,1fr)'},
  {key: 'cc', header: 'CC', track: '80px', render: (r) => `${r.cc}cc`},
];

describe('DataGrid', () => {
  it('renders column headers', () => {
    render(<DataGrid columns={columns} items={[]} rowKey={(r) => r.id} />);
    expect(screen.getByText('Vehicle')).toBeInTheDocument();
    expect(screen.getByText('CC')).toBeInTheDocument();
  });

  it('renders one row per item using custom render', () => {
    render(<DataGrid columns={columns} items={[{id: '1', name: 'Enduro', cc: 150}]} rowKey={(r) => r.id} />);
    expect(screen.getByText('Enduro')).toBeInTheDocument();
    expect(screen.getByText('150cc')).toBeInTheDocument();
  });

  it('renders section bands with label and count', () => {
    render(
      <DataGrid
        columns={columns}
        sections={[
          {id: 'b', label: 'Bikes', count: 1, items: [{id: '1', name: 'Enduro', cc: 150}]},
          {id: 's', label: 'Scooters', count: 1, items: [{id: '2', name: 'Airblade', cc: 125}]},
        ]}
        rowKey={(r) => r.id}
      />,
    );
    expect(screen.getByText('Bikes')).toBeInTheDocument();
    expect(screen.getByText('Scooters')).toBeInTheDocument();
    expect(screen.getByText('Enduro')).toBeInTheDocument();
    expect(screen.getByText('Airblade')).toBeInTheDocument();
  });

  it('calls onRowClick with the row', () => {
    const onRowClick = jest.fn();
    render(<DataGrid columns={columns} items={[{id: '1', name: 'Enduro', cc: 150}]} rowKey={(r) => r.id} onRowClick={onRowClick} />);
    fireEvent.click(screen.getByText('Enduro'));
    expect(onRowClick).toHaveBeenCalledWith({id: '1', name: 'Enduro', cc: 150});
  });

  it('renders the empty state when there are no items', () => {
    render(<DataGrid columns={columns} items={[]} rowKey={(r) => r.id} emptyState={<span>Nothing here</span>} />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });
});
