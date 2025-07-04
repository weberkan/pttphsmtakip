"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
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

  if (!isMounted) {
    return <div className="h-8 w-14 rounded-full bg-muted/50" /> // Placeholder to prevent layout shift
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        theme === 'light' || theme === 'system' ? 'bg-sky-300' : 'bg-slate-800'
      )}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <span className="sr-only">Toggle theme</span>
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-white shadow-lg ring-0 transition-transform duration-300 ease-in-out",
          theme === 'dark' ? "translate-x-7" : "translate-x-1"
        )}
      >
        <Sun className={cn(
          "h-4 w-4 text-yellow-500 transition-opacity duration-300",
          theme === 'dark' ? 'opacity-0' : 'opacity-100'
        )} />
        <Moon className={cn(
          "absolute h-4 w-4 text-slate-400 transition-opacity duration-300",
           theme === 'dark' ? 'opacity-100' : 'opacity-0'
        )} />
      </span>
    </button>
  )
}
