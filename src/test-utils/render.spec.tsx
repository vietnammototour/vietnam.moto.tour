import {render, screen} from '@/test-utils/render';

function TestComponent() {
  return <div>hello</div>;
}

describe('test-utils render', () => {
  it('renders a component within providers', () => {
    render(<TestComponent />);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });
});
