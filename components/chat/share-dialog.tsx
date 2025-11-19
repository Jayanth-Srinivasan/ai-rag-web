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
import { Copy, Check } from "lucide-react"
import { toast } from "sonner"

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shareCode: string
}

export function ShareDialog({ open, onOpenChange, shareCode }: ShareDialogProps) {
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const shareLink = `${window.location.origin}/chat/join?code=${shareCode}`

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(shareCode)
      setCopiedCode(true)
      toast.success("Code copied to clipboard")
      setTimeout(() => setCopiedCode(false), 2000)
    } catch (error) {
      toast.error("Failed to copy code")
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopiedLink(true)
      toast.success("Link copied to clipboard")
      setTimeout(() => setCopiedLink(false), 2000)
    } catch (error) {
      toast.error("Failed to copy link")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this conversation</DialogTitle>
          <DialogDescription>
            Share this code with others to collaborate on this chat
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Share Code
            </label>
            <div className="flex gap-2">
              <Input
                value={shareCode}
                readOnly
                className="font-mono text-lg text-center tracking-wider"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopyCode}
                className="flex-shrink-0"
              >
                {copiedCode ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
