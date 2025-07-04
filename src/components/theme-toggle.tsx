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
      
      {/* The moving Thumb which becomes a crescent */}
      <div
        className={cn(
          "h-5 w-5 rounded-full shadow-md transition-all duration-300 ease-in-out relative overflow-hidden",
          // Light Mode: Yellow Sun
          !isDark && 'translate-x-0 bg-yellow-300',
          // Dark Mode: White Crescent
          isDark && 'translate-x-[20px] bg-white'
        )}
      >
         {/* The "hole" that creates the crescent effect. It's a circle of the track's color that slides into the thumb */}
         <div className={cn(
            "absolute top-[1.5px] h-4 w-4 rounded-full bg-slate-900 transition-all duration-300 ease-in-out",
            // In dark mode, it's visible and positioned to make the crescent. In light mode, it's hidden.
            isDark ? 'right-[1px] opacity-100' : 'right-full opacity-0'
         )}></div>
      </div>
    </button>
  )
}
