'use client';

import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Import custom styles
import styles from './TourCarousel.module.css';

import { TourCard } from '../tour-card';

export const TourCarousel = ({ tours }) => {
  return (
    <Swiper
      modules={[Navigation, Pagination, Autoplay]}
      spaceBetween={30}
      slidesPerView={1}
      // navigation={{
      //   nextEl: '.swiper-button-next',
      //   prevEl: '.swiper-button-prev',
      // }}
      // pagination={{
      //   clickable: true,
      // }}
      autoplay={{
        delay: 3000,
        disableOnInteraction: false,
      }}
      loop={true}
      breakpoints={{
        // when window width is >= 320px
        320: {
          slidesPerView: 1,
          spaceBetween: 20
        },
        // when window width is >= 640px
        640: {
          slidesPerView: 2,
          spaceBetween: 20
        },
        // when window width is >= 768px
        768: {
          slidesPerView: 2,
          spaceBetween: 30
        },
        // when window width is >= 1024px
        1024: {
          slidesPerView: 3,
          spaceBetween: 30
        },
        // when window width is >= 1280px
        1280: {
          slidesPerView: 4,
          spaceBetween: 30
        }
      }}
      className="popular-tours__carousel"
    >
      {tours.map((tour) => (
        <SwiperSlide key={tour.id}>
          <TourCard tour={tour} />
        </SwiperSlide>
      ))}

      {/* Navigation buttons */}
      {/*<div className="swiper-button-prev"></div>*/}
      {/*<div className="swiper-button-next"></div>*/}
    </Swiper>
  );
};

