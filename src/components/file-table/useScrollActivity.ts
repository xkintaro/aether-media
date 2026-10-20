import { useRef, useState } from "react";
import {
  SCROLL_VELOCITY_THRESHOLD,
  SCROLL_DEBOUNCE_MS,
  FAST_SCROLL_STREAK,
} from "@/lib/constants";

export function useScrollActivity() {
  const [isFastScrolling, setIsFastScrolling] = useState(false);
  const lastScrollRef = useRef({ top: 0, time: 0 });
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fastStreakRef = useRef(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentTop = e.currentTarget.scrollTop;
    const currentTime = Date.now();
    const timeDelta = currentTime - lastScrollRef.current.time;

    if (timeDelta > 16) {
      const distance = Math.abs(currentTop - lastScrollRef.current.top);
      const velocity = distance / timeDelta;

      if (velocity > SCROLL_VELOCITY_THRESHOLD) {
        fastStreakRef.current += 1;

        if (fastStreakRef.current >= FAST_SCROLL_STREAK && !isFastScrolling) {
          setIsFastScrolling(true);
        }

        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
          setIsFastScrolling(false);
          fastStreakRef.current = 0;
        }, SCROLL_DEBOUNCE_MS);
      } else {
        fastStreakRef.current = 0;
      }
      lastScrollRef.current = { top: currentTop, time: currentTime };
    }
  };

  return { isFastScrolling, handleScroll };
}
