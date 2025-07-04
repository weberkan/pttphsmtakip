
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
    // Placeholder to avoid layout shift. It should approximate the size of the final component.
    return <div className="h-10 w-48" />;
  }
  
  const isDark = theme === 'dark';

  return (
    <div className="flex items-center justify-center gap-3">
      <span
        className={cn(
          "text-sm font-semibold transition-colors duration-300",
          isDark ? "text-muted-foreground" : "text-foreground"
        )}
      >
        Light
      </span>

      <button
        onClick={toggleTheme}
        className={cn(
          "relative flex h-9 w-[74px] cursor-pointer items-center rounded-full p-1 transition-colors duration-300 ease-in-out",
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
            <div className="absolute right-[11px] top-[14px] h-2 w-2 rounded-full bg-white/70"></div>
            <div className="absolute right-[22px] top-[4px] h-[5px] w-[5px] rounded-full bg-white/70"></div>
        </div>
        <div className={cn(
          "absolute inset-0 transition-opacity duration-300",
          isDark ? "opacity-100" : "opacity-0"
        )}>
             <div className="absolute left-[12px] top-[6px] h-[5px] w-[5px] rounded-full bg-white opacity-80 scale-75">
                <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="white"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
             </div>
             <div className="absolute left-[8px] top-[16px] h-0.5 w-0.5 rounded-full bg-white opacity-80"></div>
             <div className="absolute left-[20px] top-[18px] h-0.5 w-0.5 rounded-full bg-white opacity-80"></div>
        </div>
        
        {/* The moving Thumb */}
        <div
          className={cn(
            "h-7 w-7 rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out relative overflow-hidden",
            isDark ? 'translate-x-[calc(74px-28px-8px)]' : 'translate-x-0'
          )}
        >
          {/* This div slides in to create the crescent shape for the moon */}
          <div className={cn(
              "absolute h-[22px] w-[22px] rounded-full top-1/2 -translate-y-1/2 transition-all duration-300 ease-in-out",
              isDark ? "left-[3px] bg-slate-800" : "-left-full bg-sky-400"
          )}></div>
        </div>
      </button>

      <span
        className={cn(
          "text-sm font-semibold transition-colors duration-300",
          isDark ? "text-foreground" : "text-muted-foreground"
        )}
      >
        Dark
      </span>
    </div>
  )
}
