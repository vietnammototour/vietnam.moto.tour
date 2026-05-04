import {useMotionValue, useSpring, MotionValue} from 'framer-motion';
import {useCallback, useRef, RefObject} from 'react';

interface MagneticEffect {
  ref: RefObject<HTMLElement | null>;
  x: MotionValue<number>;
  y: MotionValue<number>;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
}

export function useMagnetic(strength = 0.3, threshold = 80): MagneticEffect {
  const ref = useRef<HTMLElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, {stiffness: 300, damping: 20});
  const springY = useSpring(y, {stiffness: 300, damping: 20});

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distX = e.clientX - centerX;
      const distY = e.clientY - centerY;
      const distance = Math.sqrt(distX * distX + distY * distY);

      if (distance < threshold) {
        x.set(distX * strength);
        y.set(distY * strength);
      } else {
        x.set(0);
        y.set(0);
      }
    },
    [x, y, strength, threshold],
  );

  const onMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return {ref, x: springX, y: springY, onMouseMove, onMouseLeave};
}
