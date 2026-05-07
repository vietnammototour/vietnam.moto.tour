import {render, screen} from '@/test-utils/render';
import type * as VMT from '@/domain';
import {TourIncluded} from './TourIncluded';

function makePerk(overrides: Partial<VMT.Perk> = {}): VMT.Perk {
  return {
    id: 'perk-1',
    labelEn: 'Hotel',
    labelVi: 'Khách sạn',
    icon: 'fa fa-bed',
    category: 'ACCOMMODATION',
    archived: false,
    ...overrides,
  };
}

describe('TourIncluded', () => {
  it('renders included perks with English labels when locale is en', () => {
    const included = [
      makePerk({id: 'p1', labelEn: 'Hotel', labelVi: 'Khách sạn'}),
      makePerk({id: 'p2', labelEn: 'Breakfast', labelVi: 'Bữa sáng'}),
    ];
    render(<TourIncluded included={included} excluded={[]} locale="en" />);
    expect(screen.getByText('Hotel')).toBeInTheDocument();
    expect(screen.getByText('Breakfast')).toBeInTheDocument();
  });

  it('renders Vietnamese label when locale is vi and labelVi is present', () => {
    const included = [
      makePerk({id: 'p1', labelEn: 'Hotel', labelVi: 'Khách sạn'}),
    ];
    render(<TourIncluded included={included} excluded={[]} locale="vi" />);
    expect(screen.getByText('Khách sạn')).toBeInTheDocument();
  });

  it('falls back to English label when labelVi is empty', () => {
    const included = [makePerk({id: 'p1', labelEn: 'Hotel', labelVi: ''})];
    render(<TourIncluded included={included} excluded={[]} locale="vi" />);
    expect(screen.getByText('Hotel')).toBeInTheDocument();
  });

  it('renders excluded perks separately', () => {
    const excluded = [
      makePerk({id: 'p9', labelEn: 'Flights', labelVi: 'Vé máy bay'}),
    ];
    render(<TourIncluded included={[]} excluded={excluded} locale="en" />);
    expect(screen.getByText('Flights')).toBeInTheDocument();
  });

  it('renders the section headings via translation keys', () => {
    render(<TourIncluded included={[]} excluded={[]} locale="en" />);
    expect(screen.getByText('whatsIncluded')).toBeInTheDocument();
    expect(screen.getByText('whatsNotIncluded')).toBeInTheDocument();
  });
});
