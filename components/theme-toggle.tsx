"use client"

import { Moon, Sun } from "lucide-react"
import { useEffect, useState, useRef, useSyncExternalStore } from "react"
import { Button } from "@/components/ui/button"

// Use useSyncExternalStore for proper SSR hydration
function getThemeSnapshot(): "light" | "dark" {
  if (typeof window === "undefined") return "light"
  const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
  return savedTheme || (prefersDark ? "dark" : "light")
}

function getServerSnapshot(): "light" | "dark" {
  return "light"
}

function subscribe(callback: () => void): () => void {
  // Listen for storage changes and media query changes
  window.addEventListener("storage", callback)
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
  mediaQuery.addEventListener("change", callback)
  return () => {
    window.removeEventListener("storage", callback)
    mediaQuery.removeEventListener("change", callback)
  }
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, getServerSnapshot)
  const [mounted, setMounted] = useState(false)
  const didMount = useRef(false)

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true
      document.documentElement.classList.toggle("dark", theme === "dark")
      // Use microtask to avoid synchronous setState in effect
      queueMicrotask(() => setMounted(true))
    }
  }, [theme])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
    // Trigger re-render by dispatching storage event
    window.dispatchEvent(new Event("storage"))
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        aria-label="Toggle theme"
        disabled
      >
        <Moon className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9"
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  )
}
