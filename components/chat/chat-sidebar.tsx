"use client";

import { useTransition } from "react";
import { User } from "@supabase/supabase-js";
import { Profile, ChatSession } from "@/types/database";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Database,
  Settings,
  LogOut,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/app/auth/actions";
import { createChatSession } from "@/app/chat/actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type SessionWithDate = ChatSession & {
  updatedAtDate: Date;
};

function groupConversationsByDate(sessions: ChatSession[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const groups: Record<
    "Today" | "Yesterday" | "Previous 7 Days" | "Older",
    SessionWithDate[]
  > = {
    Today: [],
    Yesterday: [],
    "Previous 7 Days": [],
    Older: [],
  };

  sessions.forEach((session) => {
    const sessionWithDate: SessionWithDate = {
      ...session,
      updatedAtDate: new Date(session.updated_at),
    };

    if (sessionWithDate.updatedAtDate >= today) {
      groups.Today.push(sessionWithDate);
    } else if (sessionWithDate.updatedAtDate >= yesterday) {
      groups.Yesterday.push(sessionWithDate);
    } else if (sessionWithDate.updatedAtDate >= sevenDaysAgo) {
      groups["Previous 7 Days"].push(sessionWithDate);
    } else {
      groups.Older.push(sessionWithDate);
    }
  });

  return groups;
}

interface ChatSidebarProps {
  user: User
  profile: Profile | null
  sessions: ChatSession[]
}

export function ChatSidebar({ user, profile, sessions }: ChatSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const groupedConversations = groupConversationsByDate(sessions);

  const handleNewChat = () => {
    startTransition(async () => {
      const result = await createChatSession();
      if (result.error || !result.data) {
        toast.error("Failed to create new chat");
        return;
      }
      router.push(`/chat/${result.data.id}`);
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  // Generate initials from name or email
  const initials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email?.substring(0, 2).toUpperCase() || "U";

  const displayName = profile?.name || user.email || "User";

  return (
      <div className="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black flex flex-col">
        <div className="p-3 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-black dark:bg-white flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-white dark:text-black" />
            </div>
            <span className="font-semibold text-black dark:text-white">
              CloudCost AI
            </span>
          </div>
        </div>
        <div className="p-3">
          <Button
            onClick={handleNewChat}
            disabled={isPending}
            className="w-full justify-center gap-2 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            New Chat
          </Button>
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
              Data Sources
            </Button>
          </Link>
        </div>
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-4 pb-4">
            {Object.entries(groupedConversations).map(([group, convs]) => {
              if (convs.length === 0) return null;

              return (
                <div key={group}>
                  <h3 className="px-2 py-2 text-xs font-medium text-gray-500 dark:text-gray-500">
                    {group}
                  </h3>
                  <div className="space-y-1">
                    {convs.map((conversation: SessionWithDate) => (
                      <Link
                        key={conversation.id}
                        href={`/chat/${conversation.id}`}
                      >
                        <div
                          className={cn(
                            "px-2 py-2 rounded-md cursor-pointer",
                            pathname === `/chat/${conversation.id}`
                              ? "bg-gray-100 dark:bg-gray-900"
                              : "hover:bg-gray-100 dark:hover:bg-gray-900"
                          )}
                        >
                          <p className="text-sm truncate text-black dark:text-white">
                            {conversation.title}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
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
                  <span className="text-xs font-medium">{initials}</span>
                </div>
                <div className="flex flex-col flex-1 text-left min-w-0">
                  <span className="text-sm truncate font-medium">
                    {displayName}
                  </span>
                  {profile?.name && (
                    <span className="text-xs text-gray-500 truncate">
                      {user.email}
                    </span>
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer text-red-600 dark:text-red-400"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
  );
}
