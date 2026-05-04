import {Variants, Transition} from 'framer-motion';

const sweepTransition: Transition = {
  duration: 0.6,
  ease: [0.7, 0, 0.2, 1], // motorbike-sweep
};

const flowTransition: Transition = {
  duration: 0.5,
  ease: [0.25, 0.46, 0.45, 0.94], // water-flow
};

export const clipReveal: Variants = {
  hidden: {clipPath: 'inset(0 100% 0 0)'},
  visible: {
    clipPath: 'inset(0 0% 0 0)',
    transition: sweepTransition,
  },
};

export const slideFromLeft: Variants = {
  hidden: {opacity: 0, x: -40},
  visible: {
    opacity: 1,
    x: 0,
    transition: flowTransition,
  },
};

export const slideFromRight: Variants = {
  hidden: {opacity: 0, x: 40},
  visible: {
    opacity: 1,
    x: 0,
    transition: flowTransition,
  },
};

export const riseWithOvershoot: Variants = {
  hidden: {opacity: 0, y: 30},
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.45, 0.05, 0.35, 0.95], // lantern-sway
    },
  },
};

export const waveStagger = (delayPerItem = 0.08) => ({
  hidden: {opacity: 0, y: 20},
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      delay: i * delayPerItem,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
});

export const fadeInUp: Variants = {
  hidden: {opacity: 0, y: 30},
  visible: {
    opacity: 1,
    y: 0,
    transition: {duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94]},
  },
};
