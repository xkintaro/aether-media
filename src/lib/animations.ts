import { Variants } from "framer-motion";
import { EASING, SPRING_CONFIG, ANIMATION_DURATION } from "./constants";

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      ease: EASING.SPRING,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
  },
};

export const slideUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      ease: EASING.EASE_OUT,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
    },
  },
};

export const slideDown: Variants = {
  initial: { opacity: 0, y: -10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      ease: EASING.EASE_OUT,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.15,
    },
  },
};

export const listContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const listItem: Variants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 },
};

export const accordion: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: {
    height: "auto",
    opacity: 1,
    transition: {
      duration: ANIMATION_DURATION.NORMAL,
      ease: EASING.EASE_OUT,
    },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: {
      duration: ANIMATION_DURATION.FAST,
      ease: EASING.EASE_OUT,
    },
  },
};

export const progressBar: Variants = {
  initial: { width: 0 },
  animate: (custom: number) => ({
    width: `${custom}%`,
    transition: { ease: EASING.EASE_OUT },
  }),
};

export const springTransition = {
  ...SPRING_CONFIG.DEFAULT,
};
