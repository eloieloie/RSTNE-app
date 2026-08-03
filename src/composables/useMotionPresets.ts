import { computed } from 'vue';
import { useReducedMotion } from 'motion-v';

// Shared motion-v presets, extracted from the conventions established in
// ChaptersView.vue so every view animates with the same feel.
export function useMotionPresets() {
  const prefersReducedMotion = useReducedMotion();

  // Spring used for sheets/tooltips/popovers that slide or scale in.
  const tooltipSpring = { type: 'spring', stiffness: 380, damping: 32 } as const;

  const tapScale = computed(() => (prefersReducedMotion.value ? {} : { scale: 0.96 }));
  const hoverLift = computed(() => (prefersReducedMotion.value ? {} : { y: -2 }));

  // Simple opacity fade for overlay/backdrop tints.
  const overlayFade = computed(() => ({ duration: prefersReducedMotion.value ? 0 : 0.18 }));

  // Popover/modal panel enter — fade + slight scale up.
  const popIn = computed(() => ({
    initial: prefersReducedMotion.value ? false : { opacity: 0, scale: 0.94 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.94 },
    transition: { duration: prefersReducedMotion.value ? 0 : 0.15 },
  }));

  // Capped stagger entrance for list/grid items — avoids runaway delay on long lists.
  function staggerTransition(index: number) {
    if (prefersReducedMotion.value) return { duration: 0 };
    return { duration: 0.28, delay: Math.min(index, 12) * 0.02, ease: [0.4, 0, 0.2, 1] };
  }

  return { prefersReducedMotion, tooltipSpring, tapScale, hoverLift, overlayFade, popIn, staggerTransition };
}
