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
    return <div className="h-6 w-11" />;
  }
  
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative flex h-6 w-11 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-500 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isDark ? 'bg-slate-900' : 'bg-sky-400'
      )}
      aria-label="Toggle theme"
    >
      <span className="sr-only">Toggle Theme</span>
      
      {/* Stars on the track for dark mode, positioned on the left side */}
      <div className={cn(
        "absolute inset-0 transition-opacity duration-500 pointer-events-none",
        isDark ? "opacity-100" : "opacity-0"
      )}>
        {/* Large Star */}
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="white" className="absolute left-[6px] top-[4px] h-2 w-2">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
        </svg>
        {/* Small Dot Stars */}
        <div className="absolute left-[13px] top-[3px] h-0.5 w-0.5 rounded-full bg-white opacity-80"></div>
        <div className="absolute left-[9px] top-[11px] h-1 w-1 rounded-full bg-white opacity-70"></div>
      </div>
      
      {/* Clouds for light mode, positioned on the right side of the track */}
      <div className={cn(
        "absolute right-0.5 top-1/2 -translate-y-1/2 transition-all duration-500 pointer-events-none",
        isDark ? "opacity-0 -translate-x-3" : "opacity-100 translate-x-0"
      )}>
        <div className="h-2 w-4 rounded-full bg-white/90 relative -right-1 shadow"></div>
        <div className="h-2 w-3 rounded-full bg-white/90 relative -top-1 shadow"></div>
      </div>
      
      {/* The moving Thumb (Sun/Moon) */}
      <div
        className={cn(
          "h-5 w-5 rounded-full transition-all duration-500 ease-in-out",
          // Light Mode: Yellow Sun, no special shadow
          !isDark && 'translate-x-0 bg-yellow-400 shadow-lg',
          // Dark Mode: White Moon with a CSS inset shadow to create the crescent
          isDark && 'translate-x-5 bg-white shadow-[-4px_2px_0_0_#0f172a_inset]'
        )}
      />
    </button>
  )
}
