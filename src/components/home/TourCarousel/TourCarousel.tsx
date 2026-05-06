'use client';

import {Swiper, SwiperSlide} from 'swiper/react';
import {Autoplay, Pagination} from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/pagination';

import type * as VMT from '@/domain';
import {TourCard} from '@/components/TourCard';
import styles from './TourCarousel.module.css';

type Props = {
  tours: VMT.Tour[];
};

export const TourCarousel = ({tours}: Props) => {
  return (
    <div className={`relative ${styles.carousel}`}>
      <Swiper
        modules={[Autoplay, Pagination]}
        spaceBetween={24}
        slidesPerView={1}
        autoplay={{
          delay: 7500,
          disableOnInteraction: false,
        }}
        loop={false}
        pagination={{clickable: true}}
        breakpoints={{
          640: {slidesPerView: 2, spaceBetween: 20},
          768: {slidesPerView: 2, spaceBetween: 24},
          1024: {slidesPerView: 3, spaceBetween: 24},
          1280: {slidesPerView: 4, spaceBetween: 24},
        }}
      >
        {tours.map((tour) => (
          <SwiperSlide key={tour.id} className="h-auto py-2">
            <TourCard tour={tour} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};
