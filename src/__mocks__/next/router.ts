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
