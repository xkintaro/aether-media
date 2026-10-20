import { useRef, useEffect } from "react";

interface VirtualRowProps {
  index: number;
  start: number;
  measureElement: (element: Element | null) => void;
  children: React.ReactNode;
}

export const VirtualRow = ({
  index,
  start,
  measureElement,
  children,
}: VirtualRowProps) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    measureElement(element);
    const observer = new ResizeObserver(() => {
      measureElement(element);
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [measureElement]);
  return (
    <div
      ref={ref}
      data-index={index}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        transform: `translateY(${start}px)`,
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
};
