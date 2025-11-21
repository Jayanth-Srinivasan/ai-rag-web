import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"

export function Navigation() {
  return (
    <nav className="fixed top-0 w-full z-50 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-black/95 backdrop-blur supports-backdrop-filter:bg-white/90 dark:supports-backdrop-filter:bg-black/90">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <div className="h-8 w-8 rounded-lg bg-black dark:bg-white flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-white dark:text-black" />
          </div>
          <span className="text-black dark:text-white">
            CloudCost AI
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/auth">
            <Button variant="ghost" className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white">Sign In</Button>
          </Link>
          <Link href="/auth">
            <Button className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black font-medium">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}
