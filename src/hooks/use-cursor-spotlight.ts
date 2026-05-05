import {useMotionValue, useSpring, MotionValue} from 'framer-motion';
import {useCallback, useRef, RefObject} from 'react';

type CursorSpotlight = {
  ref: RefObject<HTMLElement | null>;
  x: MotionValue<number>;
  y: MotionValue<number>;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
};

export function useCursorSpotlight(
  radius = 200,
  opacity = 0.15,
  color = '180, 83, 9',
): CursorSpotlight {
  const ref = useRef<HTMLElement | null>(null);
  const x = useMotionValue(-1000);
  const y = useMotionValue(-1000);
  const springX = useSpring(x, {stiffness: 150, damping: 25});
  const springY = useSpring(y, {stiffness: 150, damping: 25});

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      x.set(e.clientX - rect.left);
      y.set(e.clientY - rect.top);
    },
    [x, y],
  );

  const onMouseLeave = useCallback(() => {
    x.set(-1000);
    y.set(-1000);
  }, [x, y]);

  return {ref, x: springX, y: springY, onMouseMove, onMouseLeave};
}
