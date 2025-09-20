"use client"

import { useEffect, useRef } from "react"

interface ScrollingMessageProps {
  message: string
  speed?: number // pixels per second
  pauseOnHover?: boolean
}

export function ScrollingMessage({
  message,
  speed = 40,
  pauseOnHover = true,
}: ScrollingMessageProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // This effect ensures the animation restarts if the component re-renders
    const scrollElement = scrollRef.current
    if (scrollElement) {
      scrollElement.style.animation = 'none'
      // Force reflow
      void scrollElement.offsetWidth
      scrollElement.style.animation = ''
    }
  }, [message])

  return (
    <div 
      className="bg-red-600 text-white py-2 overflow-hidden whitespace-nowrap text-sm font-medium"
      style={{ position: 'relative' }}
    >
      <div 
        ref={scrollRef}
        className="inline-block px-4 animate-marquee"
        style={{ 
          animationDuration: `${message.length / speed}s`,
          animationPlayState: pauseOnHover ? 'paused' : 'running',
        }}
        onMouseEnter={(e) => pauseOnHover && (e.currentTarget.style.animationPlayState = 'paused')}
        onMouseLeave={(e) => pauseOnHover && (e.currentTarget.style.animationPlayState = 'running')}
      >
        {message}
      </div>
      
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(100vw);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .animate-marquee {
          animation: marquee linear infinite;
        }
      `}</style>
    </div>
  )
}
