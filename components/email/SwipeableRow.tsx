"use client";

import { useState, useCallback, useRef } from "react";

const SWIPE_THRESHOLD = 80;

export function SwipeableRow({
  children,
  onSwipeRight,
  isDone,
  className,
}: {
  children: React.ReactNode;
  onSwipeRight: () => void;
  isDone: boolean;
  className?: string;
}) {
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const swiping = useRef(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    currentX.current = 0;
    swiping.current = false;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    // Only start swiping if horizontal movement dominates
    if (!swiping.current) {
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        swiping.current = true;
      } else if (Math.abs(dy) > 10) {
        return; // vertical scroll, ignore
      } else {
        return; // too small to decide
      }
    }

    // Only allow right swipe
    const clampedDx = Math.max(0, dx);
    currentX.current = clampedDx;
    setOffset(clampedDx);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (currentX.current >= SWIPE_THRESHOLD) {
      // Animate off screen then trigger
      setDismissed(true);
      setTimeout(() => {
        onSwipeRight();
      }, 250);
    } else {
      setOffset(0);
    }
    swiping.current = false;
    currentX.current = 0;
  }, [onSwipeRight]);

  const pastThreshold = offset >= SWIPE_THRESHOLD;

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      {/* Green background revealed on swipe — only rendered when swiping */}
      {(offset > 0 || dismissed) && (
        <div
          className="absolute inset-0 flex items-center pl-5 rounded-[inherit]"
          style={{
            backgroundColor: pastThreshold ? "#10b981" : "#10b98144",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={pastThreshold ? "white" : "#10b981"}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span
            className="ml-2 text-sm font-semibold"
            style={{ color: pastThreshold ? "white" : "#10b981" }}
          >
            {isDone ? "Undo" : "Done"}
          </span>
        </div>
      )}
      {/* Sliding content */}
      <div
        ref={rowRef}
        className="relative bg-[var(--background)] rounded-[inherit]"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: dismissed
            ? "translateX(100%)"
            : `translateX(${offset}px)`,
          transition:
            swiping.current && !dismissed
              ? "none"
              : "transform 0.25s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
