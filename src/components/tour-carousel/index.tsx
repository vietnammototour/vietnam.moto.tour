'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';

import { TourCard } from '../tour-card';
import type { TourCarouselProps } from '@/types';

export const TourCarousel = ({ tours }: TourCarouselProps) => {
  return (
    <div className="relative [&_.swiper-button-prev]:text-primary [&_.swiper-button-prev]:after:text-lg [&_.swiper-button-next]:text-primary [&_.swiper-button-next]:after:text-lg">
      <Swiper
        modules={[Navigation, Autoplay]}
        spaceBetween={24}
        slidesPerView={1}
        navigation
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        loop={true}
        breakpoints={{
          640: { slidesPerView: 2, spaceBetween: 20 },
          768: { slidesPerView: 2, spaceBetween: 24 },
          1024: { slidesPerView: 3, spaceBetween: 24 },
          1280: { slidesPerView: 4, spaceBetween: 24 },
        }}
      >
        {tours.map((tour) => (
          <SwiperSlide key={tour.id} className="h-auto pb-2">
            <TourCard tour={tour} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};
