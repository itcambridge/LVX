"use client"

import { useEffect, useRef, useState } from "react"

interface ScrollingMessageProps {
  message: string
  speed?: number // pixels per second
  pauseOnHover?: boolean
}

export function ScrollingMessage({
  message,
  speed = 50,
  pauseOnHover = true,
}: ScrollingMessageProps) {
  // Use a simpler approach with fixed animation duration
  // This avoids issues with measuring DOM elements during hydration
  const messageLength = message.length
  const baseDuration = 20 // Base duration in seconds
  const calculatedDuration = Math.max(baseDuration, messageLength / 10)
  
  const [isPaused, setIsPaused] = useState(false)

  return (
    <div
      className="bg-red-600 text-white py-2 overflow-hidden whitespace-nowrap text-sm font-medium"
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      <div className="relative">
        <div
          className="inline-block px-4 animate-scroll"
          style={{
            animationDuration: `${calculatedDuration}s`,
            animationPlayState: isPaused ? "paused" : "running",
          }}
        >
          {message}
        </div>
      </div>
      <style jsx>{`
        .animate-scroll {
          animation: scrollText linear infinite;
          animation-delay: 0s;
        }
        @keyframes scrollText {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  )
}
