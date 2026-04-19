import type { Destination, Tour } from '@/types';
import { getUrl } from '../utils/index';

// Destinations data
export const destinationsData: Destination[] = [
  {
    id: 1,
    name: "Nha Trang",
    imageUrl: "https://www.agoda.com/wp-content/uploads/2024/02/Nha-Trang-Cable-Vietnam-1244x700.jpg",
    tours: 12,
    width: "285px",
    height: "285px",
    colClass: "col-xl-3 col-lg-3"
  },
  {
    id: 2,
    name: "Dalat",
    imageUrl: "https://localvietnam.de/wp-content/uploads/2023/09/tuyen-lam-see-1-1024x683.jpg",
    tours: 5,
    width: "580px",
    height: "285px",
    colClass: "col-xl-6 col-lg-6"
  },
  {
    id: 3,
    name: "Mui Ne",
    imageUrl: "https://images.ctfassets.net/wv75stsetqy3/6gzFoj0ORIEj3yIGsB1Q08/5797e277832264a11c9bae10fb2f7772/Retire_in_Mui_Ne.jpg?q=60&fit=fill&fm=webp",
    tours: 12,
    width: "285px",
    height: "285px",
    colClass: "col-xl-3 col-lg-3"
  },
  {
    id: 4,
    name: "Sai Gon",
    imageUrl: "https://cdnen.thesaigontimes.vn/wp-content/uploads/2024/07/Mot-thoang-Ho-Ba-Be_Thong-Lam.jpg",
    tours: 12,
    width: "580px",
    height: "285px",
    colClass: "col-xl-6 col-lg-6"
  },
  {
    id: 5,
    name: "Hoi An",
    imageUrl: "https://cdn.kimkim.com/files/a/content_articles/featured_photos/5022fa3d9e45c25486f8bcc9adcfdb44a09ded12/big-94f2b85fd88b035fb52518c04d9cfd63.jpg",
    tours: 12,
    width: "580px",
    height: "285px",
    colClass: "col-xl-6 col-lg-6"
  }
];

// Tours data
export const toursData: Tour[] = [
  {
    id: 1,
    title: "Da Lat Tour",
    imageUrl: 'https://cdnen.thesaigontimes.vn/wp-content/uploads/2024/07/Mot-thoang-Ho-Ba-Be_Thong-Lam.jpg',
    rating: "8.1 Superb",
    price: 80,
    duration: "1 Day",
    distance: "186 Miles",
    location: "Da Lat"
  },
  {
    id: 2,
    title: "2d Explore Da Lat",
    imageUrl: 'https://localvietnam.de/wp-content/uploads/2023/09/tuyen-lam-see-1-1024x683.jpg',
    rating: "8.2 Superb",
    price: 130,
    duration: "1 Day",
    distance: "210 Miles",
    location: "Omega Pass"
  },
  {
    id: 3,
    title: "Baho Waterfall",
    imageUrl: 'https://images.ctfassets.net/wv75stsetqy3/6gzFoj0ORIEj3yIGsB1Q08/5797e277832264a11c9bae10fb2f7772/Retire_in_Mui_Ne.jpg?q=60&fit=fill&fm=webp',
    rating: "8.0 Superb",
    price: 70,
    duration: "1 Day",
    distance: "50 Miles",
    location: "Nha Trang"
  },
  {
    id: 4,
    title: "1d Motor NT-DL",
    imageUrl: 'https://cdnen.thesaigontimes.vn/wp-content/uploads/2024/07/Mot-thoang-Ho-Ba-Be_Thong-Lam.jpg',
    rating: "8.3 Superb",
    price: 70,
    duration: "1 Day",
    distance: "93 Miles",
    location: "Nha Trang"
  },
  {
    id: 5,
    title: "Nha Trang Tour",
    imageUrl: 'https://localvietnam.de/wp-content/uploads/2023/09/tuyen-lam-see-1-1024x683.jpg',
    rating: "7.9 Superb",
    price: 40,
    duration: "1 Day",
    distance: "25 Miles",
    location: "Nha Trang"
  },
  {
    id: 6,
    title: "Honba Waterfall",
    imageUrl: 'https://images.ctfassets.net/wv75stsetqy3/6gzFoj0ORIEj3yIGsB1Q08/5797e277832264a11c9bae10fb2f7772/Retire_in_Mui_Ne.jpg?q=60&fit=fill&fm=webp',
    rating: "8.0 Superb",
    price: 70,
    duration: "1 Day",
    distance: "25 Miles",
    location: "La Lo Pagoda"
  },
  {
    id: 7,
    title: "Eco Day Tour",
    imageUrl: 'https://cdnen.thesaigontimes.vn/wp-content/uploads/2024/07/Mot-thoang-Ho-Ba-Be_Thong-Lam.jpg',
    rating: "8.0 Superb",
    price: 65,
    duration: "1 Day",
    distance: "80 Miles",
    location: "La Lo pagoda"
  }
];
