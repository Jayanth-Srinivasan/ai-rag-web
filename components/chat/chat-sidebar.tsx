"use client"

import { useState } from "react"
import { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Database, Settings, LogOut, MessageSquare, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { JoinDialog } from "./join-dialog"

// Mock data for conversations 
const conversations = [
  { id: "1", title: "Machine Learning Basics", updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: "2", title: "Python Best Practices", updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  { id: "3", title: "Database Design Patterns", updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
  { id: "4", title: "React Hooks Deep Dive", updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
  { id: "5", title: "API Design Principles", updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
]

function groupConversationsByDate(conversations: typeof conversations) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  const groups: Record<string, typeof conversations> = {
    Today: [],
    Yesterday: [],
    "Previous 7 Days": [],
    Older: [],
  }

  conversations.forEach((conv) => {
    if (conv.updatedAt >= today) {
      groups.Today.push(conv)
    } else if (conv.updatedAt >= yesterday) {
      groups.Yesterday.push(conv)
    } else if (conv.updatedAt >= sevenDaysAgo) {
      groups["Previous 7 Days"].push(conv)
    } else {
      groups.Older.push(conv)
    }
  })

  return groups
}

export function ChatSidebar({ user }: { user: User }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const groupedConversations = groupConversationsByDate(conversations)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast.success("Signed out successfully")
    router.push("/")
    router.refresh()
  }

  const initials = user.email?.substring(0, 2).toUpperCase() || "U"

  return (
    <>
      <JoinDialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen} />
    <div className="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black flex flex-col">
      <div className="p-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-black dark:bg-white flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-white dark:text-black" />
          </div>
          <span className="font-semibold text-black dark:text-white">RAG Chat</span>
        </div>
      </div>
      <div className="p-3">
        <div className="flex gap-2">
          <Link href="/chat" className="flex-1">
            <Button className="w-full justify-center gap-2 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => setJoinDialogOpen(true)}
            className="flex-1 justify-center gap-2 border-gray-300 dark:border-gray-700"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Join</span>
          </Button>
        </div>
      </div>
      <div className="px-3">
        <div className="border-t border-gray-200 dark:border-gray-800" />
      </div>
      <div className="p-3">
        <Link href="/chat/knowledge">
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start gap-2 border-gray-300 dark:border-gray-700",
              pathname === "/chat/knowledge" && "bg-gray-100 dark:bg-gray-900"
            )}
          >
            <Database className="h-4 w-4" />
            Knowledge Base
          </Button>
        </Link>
      </div>
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-4 pb-4">
          {Object.entries(groupedConversations).map(([group, convs]) => {
            if (convs.length === 0) return null

            return (
              <div key={group}>
                <h3 className="px-2 py-2 text-xs font-medium text-gray-500 dark:text-gray-500">
                  {group}
                </h3>
                <div className="space-y-1">
                  {convs.map((conversation) => (
                    <Link key={conversation.id} href={`/chat/${conversation.id}`}>
                      <div className={cn(
                        "px-2 py-2 rounded-md cursor-pointer",
                        pathname === `/chat/${conversation.id}`
                          ? "bg-gray-100 dark:bg-gray-900"
                          : "hover:bg-gray-100 dark:hover:bg-gray-900"
                      )}>
                        <p className="text-sm truncate text-black dark:text-white">
                          {conversation.title}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
      <div className="border-t border-gray-200 dark:border-gray-800 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                <span className="text-xs font-medium">
                  {initials}
                </span>
              </div>
              <span className="text-sm truncate flex-1 text-left">
                {user.email}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 dark:text-red-400">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
    </>
  )
}
