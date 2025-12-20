/**
 * Lazy-loaded framer-motion feature set for reduced bundle size.
 * Uses domAnimation which includes opacity, transform, and layout animations.
 * @see https://motion.dev/docs/react-reduce-bundle-size
 */
export const domAnimation = () => import("framer-motion").then((mod) => mod.domAnimation);
