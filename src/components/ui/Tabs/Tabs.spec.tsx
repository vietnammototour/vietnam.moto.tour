// src/components/ui/Tabs/Tabs.spec.tsx
import {render, screen} from '@/test-utils/render';
import userEvent from '@testing-library/user-event';
import {Tabs, TabPanel} from './Tabs';

const items = [
  {key: 'general', label: 'General'},
  {key: 'pricing', label: 'Pricing'},
  {key: 'itinerary', label: 'Itinerary', disabled: true},
];

describe('Tabs', () => {
  it('renders all tab items', () => {
    render(
      <Tabs items={items} activeKey="general" onChange={() => {}}>
        <TabPanel tabKey="general">General Content</TabPanel>
        <TabPanel tabKey="pricing">Pricing Content</TabPanel>
      </Tabs>,
    );
    expect(screen.getByRole('tab', {name: 'General'})).toBeInTheDocument();
    expect(screen.getByRole('tab', {name: 'Pricing'})).toBeInTheDocument();
    expect(screen.getByRole('tab', {name: 'Itinerary'})).toBeInTheDocument();
  });

  it('marks active tab with aria-selected', () => {
    render(
      <Tabs items={items} activeKey="general" onChange={() => {}}>
        <TabPanel tabKey="general">General Content</TabPanel>
      </Tabs>,
    );
    expect(screen.getByRole('tab', {name: 'General'})).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', {name: 'Pricing'})).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('renders only active panel content', () => {
    render(
      <Tabs items={items} activeKey="general" onChange={() => {}}>
        <TabPanel tabKey="general">General Content</TabPanel>
        <TabPanel tabKey="pricing">Pricing Content</TabPanel>
      </Tabs>,
    );
    expect(screen.getByText('General Content')).toBeInTheDocument();
    expect(screen.queryByText('Pricing Content')).not.toBeInTheDocument();
  });

  it('calls onChange when non-disabled tab is clicked', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <Tabs items={items} activeKey="general" onChange={onChange}>
        <TabPanel tabKey="general">Content</TabPanel>
      </Tabs>,
    );
    await user.click(screen.getByRole('tab', {name: 'Pricing'}));
    expect(onChange).toHaveBeenCalledWith('pricing');
  });

  it('does not call onChange when disabled tab is clicked', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <Tabs items={items} activeKey="general" onChange={onChange}>
        <TabPanel tabKey="general">Content</TabPanel>
      </Tabs>,
    );
    await user.click(screen.getByRole('tab', {name: 'Itinerary'}));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders tablist role on tab container', () => {
    render(
      <Tabs items={items} activeKey="general" onChange={() => {}}>
        <TabPanel tabKey="general">Content</TabPanel>
      </Tabs>,
    );
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });
});
