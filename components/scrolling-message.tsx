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
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [animationDuration, setAnimationDuration] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (containerRef.current && contentRef.current) {
      // Calculate the animation duration based on content width and speed
      const containerWidth = containerRef.current.offsetWidth
      const contentWidth = contentRef.current.offsetWidth
      const totalWidth = containerWidth + contentWidth
      const duration = totalWidth / speed

      setAnimationDuration(duration)
    }
  }, [message, speed])

  return (
    <div
      ref={containerRef}
      className="bg-red-600 text-white py-2 overflow-hidden whitespace-nowrap text-sm font-medium"
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      <div className="max-w-md mx-auto px-4 relative">
        <div
          ref={contentRef}
          className="inline-block px-4"
          style={{
            animation: `scrollText ${animationDuration}s linear infinite`,
            animationPlayState: isPaused ? "paused" : "running",
          }}
        >
          {message}
        </div>
      </div>
      <style jsx>{`
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
