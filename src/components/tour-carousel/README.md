# TourCarousel Component

A modern React carousel component for displaying tour cards using Swiper.js.

## Features

- ✅ Built with latest Swiper React components
- ✅ Fully responsive with breakpoints
- ✅ Touch/swipe enabled
- ✅ Autoplay functionality
- ✅ Custom navigation buttons
- ✅ Pagination dots
- ✅ Smooth animations
- ✅ TypeScript compatible

## Usage

```jsx
import { TourCarousel } from '@/components/tour-carousel';
import { toursData } from '@/data';

<TourCarousel tours={toursData} />
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| tours | Array | Yes | Array of tour objects |

## Tour Object Structure

Each tour object should have the following structure:

```javascript
{
  id: number,
  title: string,
  imageUrl: string,
  rating: string,
  price: number,
  duration: string,
  people: string,
  location: string
}
```

## Responsive Breakpoints

- **Mobile (320px+)**: 1 slide per view
- **Small tablets (640px+)**: 2 slides per view
- **Tablets (768px+)**: 2 slides per view
- **Desktop (1024px+)**: 3 slides per view
- **Large desktop (1280px+)**: 4 slides per view

## Customization

You can customize the carousel appearance by modifying the `styles.css` file in the component directory. The following CSS variables are available:

- `--tevily-primary`: Primary color for buttons (default: #ff6700)
- `--tevily-black`: Hover color for buttons (default: #26272b)

## Configuration

The carousel is configured with the following default settings:

- **Autoplay**: 5 seconds delay
- **Loop**: Enabled
- **Space between slides**: 30px (desktop), 20px (mobile)
- **Navigation**: Previous/Next buttons
- **Pagination**: Clickable dots

## Migration from owl-carousel

This component replaces the legacy owl-carousel implementation with modern Swiper React components, providing:

- Better performance
- Native React support
- Better touch/gesture handling
- Modern API
- Active maintenance and updates
- Smaller bundle size when using proper tree-shaking

## Dependencies

- `swiper`: ^12.0.0
- `react`: ^19.0.0

## Notes

- The component uses `'use client'` directive for Next.js App Router compatibility
- Swiper styles are imported automatically
- Custom styles are scoped to `.popular-tours__carousel` class

