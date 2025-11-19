"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LogIn } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface JoinDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function JoinDialog({ open, onOpenChange }: JoinDialogProps) {
  const [code, setCode] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const router = useRouter()

  const handleJoin = async () => {
    const trimmedCode = code.trim().toUpperCase()

    if (!trimmedCode) {
      toast.error("Please enter a code")
      return
    }

    if (trimmedCode.length < 6 || trimmedCode.length > 8) {
      toast.error("Invalid code format")
      return
    }

    setIsJoining(true)

    // TODO: Validate code with backend
    // For now, just simulate validation
    setTimeout(() => {
      setIsJoining(false)
      toast.success("Joined conversation successfully!")
      onOpenChange(false)
      setCode("")
      // TODO: Navigate to the shared conversation
      // router.push(`/chat/${trimmedCode}`)
    }, 1000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleJoin()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join a conversation</DialogTitle>
          <DialogDescription>
            Enter the share code to join a collaborative chat
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Share Code
            </label>
            <Input
              placeholder="Enter code (e.g., XY4K2P)"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              className="font-mono text-lg text-center tracking-wider uppercase"
              maxLength={8}
            />
          </div>

          <Button
            onClick={handleJoin}
            disabled={isJoining || !code.trim()}
            className="w-full bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black"
          >
            {isJoining ? (
              "Joining..."
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Join Conversation
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
