"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface ScrollingMessageProps {
  message: string;
  /** pixels per second */
  speed?: number;
  pauseOnHover?: boolean;
  /** duplicate count; 2 is enough, 3 feels smoother for long gaps */
  repeat?: number;
}

export function ScrollingMessage({
  message,
  speed = 50,
  pauseOnHover = true,
  repeat = 3,
}: ScrollingMessageProps) {
  const [isPaused, setIsPaused] = useState(false);
  const itemRef = useRef<HTMLSpanElement | null>(null);
  const [itemWidth, setItemWidth] = useState(0);

  // measure once the message is rendered
  useEffect(() => {
    if (!itemRef.current) return;
    const el = itemRef.current;
    const ro = new ResizeObserver(() => setItemWidth(el.offsetWidth));
    setItemWidth(el.offsetWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, [message]);

  // Distance for one seamless cycle when duplicating the content:
  // we animate the track from 0 to -50% (two copies side-by-side),
  // so the pixel distance equals the width of one copy.
  const durationSec = useMemo(() => {
    if (!itemWidth || speed <= 0) return 0;
    return itemWidth / speed;
  }, [itemWidth, speed]);

  const copies = useMemo(() => Array.from({ length: repeat }, () => message), [message, repeat]);

  return (
    <div
      className="bg-red-600 text-white py-2 overflow-hidden text-sm font-medium"
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      <div className="marquee" aria-label={message}>
        <div
          className="track"
          style={
            {
              // pass values to CSS via variables
              ["--duration" as any]: `${Math.max(durationSec, 0.001)}s`,
              ["--play" as any]: isPaused ? "paused" : "running",
            } as React.CSSProperties
          }
        >
          {/* First copy is the one we measure */}
          <span ref={itemRef} className="item px-4 inline-block whitespace-nowrap">
            {message}
          </span>
          {/* Additional copies for seamless loop */}
          {copies.map((m, i) => (
            <span key={i} className="item px-4 inline-block whitespace-nowrap">
              {m}
            </span>
          ))}
        </div>
      </div>

      <style jsx>{`
        .marquee {
          width: 100%;
          overflow: hidden;
        }
        .track {
          display: inline-flex;
          white-space: nowrap;
          will-change: transform;
          animation: scroll var(--duration) linear infinite;
          animation-play-state: var(--play);
        }
        /* Start immediately visible and move left one copy's width.
           Because we render multiple copies, the loop is seamless. */
        @keyframes scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }

        /* Respect users who prefer reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .track {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}
