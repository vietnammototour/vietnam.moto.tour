import type {ContactInfo} from '@/types';

export const getUrl = (path: string): string =>
  `${process.env.__NEXT_ROUTER_BASEPATH || ''}/${path}`;

export const contactInfo: ContactInfo = {
  phone: '+84-935-797-550',
  email: 'easyridermotorbiketour@gmail.com',
  youtubeLink:
    'https://youtube.com/@vietnammotorcycletour6674?si=kOduPDV6PDhNygvJ',
  tripadvisorLink:
    'https://www.tripadvisor.com/Attraction_Review-g293928-d5501636-Reviews-Vietnam_Motorcycle_Tour-Nha_Trang_Khanh_Hoa_Province.html',
  whatsApp: '+84-935-797-550',
  address: 'Alley 05-07 Nguyen Trung Truc st.',
  city: 'Nha Trang City',
};
