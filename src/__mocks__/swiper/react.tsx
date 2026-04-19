import type {ReactNode} from 'react';

export function Swiper({
  children,
}: {
  children: ReactNode;
  [key: string]: unknown;
}) {
  return <div data-testid="swiper">{children}</div>;
}

export function SwiperSlide({
  children,
}: {
  children: ReactNode;
  [key: string]: unknown;
}) {
  return <div data-testid="swiper-slide">{children}</div>;
}
