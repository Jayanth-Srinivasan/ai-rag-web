"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { MoreHorizontal, Trash2, PenSquare, Database } from "lucide-react"

interface ChatHeaderProps {
  title?: string
  onRename?: () => void
  onDelete?: () => void
  syncToKB?: boolean | null
  onSyncToggle?: (enabled: boolean) => void
}

export function ChatHeader({ title, onRename, onDelete, syncToKB, onSyncToggle }: ChatHeaderProps) {
  return (
    <header className="h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black flex items-center justify-between px-6">
      <div className="flex-1 min-w-0 mr-4">
        <h1 className="text-sm font-medium text-black dark:text-white overflow-hidden text-ellipsis whitespace-nowrap">
          {title || "New Chat"}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-600 dark:text-gray-400 shrink-0"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {title && (
              <>
                <DropdownMenuItem onClick={onRename} className="cursor-pointer">
                  <PenSquare className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {syncToKB !== null && onSyncToggle && (
              <>
                <div className="flex items-center justify-between px-2 py-2">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Sync to KB</span>
                  </div>
                  <Switch
                    checked={syncToKB === true}
                    onCheckedChange={onSyncToggle}
                  />
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={onDelete} className="cursor-pointer text-red-600 dark:text-red-400">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
