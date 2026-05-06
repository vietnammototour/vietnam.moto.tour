import {render, screen} from '@/test-utils/render';
import {TourCarousel} from './TourCarousel';
import {buildTour} from '@/test-utils/factories';

describe('TourCarousel', () => {
  const tours = [
    buildTour({id: 'tour-1', title: {en: 'Tour One', vi: 'Tour One'}}),
    buildTour({id: 'tour-2', title: {en: 'Tour Two', vi: 'Tour Two'}}),
    buildTour({id: 'tour-3', title: {en: 'Tour Three', vi: 'Tour Three'}}),
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
