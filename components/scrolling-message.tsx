"use client"

import { useState } from "react"

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
  const [isPaused, setIsPaused] = useState(false)
  
  // Fixed animation duration - much slower for better readability
  const animationDuration = 120 // seconds

  return (
    <div
      className="bg-red-600 text-white py-2 overflow-hidden whitespace-nowrap text-sm font-medium"
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      <div className="marquee-container">
        <div
          className="marquee-content"
          style={{
            animationDuration: `${animationDuration}s`,
            animationPlayState: isPaused ? "paused" : "running",
          }}
        >
          <span className="px-4">{message}</span>
          <span className="px-4">{message}</span>
        </div>
      </div>
      
      <style jsx>{`
        .marquee-container {
          width: 100%;
          overflow: hidden;
        }
        
        .marquee-content {
          display: inline-block;
          white-space: nowrap;
          animation: marquee linear infinite;
          animation-delay: 0s;
        }
        
        @keyframes marquee {
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
