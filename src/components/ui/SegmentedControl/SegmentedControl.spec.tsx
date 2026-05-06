import {render, screen} from '@/test-utils/render';
import userEvent from '@testing-library/user-event';
import {SegmentedControl} from './SegmentedControl';

const options = [
  {value: 'en', label: 'EN'},
  {value: 'vi', label: 'VI'},
];

describe('SegmentedControl', () => {
  it('renders all options as radio buttons', () => {
    render(
      <SegmentedControl options={options} value="en" onChange={() => {}} />,
    );
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  it('marks selected option as checked', () => {
    render(
      <SegmentedControl options={options} value="vi" onChange={() => {}} />,
    );
    expect(screen.getByRole('radio', {name: 'VI'})).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('radio', {name: 'EN'})).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('calls onChange with the clicked option value', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <SegmentedControl options={options} value="en" onChange={onChange} />,
    );
    await user.click(screen.getByRole('radio', {name: 'VI'}));
    expect(onChange).toHaveBeenCalledWith('vi');
  });

  it('renders with radiogroup role', () => {
    render(
      <SegmentedControl options={options} value="en" onChange={() => {}} />,
    );
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });

  it('supports disabled state', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <SegmentedControl
        options={options}
        value="en"
        onChange={onChange}
        disabled
      />,
    );
    await user.click(screen.getByRole('radio', {name: 'VI'}));
    expect(onChange).not.toHaveBeenCalled();
  });
});
