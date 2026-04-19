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
