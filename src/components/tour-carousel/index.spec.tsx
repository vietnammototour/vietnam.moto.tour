import {render, screen} from '@/test-utils/render';
import {TourCarousel} from './index';
import {buildTour} from '@/test-utils/factories';

describe('TourCarousel', () => {
  const tours = [
    buildTour({id: 1, title: 'Tour One'}),
    buildTour({id: 2, title: 'Tour Two'}),
    buildTour({id: 3, title: 'Tour Three'}),
  ];

  it('renders a Swiper container', () => {
    render(<TourCarousel tours={tours} />);
    expect(screen.getByTestId('swiper')).toBeInTheDocument();
  });

  it('renders a SwiperSlide per tour', () => {
    render(<TourCarousel tours={tours} />);
    const slides = screen.getAllByTestId('swiper-slide');
    expect(slides).toHaveLength(3);
  });

  it('renders all tour titles', () => {
    render(<TourCarousel tours={tours} />);
    expect(screen.getByText('Tour One')).toBeInTheDocument();
    expect(screen.getByText('Tour Two')).toBeInTheDocument();
    expect(screen.getByText('Tour Three')).toBeInTheDocument();
  });
});
