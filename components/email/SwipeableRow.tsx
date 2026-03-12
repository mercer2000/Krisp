"use client";

import { useState, useCallback, useRef } from "react";

const SWIPE_THRESHOLD = 80;
const MAX_LEFT_OFFSET = 120;
const BREAKAWAY = 40; // px of deliberate horizontal drag before row starts moving
const H_RATIO = 3; // horizontal must dominate vertical by this factor

export function SwipeableRow({
  children,
  onSwipeRight,
  onSwipeLeft,
  isDone,
  className,
}: {
  children: React.ReactNode;
  onSwipeRight: () => void;
  onSwipeLeft?: () => void;
  isDone: boolean;
  className?: string;
}) {
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const swiping = useRef(false);
  const locked = useRef(false);
  const anchorX = useRef(0); // X position when swipe engaged — offset is relative to this
  const rowRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [dismissed, setDismissed] = useState<"left" | "right" | false>(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    anchorX.current = 0;
    currentX.current = 0;
    swiping.current = false;
    locked.current = false;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (locked.current) return;

    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (!swiping.current) {
      // Vertical wins early — lock to scroll
      if (absDy >= 15 && absDx < absDy * H_RATIO) {
        locked.current = true;
        return;
      }
      // Not enough horizontal movement yet — stay idle
      if (absDx < BREAKAWAY) return;
      // Passed breakaway with clear horizontal intent
      swiping.current = true;
      anchorX.current = e.touches[0].clientX; // anchor so offset starts at 0
    }

    // Offset is relative to where swipe engaged, not where finger first touched
    let visualDx = e.touches[0].clientX - anchorX.current;
    if (!onSwipeLeft && visualDx < 0) visualDx = 0;
    if (visualDx < 0) visualDx = Math.max(-MAX_LEFT_OFFSET, visualDx);

    currentX.current = visualDx;
    setOffset(visualDx);
  }, [onSwipeLeft]);

  const onTouchEnd = useCallback(() => {
    if (currentX.current >= SWIPE_THRESHOLD) {
      setDismissed("right");
      setTimeout(() => onSwipeRight(), 250);
    } else if (onSwipeLeft && currentX.current <= -SWIPE_THRESHOLD) {
      setDismissed("left");
      setTimeout(() => onSwipeLeft(), 250);
    } else {
      setOffset(0);
    }
    swiping.current = false;
    locked.current = false;
    currentX.current = 0;
  }, [onSwipeRight, onSwipeLeft]);

  const isRight = offset > 0;
  const isLeft = offset < 0;
  const pastThreshold = Math.abs(offset) >= SWIPE_THRESHOLD;

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      {/* Right swipe: green "Done" background */}
      {((isRight && offset > 0) || dismissed === "right") && (
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
      {/* Left swipe: blue "Add to Board" background */}
      {((isLeft && offset < 0) || dismissed === "left") && (
        <div
          className="absolute inset-0 flex items-center justify-end pr-5 rounded-[inherit]"
          style={{
            backgroundColor: pastThreshold ? "#3b82f6" : "#3b82f644",
          }}
        >
          <span
            className="mr-2 text-sm font-semibold"
            style={{ color: pastThreshold ? "white" : "#3b82f6" }}
          >
            To Board
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={pastThreshold ? "white" : "#3b82f6"}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="7" height="7" x="3" y="3" rx="1" />
            <rect width="7" height="7" x="14" y="3" rx="1" />
            <rect width="7" height="7" x="3" y="14" rx="1" />
            <rect width="7" height="7" x="14" y="14" rx="1" />
          </svg>
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
          transform: dismissed === "right"
            ? "translateX(100%)"
            : dismissed === "left"
              ? "translateX(-100%)"
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
