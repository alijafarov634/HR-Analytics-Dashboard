import { useEffect, useRef, useState } from 'react';

/**
 * Triggers a brief loading skeleton state when filter dependencies change,
 * keeping initial mount instantaneous while giving visual feedback on filter recalculations.
 */
export function useFilterTransition(deps: ReadonlyArray<unknown>, delayMs = 160): boolean {
  const isFirstRender = useRef(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setIsUpdating(true);
    const timer = window.setTimeout(() => {
      setIsUpdating(false);
    }, delayMs);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return isUpdating;
}
