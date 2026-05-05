import {
  useMotionValue,
  useSpring,
  useTransform,
  MotionValue,
} from 'framer-motion';
import {useCallback, useRef, RefObject} from 'react';

type CardTilt = {
  ref: RefObject<HTMLElement | null>;
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  scale: MotionValue<number>;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onMouseEnter: () => void;
};

export function useCardTilt(maxDeg = 4): CardTilt {
  const ref = useRef<HTMLElement | null>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const isHovered = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [0, 1], [maxDeg, -maxDeg]), {
    stiffness: 200,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-maxDeg, maxDeg]), {
    stiffness: 200,
    damping: 20,
  });
  const scale = useSpring(isHovered, {stiffness: 200, damping: 20});

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      mouseX.set((e.clientX - rect.left) / rect.width);
      mouseY.set((e.clientY - rect.top) / rect.height);
    },
    [mouseX, mouseY],
  );

  const onMouseEnter = useCallback(() => {
    isHovered.set(1);
  }, [isHovered]);

  const onMouseLeave = useCallback(() => {
    mouseX.set(0.5);
    mouseY.set(0.5);
    isHovered.set(0);
  }, [mouseX, mouseY, isHovered]);

  const finalScale = useTransform(scale, [0, 1], [1, 1.02]);

  return {
    ref,
    rotateX,
    rotateY,
    scale: finalScale,
    onMouseMove,
    onMouseLeave,
    onMouseEnter,
  };
}
