"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"

export function WelcomeToast({ userName }: { userName: string }) {
  const searchParams = useSearchParams()
  const hasShownToast = useRef(false)

  useEffect(() => {
    // Check if this is a fresh login (coming from auth callback or login)
    const fromAuth = searchParams.get('from') === 'auth'
    const isNewSession = !hasShownToast.current && !sessionStorage.getItem('welcome_shown')

    if ((fromAuth || isNewSession) && !hasShownToast.current) {
      // Small delay to ensure page is loaded
      setTimeout(() => {
        toast.success(`Welcome back, ${userName}!`, {
          duration: 3000,
        })
        hasShownToast.current = true
        sessionStorage.setItem('welcome_shown', 'true')
      }, 300)
    }
  }, [searchParams, userName])

  return null
}
