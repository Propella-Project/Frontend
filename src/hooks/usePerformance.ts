import { useCallback, useEffect, useRef, useState, useMemo } from "react";

/**
 * useDebounce Hook
 * Delays the execution of a function until after a specified wait time
 */
export function useDebounce<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
}

/**
 * useThrottle Hook
 * Limits the execution of a function to once per specified period
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  limit: number
): (...args: Parameters<T>) => void {
  const inThrottle = useRef(false);

  return useCallback(
    (...args: Parameters<T>) => {
      if (!inThrottle.current) {
        callback(...args);
        inThrottle.current = true;
        setTimeout(() => {
          inThrottle.current = false;
        }, limit);
      }
    },
    [callback, limit]
  );
}

/**
 * useOptimizedCallback Hook
 * Creates a callback that uses requestAnimationFrame for smooth performance
 * Use this for heavy computation callbacks like scroll/resize handlers
 */
export function useOptimizedCallback<T extends (...args: unknown[]) => void>(
  callback: T
): (...args: Parameters<T>) => void {
  const rafId = useRef<number | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback((...args: Parameters<T>) => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }
    rafId.current = requestAnimationFrame(() => {
      callbackRef.current(...args);
    });
  }, []);
}

/**
 * useScrollPosition Hook
 * Optimized scroll position tracking using requestAnimationFrame
 */
export function useScrollPosition() {
  const [scrollY, setScrollY] = useState(0);
  const [scrollX, setScrollX] = useState(0);
  const rafId = useRef<number | null>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      if (rafId.current) return;
      
      rafId.current = requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        // Only update if scroll changed significantly (reduces re-renders)
        if (Math.abs(currentScrollY - lastScrollY.current) > 1) {
          setScrollY(currentScrollY);
          setScrollX(window.scrollX);
          lastScrollY.current = currentScrollY;
        }
        rafId.current = null;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  return { scrollX, scrollY };
}

/**
 * useIntersectionObserver Hook
 * Lazy load components when they come into view
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [(node: Element | null) => void, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<Element | null>(null);

  const setRef = useCallback((node: Element | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (node) {
      observerRef.current = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          setHasIntersected(true);
        } else {
          setIsIntersecting(false);
        }
      }, {
        threshold: 0.1,
        rootMargin: "50px",
        ...options,
      });
      observerRef.current.observe(node);
    }

    elementRef.current = node;
  }, [options]);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return [setRef, hasIntersected];
}

/**
 * useVirtualList Hook
 * Virtualize long lists for better performance
 */
export function useVirtualList<T>(
  items: T[],
  itemHeight: number,
  overscan = 5
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height);
    });
    resizeObserver.observe(container);

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      resizeObserver.disconnect();
      container.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const virtualItems = useMemo(() => {
    const totalHeight = items.length * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2;
    const endIndex = Math.min(items.length, startIndex + visibleCount);

    return {
      totalHeight,
      startIndex,
      endIndex,
      visibleItems: items.slice(startIndex, endIndex).map((item, index) => ({
        item,
        index: startIndex + index,
        style: {
          position: "absolute" as const,
          top: (startIndex + index) * itemHeight,
          height: itemHeight,
          left: 0,
          right: 0,
        },
      })),
    };
  }, [items, itemHeight, scrollTop, containerHeight, overscan]);

  return { containerRef, ...virtualItems };
}

/**
 * useMemoizedValue Hook
 * Memoize expensive computations
 */
export function useMemoizedValue<T>(
  factory: () => T,
  deps: unknown[],
  isEqual: (prev: T, next: T) => boolean = Object.is
): T {
  const [value, setValue] = useState<T>(factory);
  const prevDepsRef = useRef<unknown[]>(deps);
  const prevValueRef = useRef<T>(value);

  useEffect(() => {
    const depsChanged = deps.length !== prevDepsRef.current.length ||
      deps.some((dep, i) => dep !== prevDepsRef.current[i]);

    if (depsChanged) {
      const newValue = factory();
      if (!isEqual(prevValueRef.current, newValue)) {
        setValue(newValue);
        prevValueRef.current = newValue;
      }
      prevDepsRef.current = deps;
    }
  }, [deps, factory, isEqual]);

  return value;
}

/**
 * useLayoutPaint Hook
 * Defers heavy rendering to reduce layout thrashing
 */
export function useLayoutPaint<T>(
  data: T,
  priority: "high" | "low" = "low"
): T | null {
  const [deferredData, setDeferredData] = useState<T | null>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    if (priority === "high") {
      setDeferredData(data);
      return;
    }

    // Use requestIdleCallback if available, otherwise requestAnimationFrame
    const scheduleUpdate = typeof window !== "undefined" && "requestIdleCallback" in window
      ? window.requestIdleCallback
      : requestAnimationFrame;

    const cancelUpdate = typeof window !== "undefined" && "cancelIdleCallback" in window
      ? window.cancelIdleCallback
      : cancelAnimationFrame;

    rafId.current = scheduleUpdate(() => {
      setDeferredData(data);
    });

    return () => {
      if (rafId.current) {
        cancelUpdate(rafId.current);
      }
    };
  }, [data, priority]);

  return deferredData;
}

/**
 * useLongPress Hook
 * Handle long press events with proper cleanup
 */
export function useLongPress(
  callback: () => void,
  ms = 500
) {
  const [isPressing, setIsPressing] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(() => {
    setIsPressing(true);
    timeoutRef.current = setTimeout(() => {
      callback();
      setIsPressing(false);
    }, ms);
  }, [callback, ms]);

  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsPressing(false);
  }, []);

  return {
    isPressing,
    handlers: {
      onMouseDown: start,
      onMouseUp: stop,
      onMouseLeave: stop,
      onTouchStart: start,
      onTouchEnd: stop,
    },
  };
}

/**
 * useMeasure Hook
 * Measure element dimensions efficiently
 */
export function useMeasure<T extends Element>(): [
  (node: T | null) => void,
  { width: number; height: number; top: number; left: number }
] {
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
    top: 0,
    left: 0,
  });
  const elementRef = useRef<T | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const setRef = useCallback((node: T | null) => {
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }

    elementRef.current = node;

    if (node) {
      resizeObserverRef.current = new ResizeObserver(([entry]) => {
        if (entry) {
          const { width, height, top, left } = entry.contentRect;
          setDimensions({ width, height, top, left });
        }
      });
      resizeObserverRef.current.observe(node);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, []);

  return [setRef, dimensions];
}

export default {
  useDebounce,
  useThrottle,
  useOptimizedCallback,
  useScrollPosition,
  useIntersectionObserver,
  useVirtualList,
  useMemoizedValue,
  useLayoutPaint,
  useLongPress,
  useMeasure,
};
