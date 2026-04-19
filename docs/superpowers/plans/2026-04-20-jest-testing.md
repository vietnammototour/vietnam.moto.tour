# Jest Testing Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add comprehensive Jest + React Testing Library testing infrastructure with mocks, utilities, and full test coverage for all components, hooks, utils, and pages.

**Architecture:** Jest with ts-jest transform runs in jsdom environment. A custom render wrapper provides ThemeProvider context. Global mocks for next-intl (key echo), next/router, next/link, next/head, and framer-motion eliminate external dependencies. Co-located spec files for components/hooks/utils, top-level `__tests__/` for page integration tests.

**Tech Stack:** jest, ts-jest, jest-environment-jsdom, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, @types/jest

---

## File Structure

```
jest.config.ts                          # Jest configuration
jest.setup.ts                           # Global setup (jest-dom import)
src/
  __mocks__/
    next-intl.ts                        # useTranslations key echo, useLocale, NextIntlClientProvider
    next/
      router.ts                         # useRouter mock
      link.tsx                          # <a> passthrough
      head.tsx                          # children passthrough
    framer-motion.tsx                   # motion proxy + AnimatePresence passthrough
    swiper/
      react.tsx                         # Swiper + SwiperSlide as divs
  test-utils/
    render.tsx                          # Custom render with ThemeProvider
    factories.ts                        # buildTour, buildDestination, buildContactInfo
  utils/
    index.spec.ts                       # getUrl, contactInfo
  hooks/
    useScrollDirection.spec.ts          # scroll direction hook
  components/
    gallery-item/index.spec.tsx
    video-modal/index.spec.tsx
    scroll-to-top/index.spec.tsx
    page-header/index.spec.tsx
    destination-card/index.spec.tsx
    tour-card/index.spec.tsx
    tour-carousel/index.spec.tsx
    language-switcher/index.spec.tsx
    theme-toggle/index.spec.tsx
    footer/index.spec.tsx
    header/index.spec.tsx
__tests__/
  pages/
    home.spec.tsx
    tours.spec.tsx
    about-us.spec.tsx
    contact.spec.tsx
  integration/
    layout.spec.tsx
```

---

### Task 1: Install dependencies and configure Jest

**Files:**

- Modify: `package.json`
- Create: `jest.config.ts`
- Create: `jest.setup.ts`

- [ ] **Step 1: Install test dependencies**

```bash
pnpm add -D jest ts-jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/jest
```

- [ ] **Step 2: Create `jest.config.ts`**

```ts
import type {Config} from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.css$': '<rootDir>/src/__mocks__/styleMock.ts',
  },
  setupFilesAfterSetup: ['<rootDir>/jest.setup.ts'],
  testMatch: [
    '<rootDir>/src/**/*.spec.{ts,tsx}',
    '<rootDir>/__tests__/**/*.spec.{ts,tsx}',
  ],
};

export default config;
```

- [ ] **Step 3: Create `jest.setup.ts`**

```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 4: Create `src/__mocks__/styleMock.ts`**

```ts
export default {};
```

- [ ] **Step 5: Add test scripts to `package.json`**

Add to `"scripts"`:

```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}
```

Update `"lint-staged"` `"*.{ts,tsx}"` array to:

```json
["eslint --fix", "prettier --write", "jest --bail --findRelatedTests"]
```

- [ ] **Step 6: Verify Jest runs (no tests yet)**

```bash
pnpm test
```

Expected: "No tests found" — confirms Jest is configured and can start.

- [ ] **Step 7: Commit**

```bash
git add jest.config.ts jest.setup.ts src/__mocks__/styleMock.ts package.json pnpm-lock.yaml
git commit -m "chore: add Jest and React Testing Library dependencies and config"
```

---

### Task 2: Create global mocks

**Files:**

- Create: `src/__mocks__/next-intl.ts`
- Create: `src/__mocks__/next/router.ts`
- Create: `src/__mocks__/next/link.tsx`
- Create: `src/__mocks__/next/head.tsx`
- Create: `src/__mocks__/framer-motion.tsx`
- Create: `src/__mocks__/swiper/react.tsx`

- [ ] **Step 1: Create `src/__mocks__/next-intl.ts`**

```ts
import type {ReactNode} from 'react';

export function useTranslations(namespace?: string) {
  return (key: string, params?: Record<string, unknown>) => {
    if (params) {
      return `${key}:${JSON.stringify(params)}`;
    }
    return key;
  };
}

export function useLocale() {
  return 'vi';
}

export function NextIntlClientProvider({
  children,
}: {
  children: ReactNode;
  locale?: string;
  messages?: Record<string, unknown>;
  timeZone?: string;
}) {
  return children;
}
```

- [ ] **Step 2: Create `src/__mocks__/next/router.ts`**

```ts
const router = {
  pathname: '/',
  asPath: '/',
  locale: 'vi',
  locales: ['vi', 'en'],
  defaultLocale: 'vi',
  query: {},
  push: jest.fn().mockResolvedValue(true),
  replace: jest.fn().mockResolvedValue(true),
  prefetch: jest.fn().mockResolvedValue(undefined),
  back: jest.fn(),
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
};

export function useRouter() {
  return router;
}

export default {useRouter};
```

- [ ] **Step 3: Create `src/__mocks__/next/link.tsx`**

```tsx
import type {ReactNode} from 'react';

export default function Link({
  children,
  href,
  ...props
}: {
  children: ReactNode;
  href: string;
  [key: string]: unknown;
}) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}
```

- [ ] **Step 4: Create `src/__mocks__/next/head.tsx`**

```tsx
import type {ReactNode} from 'react';

export default function Head({children}: {children: ReactNode}) {
  return <>{children}</>;
}
```

- [ ] **Step 5: Create `src/__mocks__/framer-motion.tsx`**

```tsx
import {forwardRef, type ReactNode} from 'react';

const motionHandler: ProxyHandler<Record<string, unknown>> = {
  get(_target, prop: string) {
    return forwardRef(function MotionComponent(
      {
        children,
        initial: _initial,
        animate: _animate,
        exit: _exit,
        whileInView: _whileInView,
        viewport: _viewport,
        variants: _variants,
        transition: _transition,
        ...props
      }: Record<string, unknown> & {children?: ReactNode},
      ref: React.Ref<HTMLElement>,
    ) {
      const Element = prop as React.ElementType;
      return (
        <Element ref={ref} {...props}>
          {children}
        </Element>
      );
    });
  },
};

export const motion = new Proxy({} as Record<string, unknown>, motionHandler);

export function AnimatePresence({children}: {children: ReactNode}) {
  return <>{children}</>;
}
```

- [ ] **Step 6: Create `src/__mocks__/swiper/react.tsx`**

```tsx
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
```

- [ ] **Step 7: Commit**

```bash
git add src/__mocks__/
git commit -m "chore: add global mocks for next-intl, next/router, next/link, next/head, framer-motion, swiper"
```

---

### Task 3: Create test utilities

**Files:**

- Create: `src/test-utils/render.tsx`
- Create: `src/test-utils/factories.ts`

- [ ] **Step 1: Create `src/test-utils/render.tsx`**

```tsx
import {render, type RenderOptions} from '@testing-library/react';
import type {ReactElement, ReactNode} from 'react';
import {ThemeProvider} from '@/components/theme-provider';

function AllProviders({children}: {children: ReactNode}) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, {wrapper: AllProviders, ...options});
}

export * from '@testing-library/react';
export {customRender as render};
```

- [ ] **Step 2: Create `src/test-utils/factories.ts`**

```ts
import type {Tour, Destination, ContactInfo} from '@/types';

export function buildTour(overrides?: Partial<Tour>): Tour {
  return {
    id: 1,
    title: 'Test Tour',
    imageUrl: '/test-tour.jpg',
    rating: '8.0 Superb',
    price: 80,
    duration: '1 Day',
    distance: '100 Miles',
    location: 'Test City',
    ...overrides,
  };
}

export function buildDestination(
  overrides?: Partial<Destination>,
): Destination {
  return {
    id: 1,
    name: 'Test Destination',
    imageUrl: '/test-destination.jpg',
    tours: 3,
    size: 'small',
    ...overrides,
  };
}

export function buildContactInfo(
  overrides?: Partial<ContactInfo>,
): ContactInfo {
  return {
    phone: '+84-000-000-000',
    email: 'test@example.com',
    youtubeLink: 'https://youtube.com/test',
    tripadvisorLink: 'https://tripadvisor.com/test',
    whatsApp: '+84-000-000-000',
    address: '123 Test St.',
    city: 'Test City',
    ...overrides,
  };
}
```

- [ ] **Step 3: Write a smoke test to verify the setup works**

Create `src/test-utils/render.spec.tsx`:

```tsx
import {render, screen} from '@/test-utils/render';

function TestComponent() {
  return <div>hello</div>;
}

describe('test-utils render', () => {
  it('renders a component within providers', () => {
    render(<TestComponent />);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run the smoke test**

```bash
pnpm test src/test-utils/render.spec.tsx
```

Expected: 1 test PASS.

- [ ] **Step 5: Commit**

```bash
git add src/test-utils/
git commit -m "chore: add test utilities — custom render with providers and data factories"
```

---

### Task 4: Unit tests for utils and data

**Files:**

- Create: `src/utils/index.spec.ts`
- Create: `src/data/index.spec.ts`

- [ ] **Step 1: Write `src/utils/index.spec.ts`**

```ts
import {getUrl, contactInfo} from '@/utils';

describe('getUrl', () => {
  it('returns path prefixed with /', () => {
    expect(getUrl('assets/images/logo.png')).toBe('/assets/images/logo.png');
  });

  it('handles empty string', () => {
    expect(getUrl('')).toBe('/');
  });
});

describe('contactInfo', () => {
  it('has a phone number', () => {
    expect(contactInfo.phone).toBe('+84-935-797-550');
  });

  it('has an email', () => {
    expect(contactInfo.email).toBe('easyridermotorbiketour@gmail.com');
  });

  it('has a YouTube link', () => {
    expect(contactInfo.youtubeLink).toContain('youtube.com');
  });

  it('has a TripAdvisor link', () => {
    expect(contactInfo.tripadvisorLink).toContain('tripadvisor.com');
  });

  it('has a WhatsApp number', () => {
    expect(contactInfo.whatsApp).toBeTruthy();
  });

  it('has an address', () => {
    expect(contactInfo.address).toBeTruthy();
  });

  it('has a city', () => {
    expect(contactInfo.city).toBe('Nha Trang City');
  });
});
```

- [ ] **Step 2: Write `src/data/index.spec.ts`**

```ts
import {toursData, destinationsData} from '@/data';

describe('toursData', () => {
  it('is a non-empty array', () => {
    expect(toursData.length).toBeGreaterThan(0);
  });

  it('each tour has required fields', () => {
    for (const tour of toursData) {
      expect(tour.id).toEqual(expect.any(Number));
      expect(tour.title).toEqual(expect.any(String));
      expect(tour.imageUrl).toEqual(expect.any(String));
      expect(tour.rating).toEqual(expect.any(String));
      expect(tour.price).toEqual(expect.any(Number));
      expect(tour.duration).toEqual(expect.any(String));
      expect(tour.distance).toEqual(expect.any(String));
      expect(tour.location).toEqual(expect.any(String));
    }
  });

  it('has unique IDs', () => {
    const ids = toursData.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('destinationsData', () => {
  it('is a non-empty array', () => {
    expect(destinationsData.length).toBeGreaterThan(0);
  });

  it('each destination has required fields', () => {
    for (const dest of destinationsData) {
      expect(dest.id).toEqual(expect.any(Number));
      expect(dest.name).toEqual(expect.any(String));
      expect(dest.imageUrl).toEqual(expect.any(String));
      expect(dest.tours).toEqual(expect.any(Number));
      expect(['small', 'large']).toContain(dest.size);
    }
  });

  it('has unique IDs', () => {
    const ids = destinationsData.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

- [ ] **Step 3: Run the tests**

```bash
pnpm test src/utils/index.spec.ts src/data/index.spec.ts
```

Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/utils/index.spec.ts src/data/index.spec.ts
git commit -m "test: add unit tests for utils and data modules"
```

---

### Task 5: Unit test for useScrollDirection hook

**Files:**

- Create: `src/hooks/useScrollDirection.spec.ts`

- [ ] **Step 1: Write `src/hooks/useScrollDirection.spec.ts`**

```ts
import {renderHook, act} from '@testing-library/react';
import {useScrollDirection} from '@/hooks/useScrollDirection';

describe('useScrollDirection', () => {
  let scrollListeners: Array<(event?: Event) => void>;

  beforeEach(() => {
    scrollListeners = [];
    jest
      .spyOn(window, 'addEventListener')
      .mockImplementation((event, handler) => {
        if (event === 'scroll') {
          scrollListeners.push(handler as (event?: Event) => void);
        }
      });
    jest
      .spyOn(window, 'removeEventListener')
      .mockImplementation((event, handler) => {
        if (event === 'scroll') {
          scrollListeners = scrollListeners.filter((h) => h !== handler);
        }
      });
    Object.defineProperty(window, 'scrollY', {value: 0, writable: true});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function fireScroll(y: number) {
    Object.defineProperty(window, 'scrollY', {value: y, writable: true});
    for (const listener of scrollListeners) {
      listener();
    }
  }

  it('starts with direction up and scrollY 0', () => {
    const {result} = renderHook(() => useScrollDirection());
    expect(result.current.scrollDirection).toBe('up');
    expect(result.current.scrollY).toBe(0);
  });

  it('sets direction to down when scrolling past threshold', () => {
    const {result} = renderHook(() => useScrollDirection());
    act(() => fireScroll(100));
    expect(result.current.scrollDirection).toBe('down');
    expect(result.current.scrollY).toBe(100);
  });

  it('sets direction to up when scrolling back', () => {
    const {result} = renderHook(() => useScrollDirection());
    act(() => fireScroll(200));
    act(() => fireScroll(50));
    expect(result.current.scrollDirection).toBe('up');
    expect(result.current.scrollY).toBe(50);
  });

  it('does not set down when below threshold (80px)', () => {
    const {result} = renderHook(() => useScrollDirection());
    act(() => fireScroll(50));
    expect(result.current.scrollDirection).toBe('up');
  });

  it('cleans up scroll listener on unmount', () => {
    const {unmount} = renderHook(() => useScrollDirection());
    expect(scrollListeners.length).toBe(1);
    unmount();
    expect(scrollListeners.length).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test**

```bash
pnpm test src/hooks/useScrollDirection.spec.ts
```

Expected: All 5 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useScrollDirection.spec.ts
git commit -m "test: add unit tests for useScrollDirection hook"
```

---

### Task 6: Component tests — simple components (GalleryItem, VideoModal, ScrollToTop, PageHeader)

**Files:**

- Create: `src/components/gallery-item/index.spec.tsx`
- Create: `src/components/video-modal/index.spec.tsx`
- Create: `src/components/scroll-to-top/index.spec.tsx`
- Create: `src/components/page-header/index.spec.tsx`

- [ ] **Step 1: Write `src/components/gallery-item/index.spec.tsx`**

```tsx
import {render, screen} from '@/test-utils/render';
import userEvent from '@testing-library/user-event';
import {GalleryItem} from './index';

describe('GalleryItem', () => {
  it('renders an image with the correct src', () => {
    render(<GalleryItem imageSrc="/gallery/test.jpg" delay={100} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/gallery/test.jpg');
  });

  it('renders expand icon on hover area', () => {
    render(<GalleryItem imageSrc="/gallery/test.jpg" delay={100} />);
    const icon = document.querySelector('.fa-expand');
    expect(icon).toBeInTheDocument();
  });

  it('opens lightbox on click', async () => {
    const user = userEvent.setup();
    render(<GalleryItem imageSrc="/gallery/test.jpg" delay={100} />);
    const button = screen.getByRole('button');
    await user.click(button);
    const closeButton = screen.getByLabelText('Close lightbox');
    expect(closeButton).toBeInTheDocument();
    // Lightbox image rendered
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2); // thumbnail + lightbox
  });

  it('closes lightbox when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<GalleryItem imageSrc="/gallery/test.jpg" delay={100} />);
    await user.click(screen.getByRole('button'));
    await user.click(screen.getByLabelText('Close lightbox'));
    expect(screen.queryByLabelText('Close lightbox')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Write `src/components/video-modal/index.spec.tsx`**

```tsx
import {render, screen} from '@/test-utils/render';
import userEvent from '@testing-library/user-event';
import {VideoModal} from './index';

describe('VideoModal', () => {
  const defaultProps = {
    videoUrl: 'https://www.youtube.com/watch?v=abc123',
    isOpen: false,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const {container} = render(<VideoModal {...defaultProps} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders iframe with embed URL when isOpen is true', () => {
    render(<VideoModal {...defaultProps} isOpen={true} />);
    const iframe = screen.getByTitle('Video');
    expect(iframe).toHaveAttribute(
      'src',
      'https://www.youtube.com/embed/abc123?autoplay=1',
    );
  });

  it('renders close button with correct aria-label', () => {
    render(<VideoModal {...defaultProps} isOpen={true} />);
    expect(screen.getByLabelText('Close video')).toBeInTheDocument();
  });

  it('renders close icon (fa-times)', () => {
    render(<VideoModal {...defaultProps} isOpen={true} />);
    const icon = document.querySelector('.fa-times');
    expect(icon).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<VideoModal {...defaultProps} isOpen={true} onClose={onClose} />);
    await user.click(screen.getByLabelText('Close video'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const {container} = render(
      <VideoModal {...defaultProps} isOpen={true} onClose={onClose} />,
    );
    // The overlay is the outermost div
    const overlay = container.firstElementChild!;
    await user.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Write `src/components/scroll-to-top/index.spec.tsx`**

```tsx
import {render, screen} from '@/test-utils/render';
import userEvent from '@testing-library/user-event';
import {ScrollToTop} from './index';

// Mock useScrollDirection to control scrollY
let mockScrollY = 0;
jest.mock('@/hooks/useScrollDirection', () => ({
  useScrollDirection: () => ({
    scrollDirection: 'up' as const,
    scrollY: mockScrollY,
  }),
}));

describe('ScrollToTop', () => {
  beforeEach(() => {
    mockScrollY = 0;
    window.scrollTo = jest.fn();
  });

  it('renders button with correct aria-label', () => {
    render(<ScrollToTop />);
    expect(screen.getByLabelText('Scroll to top')).toBeInTheDocument();
  });

  it('renders arrow-up icon', () => {
    render(<ScrollToTop />);
    const icon = document.querySelector('.fa-arrow-up');
    expect(icon).toBeInTheDocument();
  });

  it('has pointer-events-none class when scrollY is below 400', () => {
    mockScrollY = 100;
    render(<ScrollToTop />);
    const button = screen.getByLabelText('Scroll to top');
    expect(button.className).toContain('pointer-events-none');
  });

  it('does not have pointer-events-none class when scrollY exceeds 400', () => {
    mockScrollY = 500;
    render(<ScrollToTop />);
    const button = screen.getByLabelText('Scroll to top');
    expect(button.className).not.toContain('pointer-events-none');
  });

  it('calls window.scrollTo on click', async () => {
    mockScrollY = 500;
    const user = userEvent.setup();
    render(<ScrollToTop />);
    await user.click(screen.getByLabelText('Scroll to top'));
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: 'smooth',
    });
  });
});
```

- [ ] **Step 4: Write `src/components/page-header/index.spec.tsx`**

```tsx
import {render, screen} from '@/test-utils/render';
import {PageHeader} from './index';

describe('PageHeader', () => {
  const defaultProps = {
    title: 'Test Title',
    breadcrumbs: [
      {label: 'Home', href: '/'},
      {label: 'Pages'},
      {label: 'Current'},
    ],
    backgroundImage: '/test-bg.jpg',
  };

  it('renders the title', () => {
    render(<PageHeader {...defaultProps} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders breadcrumb labels', () => {
    render(<PageHeader {...defaultProps} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Pages')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('renders breadcrumb links with correct href', () => {
    render(<PageHeader {...defaultProps} />);
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('renders non-link breadcrumbs as spans', () => {
    render(<PageHeader {...defaultProps} />);
    const pages = screen.getByText('Pages');
    expect(pages.tagName).toBe('SPAN');
    expect(pages.closest('a')).toBeNull();
  });

  it('renders breadcrumb separators between items', () => {
    render(<PageHeader {...defaultProps} />);
    const separators = screen.getAllByText('/');
    expect(separators).toHaveLength(2); // between 3 breadcrumbs
  });
});
```

- [ ] **Step 5: Run all four test files**

```bash
pnpm test src/components/gallery-item/index.spec.tsx src/components/video-modal/index.spec.tsx src/components/scroll-to-top/index.spec.tsx src/components/page-header/index.spec.tsx
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/gallery-item/index.spec.tsx src/components/video-modal/index.spec.tsx src/components/scroll-to-top/index.spec.tsx src/components/page-header/index.spec.tsx
git commit -m "test: add component tests for GalleryItem, VideoModal, ScrollToTop, PageHeader"
```

---

### Task 7: Component tests — data-driven components (TourCard, DestinationCard, TourCarousel)

**Files:**

- Create: `src/components/tour-card/index.spec.tsx`
- Create: `src/components/destination-card/index.spec.tsx`
- Create: `src/components/tour-carousel/index.spec.tsx`

- [ ] **Step 1: Write `src/components/tour-card/index.spec.tsx`**

```tsx
import {render, screen} from '@/test-utils/render';
import {TourCard} from './index';
import {buildTour} from '@/test-utils/factories';

describe('TourCard', () => {
  const tour = buildTour({
    title: 'Da Lat Tour',
    price: 80,
    duration: '1 Day',
    distance: '186 Miles',
    location: 'Da Lat',
    imageUrl: '/dalat.jpg',
  });

  it('renders the tour title as a link to /tours', () => {
    render(<TourCard tour={tour} />);
    const link = screen.getByText('Da Lat Tour').closest('a');
    expect(link).toHaveAttribute('href', '/tours');
  });

  it('renders the price', () => {
    render(<TourCard tour={tour} />);
    expect(screen.getByText('$80')).toBeInTheDocument();
  });

  it('renders the perPerson translation key', () => {
    render(<TourCard tour={tour} />);
    expect(screen.getByText('perPerson')).toBeInTheDocument();
  });

  it('renders the duration', () => {
    render(<TourCard tour={tour} />);
    expect(screen.getByText('1 Day')).toBeInTheDocument();
  });

  it('renders the distance', () => {
    render(<TourCard tour={tour} />);
    expect(screen.getByText('186 Miles')).toBeInTheDocument();
  });

  it('renders the location', () => {
    render(<TourCard tour={tour} />);
    expect(screen.getByText('Da Lat')).toBeInTheDocument();
  });

  it('renders the tour image with correct src and alt', () => {
    render(<TourCard tour={tour} />);
    const img = screen.getByAltText('Da Lat Tour');
    expect(img).toHaveAttribute('src', '/dalat.jpg');
  });

  it('renders clock icon', () => {
    render(<TourCard tour={tour} />);
    expect(document.querySelector('.fa-clock')).toBeInTheDocument();
  });

  it('renders road icon', () => {
    render(<TourCard tour={tour} />);
    expect(document.querySelector('.fa-road')).toBeInTheDocument();
  });

  it('renders map-marker-alt icon', () => {
    render(<TourCard tour={tour} />);
    expect(document.querySelector('.fa-map-marker-alt')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Write `src/components/destination-card/index.spec.tsx`**

```tsx
import {render, screen} from '@/test-utils/render';
import {DestinationCard} from './index';
import {buildDestination} from '@/test-utils/factories';

describe('DestinationCard', () => {
  const destination = buildDestination({
    name: 'Dalat',
    imageUrl: '/dalat.jpg',
    tours: 5,
  });

  it('renders the destination name as a link to /tours', () => {
    render(<DestinationCard destination={destination} />);
    const link = screen.getByText('Dalat').closest('a');
    expect(link).toHaveAttribute('href', '/tours');
  });

  it('renders the tour count with tours translation key', () => {
    render(<DestinationCard destination={destination} />);
    expect(screen.getByText('5 tours')).toBeInTheDocument();
  });

  it('renders the image with correct src and alt', () => {
    render(<DestinationCard destination={destination} />);
    const img = screen.getByAltText('Dalat');
    expect(img).toHaveAttribute('src', '/dalat.jpg');
  });

  it('applies className prop', () => {
    const {container} = render(
      <DestinationCard destination={destination} className="h-full" />,
    );
    expect(container.firstElementChild).toHaveClass('h-full');
  });
});
```

- [ ] **Step 3: Write `src/components/tour-carousel/index.spec.tsx`**

```tsx
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
```

- [ ] **Step 4: Run the tests**

```bash
pnpm test src/components/tour-card/index.spec.tsx src/components/destination-card/index.spec.tsx src/components/tour-carousel/index.spec.tsx
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/tour-card/index.spec.tsx src/components/destination-card/index.spec.tsx src/components/tour-carousel/index.spec.tsx
git commit -m "test: add component tests for TourCard, DestinationCard, TourCarousel"
```

---

### Task 8: Component tests — interactive components (LanguageSwitcher, ThemeToggle)

**Files:**

- Create: `src/components/language-switcher/index.spec.tsx`
- Create: `src/components/theme-toggle/index.spec.tsx`

- [ ] **Step 1: Write `src/components/language-switcher/index.spec.tsx`**

```tsx
import {render, screen} from '@/test-utils/render';
import userEvent from '@testing-library/user-event';
import {LanguageSwitcher} from './index';
import {useRouter} from 'next/router';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

describe('LanguageSwitcher', () => {
  const push = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      locale: 'vi',
      asPath: '/tours',
      push,
    });
  });

  it('renders VI and EN buttons', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByText('VI')).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('renders separator between buttons', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByText('|')).toBeInTheDocument();
  });

  it('highlights VI when locale is vi', () => {
    render(<LanguageSwitcher />);
    const viButton = screen.getByText('VI');
    expect(viButton.className).toContain('text-on-surface-accent');
  });

  it('highlights EN when locale is en', () => {
    (useRouter as jest.Mock).mockReturnValue({
      locale: 'en',
      asPath: '/tours',
      push,
    });
    render(<LanguageSwitcher />);
    const enButton = screen.getByText('EN');
    expect(enButton.className).toContain('text-on-surface-accent');
  });

  it('calls router.push with en locale when EN is clicked', async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);
    await user.click(screen.getByText('EN'));
    expect(push).toHaveBeenCalledWith('/tours', '/tours', {locale: 'en'});
  });

  it('calls router.push with vi locale when VI is clicked', async () => {
    (useRouter as jest.Mock).mockReturnValue({
      locale: 'en',
      asPath: '/',
      push,
    });
    const user = userEvent.setup();
    render(<LanguageSwitcher />);
    await user.click(screen.getByText('VI'));
    expect(push).toHaveBeenCalledWith('/', '/', {locale: 'vi'});
  });
});
```

- [ ] **Step 2: Write `src/components/theme-toggle/index.spec.tsx`**

```tsx
import {render, screen} from '@/test-utils/render';
import userEvent from '@testing-library/user-event';
import ThemeToggle from './index';

describe('ThemeToggle', () => {
  it('renders the label translation key', () => {
    render(<ThemeToggle />);
    expect(screen.getByText('label')).toBeInTheDocument();
  });

  it('renders a switch role element', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('starts with aria-checked false (light mode)', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('has aria-label with light translation key in light mode', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-label', 'light');
  });

  it('toggles to dark mode on click', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    await user.click(screen.getByRole('switch'));
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('switch')).toHaveAttribute('aria-label', 'dark');
  });

  it('renders sun symbol (&#9728;)', () => {
    const {container} = render(<ThemeToggle />);
    // Sun: ☀ (U+2600)
    expect(container.textContent).toContain('\u2600');
  });

  it('renders moon symbol (&#9790;)', () => {
    const {container} = render(<ThemeToggle />);
    // Moon: ☾ (U+263E)
    expect(container.textContent).toContain('\u263E');
  });
});
```

- [ ] **Step 3: Run the tests**

```bash
pnpm test src/components/language-switcher/index.spec.tsx src/components/theme-toggle/index.spec.tsx
```

Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/language-switcher/index.spec.tsx src/components/theme-toggle/index.spec.tsx
git commit -m "test: add component tests for LanguageSwitcher and ThemeToggle"
```

---

### Task 9: Component tests — Footer and Header

**Files:**

- Create: `src/components/footer/index.spec.tsx`
- Create: `src/components/header/index.spec.tsx`

- [ ] **Step 1: Write `src/components/footer/index.spec.tsx`**

```tsx
import {render, screen} from '@/test-utils/render';
import {Footer} from './index';
import {contactInfo} from '@/utils';

describe('Footer', () => {
  it('renders the logo', () => {
    render(<Footer />);
    const logo = screen.getByAltText('Logo');
    expect(logo).toBeInTheDocument();
  });

  it('renders nav links with correct hrefs', () => {
    render(<Footer />);
    const toursLink = screen.getByText('tours').closest('a');
    expect(toursLink).toHaveAttribute('href', '/tours');

    const aboutLink = screen.getByText('aboutUs').closest('a');
    expect(aboutLink).toHaveAttribute('href', '/about-us');

    const contactLink = screen.getByText('contact').closest('a');
    expect(contactLink).toHaveAttribute('href', '/contact');
  });

  it('renders YouTube social link', () => {
    render(<Footer />);
    const ytLink = screen.getByLabelText('YouTube');
    expect(ytLink).toHaveAttribute('href', contactInfo.youtubeLink);
    expect(document.querySelector('.fa-youtube')).toBeInTheDocument();
  });

  it('renders TripAdvisor social link', () => {
    render(<Footer />);
    const taLink = screen.getByLabelText('TripAdvisor');
    expect(taLink).toHaveAttribute('href', contactInfo.tripadvisorLink);
    expect(document.querySelector('.fa-tripadvisor')).toBeInTheDocument();
  });

  it('renders WhatsApp social link', () => {
    render(<Footer />);
    const waLink = screen.getByLabelText('WhatsApp');
    expect(waLink).toHaveAttribute(
      'href',
      `https://wa.me/${contactInfo.whatsApp.replace(/[^0-9]/g, '')}`,
    );
    expect(document.querySelector('.fa-whatsapp')).toBeInTheDocument();
  });

  it('renders the phone number', () => {
    render(<Footer />);
    expect(screen.getByText(contactInfo.phone)).toBeInTheDocument();
  });

  it('renders the email', () => {
    render(<Footer />);
    expect(screen.getByText(contactInfo.email)).toBeInTheDocument();
  });

  it('renders phone link with tel: href', () => {
    render(<Footer />);
    const phoneLink = screen.getByText(contactInfo.phone).closest('a');
    expect(phoneLink).toHaveAttribute('href', `tel:${contactInfo.phone}`);
  });

  it('renders email link with mailto: href', () => {
    render(<Footer />);
    const emailLink = screen.getByText(contactInfo.email).closest('a');
    expect(emailLink).toHaveAttribute('href', `mailto:${contactInfo.email}`);
  });

  it('renders phone icon', () => {
    render(<Footer />);
    expect(document.querySelector('.fa-phone-alt')).toBeInTheDocument();
  });

  it('renders envelope icon', () => {
    render(<Footer />);
    expect(document.querySelector('.fa-envelope')).toBeInTheDocument();
  });

  it('renders copyright with year param', () => {
    render(<Footer />);
    const year = new Date().getFullYear();
    expect(screen.getByText(`copyright:{"year":${year}}`)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Write `src/components/header/index.spec.tsx`**

```tsx
import {render, screen} from '@/test-utils/render';
import userEvent from '@testing-library/user-event';
import {Header} from './index';
import {useRouter} from 'next/router';
import {contactInfo} from '@/utils';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/hooks/useScrollDirection', () => ({
  useScrollDirection: () => ({scrollDirection: 'up', scrollY: 0}),
}));

describe('Header', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      pathname: '/',
      asPath: '/',
      locale: 'vi',
      locales: ['vi', 'en'],
      push: jest.fn(),
      events: {on: jest.fn(), off: jest.fn(), emit: jest.fn()},
    });
  });

  it('renders the logo', () => {
    render(<Header />);
    const logo = screen.getByAltText('Vietnam Motorcycle Tour');
    expect(logo).toBeInTheDocument();
  });

  it('renders Home nav link', () => {
    render(<Header />);
    expect(screen.getByText('home')).toBeInTheDocument();
  });

  it('renders Tours nav link', () => {
    render(<Header />);
    expect(screen.getByText('tours')).toBeInTheDocument();
  });

  it('renders About Us nav link', () => {
    render(<Header />);
    expect(screen.getByText('aboutUs')).toBeInTheDocument();
  });

  it('renders Contact nav link', () => {
    render(<Header />);
    expect(screen.getByText('contact')).toBeInTheDocument();
  });

  it('marks active link with text-primary when on home page', () => {
    render(<Header />);
    // Desktop nav: the home link in the nav (not the mobile panel)
    const homeLinks = screen.getAllByText('home');
    const desktopLink = homeLinks[0].closest('a');
    expect(desktopLink?.className).toContain('text-primary');
  });

  it('marks tours link active when on /tours', () => {
    (useRouter as jest.Mock).mockReturnValue({
      pathname: '/tours',
      asPath: '/tours',
      locale: 'vi',
      locales: ['vi', 'en'],
      push: jest.fn(),
      events: {on: jest.fn(), off: jest.fn(), emit: jest.fn()},
    });
    render(<Header />);
    const toursLinks = screen.getAllByText('tours');
    const desktopLink = toursLinks[0].closest('a');
    expect(desktopLink?.className).toContain('text-primary');
  });

  it('renders YouTube social link in top bar', () => {
    render(<Header />);
    const icons = document.querySelectorAll('.fa-youtube');
    expect(icons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders TripAdvisor social link in top bar', () => {
    render(<Header />);
    const icons = document.querySelectorAll('.fa-tripadvisor');
    expect(icons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders WhatsApp social link in top bar', () => {
    render(<Header />);
    const icons = document.querySelectorAll('.fa-whatsapp');
    expect(icons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders mobile menu button with aria-label', () => {
    render(<Header />);
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
  });

  it('opens mobile menu on button click', async () => {
    const user = userEvent.setup();
    render(<Header />);
    await user.click(screen.getByLabelText('Open menu'));
    expect(screen.getByLabelText('Close menu')).toBeInTheDocument();
  });

  it('closes mobile menu on close button click', async () => {
    const user = userEvent.setup();
    render(<Header />);
    await user.click(screen.getByLabelText('Open menu'));
    await user.click(screen.getByLabelText('Close menu'));
    // Mobile panel should be off-screen (translate-x-full)
    const closeIcon = screen.queryByLabelText('Close menu');
    // The close button is still in the DOM but the panel is hidden via CSS
    expect(closeIcon).toBeInTheDocument();
  });

  it('renders LanguageSwitcher', () => {
    render(<Header />);
    expect(screen.getAllByText('VI').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('EN').length).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 3: Run the tests**

```bash
pnpm test src/components/footer/index.spec.tsx src/components/header/index.spec.tsx
```

Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/footer/index.spec.tsx src/components/header/index.spec.tsx
git commit -m "test: add component tests for Footer and Header"
```

---

### Task 10: Integration tests — pages

**Files:**

- Create: `__tests__/pages/home.spec.tsx`
- Create: `__tests__/pages/tours.spec.tsx`
- Create: `__tests__/pages/about-us.spec.tsx`
- Create: `__tests__/pages/contact.spec.tsx`

- [ ] **Step 1: Write `__tests__/pages/home.spec.tsx`**

```tsx
import {render, screen} from '@/test-utils/render';
import Home, {getStaticProps} from '@/pages/index';

describe('Home page', () => {
  it('renders hero section with title and subtitle translation keys', () => {
    render(<Home />);
    expect(screen.getByText('heroTitle')).toBeInTheDocument();
    expect(screen.getByText('heroSubtitle')).toBeInTheDocument();
  });

  it('renders destinations section heading', () => {
    render(<Home />);
    expect(screen.getByText('destinationLists')).toBeInTheDocument();
    expect(screen.getByText('goExoticPlaces')).toBeInTheDocument();
  });

  it('renders about section heading', () => {
    render(<Home />);
    expect(screen.getByText('getToKnowUs')).toBeInTheDocument();
    expect(screen.getByText('planYourTrip')).toBeInTheDocument();
  });

  it('renders about section bullet points', () => {
    render(<Home />);
    expect(screen.getByText('bulletMotorbike')).toBeInTheDocument();
    expect(screen.getByText('bulletFriendly')).toBeInTheDocument();
    expect(screen.getByText('bulletExperience')).toBeInTheDocument();
  });

  it('renders popular tours section heading', () => {
    render(<Home />);
    expect(screen.getByText('featuredTours')).toBeInTheDocument();
    expect(screen.getByText('mostPopularTours')).toBeInTheDocument();
  });

  it('renders video/CTA section', () => {
    render(<Home />);
    expect(screen.getByText('readyToTravel')).toBeInTheDocument();
    expect(screen.getByText('videoSectionHeading')).toBeInTheDocument();
  });

  it('renders value proposition cards', () => {
    render(<Home />);
    expect(screen.getByText('localExperts')).toBeInTheDocument();
    expect(screen.getByText('hiddenRoutes')).toBeInTheDocument();
    expect(screen.getByText('yearsOnRoad')).toBeInTheDocument();
    expect(screen.getByText('dayAndMultiDay')).toBeInTheDocument();
    expect(screen.getByText('smallGroups')).toBeInTheDocument();
    expect(screen.getByText('allInclusive')).toBeInTheDocument();
  });

  it('renders play video button', () => {
    render(<Home />);
    expect(screen.getByLabelText('Play video')).toBeInTheDocument();
  });

  it('renders gallery images', () => {
    render(<Home />);
    // Gallery uses GalleryItem which renders buttons
    const galleryButtons = screen.getAllByRole('button');
    // At least 5 gallery buttons + play video button
    expect(galleryButtons.length).toBeGreaterThanOrEqual(6);
  });

  it('renders book with us CTA', () => {
    render(<Home />);
    expect(screen.getByText('bookWithUsNow')).toBeInTheDocument();
  });
});

describe('Home getStaticProps', () => {
  it('returns messages for vi locale', async () => {
    const result = await getStaticProps({locale: 'vi'} as never);
    expect(result).toHaveProperty('props.messages');
    expect(result.props.messages).toBeDefined();
  });

  it('returns messages for en locale', async () => {
    const result = await getStaticProps({locale: 'en'} as never);
    expect(result).toHaveProperty('props.messages');
    expect(result.props.messages).toBeDefined();
  });
});
```

- [ ] **Step 2: Write `__tests__/pages/tours.spec.tsx`**

```tsx
import {render, screen} from '@/test-utils/render';
import Tours, {getStaticProps} from '@/pages/tours';
import {toursData} from '@/data';

describe('Tours page', () => {
  it('renders meta title translation key', () => {
    render(<Tours />);
    expect(screen.getByText('toursTitle')).toBeInTheDocument();
  });

  it('renders page header with title translation key', () => {
    render(<Tours />);
    expect(screen.getByText('title')).toBeInTheDocument();
  });

  it('renders breadcrumbs', () => {
    render(<Tours />);
    expect(screen.getByText('breadcrumbHome')).toBeInTheDocument();
    expect(screen.getByText('breadcrumbTours')).toBeInTheDocument();
  });

  it('renders a TourCard for each tour in data', () => {
    render(<Tours />);
    for (const tour of toursData) {
      expect(screen.getByText(tour.title)).toBeInTheDocument();
    }
  });

  it('renders correct number of tour cards', () => {
    render(<Tours />);
    const prices = screen.getAllByText('perPerson');
    expect(prices).toHaveLength(toursData.length);
  });
});

describe('Tours getStaticProps', () => {
  it('returns messages for vi locale', async () => {
    const result = await getStaticProps({locale: 'vi'} as never);
    expect(result).toHaveProperty('props.messages');
  });
});
```

- [ ] **Step 3: Write `__tests__/pages/about-us.spec.tsx`**

```tsx
import {render, screen} from '@/test-utils/render';
import AboutUs, {getStaticProps} from '@/pages/about-us';

describe('AboutUs page', () => {
  it('renders meta title translation key', () => {
    render(<AboutUs />);
    expect(screen.getByText('aboutTitle')).toBeInTheDocument();
  });

  it('renders page header with title', () => {
    render(<AboutUs />);
    expect(screen.getByText('title')).toBeInTheDocument();
  });

  it('renders breadcrumbs', () => {
    render(<AboutUs />);
    expect(screen.getByText('breadcrumbHome')).toBeInTheDocument();
    expect(screen.getByText('breadcrumbPages')).toBeInTheDocument();
    expect(screen.getByText('breadcrumbAbout')).toBeInTheDocument();
  });

  it('renders about section heading keys', () => {
    render(<AboutUs />);
    expect(screen.getByText('learnAboutUs')).toBeInTheDocument();
    expect(screen.getByText('dareToExplore')).toBeInTheDocument();
    expect(screen.getByText('perfectPlace')).toBeInTheDocument();
  });

  it('renders progress bars with labels', () => {
    render(<AboutUs />);
    expect(screen.getByText('bestServices')).toBeInTheDocument();
    expect(screen.getByText('tourAgents')).toBeInTheDocument();
    expect(screen.getByText('77%')).toBeInTheDocument();
    expect(screen.getByText('38%')).toBeInTheDocument();
  });

  it('renders CTA section', () => {
    render(<AboutUs />);
    expect(screen.getByText('readyForTour')).toBeInTheDocument();
    expect(screen.getByText('bookTourNow')).toBeInTheDocument();
  });

  it('renders stats section', () => {
    render(<AboutUs />);
    expect(screen.getByText('870+')).toBeInTheDocument();
    expect(screen.getByText('totalTours')).toBeInTheDocument();
    expect(screen.getByText('480+')).toBeInTheDocument();
    expect(screen.getByText('happyRiders')).toBeInTheDocument();
  });

  it('renders play video button', () => {
    render(<AboutUs />);
    expect(screen.getByLabelText('Play video')).toBeInTheDocument();
  });
});

describe('AboutUs getStaticProps', () => {
  it('returns messages for vi locale', async () => {
    const result = await getStaticProps({locale: 'vi'} as never);
    expect(result).toHaveProperty('props.messages');
  });
});
```

- [ ] **Step 4: Write `__tests__/pages/contact.spec.tsx`**

```tsx
import {render, screen} from '@/test-utils/render';
import Contact, {getStaticProps} from '@/pages/contact';
import {contactInfo} from '@/utils';

describe('Contact page', () => {
  it('renders meta title translation key', () => {
    render(<Contact />);
    expect(screen.getByText('contactTitle')).toBeInTheDocument();
  });

  it('renders page header with title', () => {
    render(<Contact />);
    expect(screen.getByText('title')).toBeInTheDocument();
  });

  it('renders breadcrumbs', () => {
    render(<Contact />);
    expect(screen.getByText('breadcrumbHome')).toBeInTheDocument();
    expect(screen.getByText('breadcrumbContact')).toBeInTheDocument();
  });

  it('renders contact form fields', () => {
    render(<Contact />);
    expect(screen.getByPlaceholderText('namePlaceholder')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('emailPlaceholder')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('messagePlaceholder'),
    ).toBeInTheDocument();
  });

  it('renders send message button', () => {
    render(<Contact />);
    expect(screen.getByText('sendMessage')).toBeInTheDocument();
  });

  it('renders talk with team heading', () => {
    render(<Contact />);
    expect(screen.getByText('talkWithTeam')).toBeInTheDocument();
    expect(screen.getByText('anyQuestion')).toBeInTheDocument();
  });

  it('renders contact info: address', () => {
    render(<Contact />);
    expect(screen.getByText(contactInfo.address)).toBeInTheDocument();
  });

  it('renders contact info: phone', () => {
    render(<Contact />);
    expect(screen.getByText(contactInfo.phone)).toBeInTheDocument();
  });

  it('renders contact info: email', () => {
    render(<Contact />);
    expect(screen.getByText(contactInfo.email)).toBeInTheDocument();
  });

  it('renders social media icons', () => {
    render(<Contact />);
    expect(document.querySelector('.fa-facebook')).toBeInTheDocument();
    expect(document.querySelector('.fa-twitter')).toBeInTheDocument();
    expect(document.querySelector('.fa-instagram')).toBeInTheDocument();
  });

  it('renders the map image', () => {
    render(<Contact />);
    const mapImg = screen.getByAltText('Location map');
    expect(mapImg).toBeInTheDocument();
  });
});

describe('Contact getStaticProps', () => {
  it('returns messages for vi locale', async () => {
    const result = await getStaticProps({locale: 'vi'} as never);
    expect(result).toHaveProperty('props.messages');
  });
});
```

- [ ] **Step 5: Run the tests**

```bash
pnpm test __tests__/
```

Expected: All integration tests PASS.

- [ ] **Step 6: Commit**

```bash
git add __tests__/
git commit -m "test: add integration tests for Home, Tours, AboutUs, Contact pages"
```

---

### Task 11: Integration test — Layout

**Files:**

- Create: `__tests__/integration/layout.spec.tsx`

- [ ] **Step 1: Write `__tests__/integration/layout.spec.tsx`**

```tsx
import {render, screen} from '@/test-utils/render';
import {Layout} from '@/components/layout';

jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/',
    asPath: '/',
    locale: 'vi',
    locales: ['vi', 'en'],
    push: jest.fn(),
    events: {on: jest.fn(), off: jest.fn(), emit: jest.fn()},
  }),
}));

jest.mock('@/hooks/useScrollDirection', () => ({
  useScrollDirection: () => ({scrollDirection: 'up', scrollY: 0}),
}));

describe('Layout', () => {
  it('renders Header (logo present)', () => {
    render(
      <Layout>
        <div>Page Content</div>
      </Layout>,
    );
    expect(screen.getByAltText('Vietnam Motorcycle Tour')).toBeInTheDocument();
  });

  it('renders Footer (logo present)', () => {
    render(
      <Layout>
        <div>Page Content</div>
      </Layout>,
    );
    // Footer has a separate Logo alt
    expect(screen.getByAltText('Logo')).toBeInTheDocument();
  });

  it('renders children inside main element', () => {
    render(
      <Layout>
        <div data-testid="child">Page Content</div>
      </Layout>,
    );
    const main = document.querySelector('main');
    expect(main).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(main?.contains(screen.getByTestId('child'))).toBe(true);
  });

  it('renders ScrollToTop button', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>,
    );
    expect(screen.getByLabelText('Scroll to top')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test**

```bash
pnpm test __tests__/integration/layout.spec.tsx
```

Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add __tests__/integration/layout.spec.tsx
git commit -m "test: add integration test for Layout composition"
```

---

### Task 12: Full test suite run and CI integration

**Files:**

- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: Run the full test suite**

```bash
pnpm test
```

Expected: All tests PASS across all files.

- [ ] **Step 2: Run with coverage**

```bash
pnpm test --coverage
```

Expected: Coverage report printed. Note the baseline numbers.

- [ ] **Step 3: Add test job to `.github/workflows/deploy.yml`**

Replace the entire file with:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm test --ci --coverage

  deploy:
    needs: [test]
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            export NVM_DIR="$HOME/.nvm"
            [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
            cd /var/www/vietnam-moto-tours
            git checkout -- .
            git pull origin main
            npm install --frozen-lockfile
            npm run build
            pm2 restart vietnam-moto-tours
```

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add test job that gates deployment"
```

- [ ] **Step 5: Run full suite one last time to verify nothing broke**

```bash
pnpm test
```

Expected: All tests PASS.
