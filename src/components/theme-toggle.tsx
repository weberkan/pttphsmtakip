"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  // To prevent hydration mismatch, only render the real component when mounted.
  if (!isMounted) {
    // Placeholder to avoid layout shift.
    return <div className="h-8 w-14" />;
  }
  
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative flex h-8 w-14 cursor-pointer items-center rounded-full p-1 transition-colors duration-300 ease-in-out",
        isDark ? 'bg-slate-800' : 'bg-sky-400'
      )}
      aria-label="Toggle theme"
    >
      <span className="sr-only">Toggle Theme</span>
      
      {/* Decorative elements on the track */}
      <div className={cn(
        "absolute inset-0 transition-opacity duration-300",
        !isDark ? "opacity-100" : "opacity-0"
      )}>
          {/* small planets for light mode */}
          <div className="absolute right-[9px] top-[11px] h-1.5 w-1.5 rounded-full bg-white/70"></div>
          <div className="absolute right-[16px] top-[4px] h-1 w-1 rounded-full bg-white/70"></div>
      </div>
      <div className={cn(
        "absolute inset-0 transition-opacity duration-300",
        isDark ? "opacity-100" : "opacity-0"
      )}>
            {/* small stars for dark mode */}
           <div className="absolute left-[8px] top-[5px] h-1 w-1 scale-75 rounded-full bg-white opacity-80">
              <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="white"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
           </div>
           <div className="absolute left-[6px] top-[14px] h-0.5 w-0.5 rounded-full bg-white opacity-80"></div>
           <div className="absolute left-[14px] top-[16px] h-0.5 w-0.5 rounded-full bg-white opacity-80"></div>
      </div>
      
      {/* The moving Thumb */}
      <div
        className={cn(
          "h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out relative overflow-hidden",
          isDark ? 'translate-x-[24px]' : 'translate-x-0'
        )}
      >
        {/* This div slides in to create the crescent shape for the moon */}
        <div className={cn(
            "absolute h-5 w-5 rounded-full top-1/2 -translate-y-1/2 transition-all duration-300 ease-in-out",
            isDark ? "left-0.5 bg-slate-800" : "-left-full bg-sky-400"
        )}></div>
      </div>
    </button>
  )
}
