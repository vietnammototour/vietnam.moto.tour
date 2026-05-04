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
        whileHover: _whileHover,
        whileTap: _whileTap,
        viewport: _viewport,
        variants: _variants,
        transition: _transition,
        style: _style,
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

function createMotionValue(initial: number) {
  let value = initial;
  return {
    get: () => value,
    set: (v: number) => {
      value = v;
    },
    onChange: () => () => {},
    on: () => () => {},
  };
}

export function useMotionValue(initial: number) {
  return createMotionValue(initial);
}

export function useSpring(source: ReturnType<typeof createMotionValue>) {
  return source;
}

export function useTransform(
  _value: ReturnType<typeof createMotionValue>,
  _inputRange: number[],
  outputRange: number[],
) {
  return createMotionValue(outputRange[0]);
}

export type MotionValue<T = number> = {
  get: () => T;
  set: (v: T) => void;
};

export function useMotionTemplate(
  strings: TemplateStringsArray,
  ...values: unknown[]
) {
  const result = strings.reduce(
    (acc, str, i) => acc + str + (values[i] ?? ''),
    '',
  );
  return {
    get: () => result,
    set: () => {},
    onChange: () => () => {},
    on: () => () => {},
  };
}
