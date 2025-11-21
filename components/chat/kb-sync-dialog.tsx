"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Database } from "lucide-react"

interface KBSyncDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (syncToKB: boolean) => void
}

export function KBSyncDialog({ open, onOpenChange, onConfirm }: KBSyncDialogProps) {
  const handleYes = () => {
    onConfirm(true)
    onOpenChange(false)
  }

  const handleNo = () => {
    onConfirm(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
              <Database className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
            <DialogTitle>Sync to Knowledge Base?</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            Would you like documents uploaded in this chat to also be saved to your Knowledge Base?
            This makes them available across all your chats.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleNo}>
            No, just this chat
          </Button>
          <Button onClick={handleYes}>
            Yes, sync to KB
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
