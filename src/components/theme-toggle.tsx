
"use client"

import * as React from "react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <div className="h-10 w-20" /> // Placeholder for server render to avoid layout shift
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle-switch relative h-10 w-20 cursor-pointer rounded-full p-1 transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <div className="toggle-thumb absolute flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-300 ease-in-out">
        <svg className="sun-icon h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
        </svg>
        <svg className="moon-icon h-5 w-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
        </svg>
      </div>
      
      <div className="cloud-1 cloud absolute top-2 h-3 w-5 rounded-full bg-white/80 opacity-0 shadow-sm transition-all duration-500 ease-in-out"></div>
      <div className="cloud-2 cloud absolute top-5 left-10 h-2 w-4 rounded-full bg-white/80 opacity-0 shadow-sm transition-all duration-500 ease-in-out"></div>
      
      <div className="star star-1 absolute top-2 right-4 h-0.5 w-0.5 rounded-full bg-slate-400 opacity-0 shadow-sm transition-all duration-500 ease-in-out"></div>
      <div className="star star-2 absolute top-6 right-8 h-0.5 w-0.5 rounded-full bg-slate-400 opacity-0 shadow-sm transition-all duration-500 ease-in-out"></div>
      <div className="star star-3 absolute top-3 right-12 h-0.5 w-0.5 rounded-full bg-slate-400 opacity-0 shadow-sm transition-all duration-500 ease-in-out"></div>

    </button>
  )
}
