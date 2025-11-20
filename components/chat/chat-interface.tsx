"use client"

import { useState, useOptimistic, useTransition } from "react"
import { useRouter } from "next/navigation"
import { MessageBubble } from "@/components/chat/message-bubble"
import { ChatInput } from "@/components/chat/chat-input"
import { ChatHeader } from "@/components/chat/chat-header"
import { ShareDialog } from "@/components/chat/share-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Link from "next/link"
import type { Message } from "@/types/database"
import { createMessage, generateAIResponse, updateSessionTitle, deleteSession } from "@/app/chat/actions"

interface ChatInterfaceProps {
  sessionId: string
  initialMessages: Message[]
  initialTitle: string
}

export function ChatInterface({
  sessionId,
  initialMessages,
  initialTitle,
}: ChatInterfaceProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Optimistic messages state
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    initialMessages,
    (state: Message[], newMessage: Message) => [...state, newMessage]
  )

  const [isAIResponding, setIsAIResponding] = useState(false)
  const [chatTitle, setChatTitle] = useState(initialTitle)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)

  const handleSendMessage = async (content: string, fileContents?: string[], documentIds?: string[]) => {
    // Create optimistic user message
    const optimisticUserMessage: Message = {
      id: `optimistic-${Date.now()}`,
      role: "user",
      content,
      created_at: new Date().toISOString(),
      session_id: sessionId,
    }

    // Add to UI immediately (optimistic update)
    startTransition(() => {
      addOptimisticMessage(optimisticUserMessage)
    })

    // Auto-generate title from first message
    if (chatTitle === 'New Chat' && optimisticMessages.length === 0) {
      const newTitle = content.length > 50 ? content.substring(0, 50) + "..." : content
      setChatTitle(newTitle)

      // Update title in background
      updateSessionTitle(sessionId, newTitle).catch(() => {
        toast.error("Failed to update chat title")
      })
    }

    try {
      // Save user message to database with document IDs
      const result = await createMessage(sessionId, 'user', content, undefined, documentIds)

      if (result.error) {
        toast.error("Failed to send message")
        return
      }

      // Refresh to get updated messages with attachments
      router.refresh()

      // Generate AI response using RAG endpoint
      setIsAIResponding(true)
      const aiResult = await generateAIResponse(sessionId, content, fileContents)

      if (aiResult.error) {
        toast.error(aiResult.error)
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.")
    } finally {
      setIsAIResponding(false)
    }
  }

  const handleRename = async () => {
    const newTitle = prompt("Enter new chat title:", chatTitle)

    if (newTitle && newTitle !== chatTitle) {
      setChatTitle(newTitle)

      const result = await updateSessionTitle(sessionId, newTitle)

      if (result.error) {
        toast.error("Failed to rename chat")
        setChatTitle(chatTitle) // Revert on error
      } else {
        toast.success("Chat renamed successfully")
      }
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this chat? This action cannot be undone.")) {
      return
    }

    const result = await deleteSession(sessionId)

    if (result.error) {
      toast.error("Failed to delete chat")
    } else {
      toast.success("Chat deleted successfully")
      router.push('/chat')
      router.refresh()
    }
  }

  const handleShare = () => {
    toast.info("Share feature coming soon!")
    // setShareDialogOpen(true)
  }

  const isLoading = isPending || isAIResponding

  return (
    <>
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        shareCode="TEMP123" // Placeholder for future feature
      />

      <div className="flex h-full flex-col">
        <ChatHeader
          title={chatTitle}
          onRename={handleRename}
          onDelete={handleDelete}
          onShare={handleShare}
        />

        <ScrollArea className="flex-1 px-4 h-0">
          {optimisticMessages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center space-y-4">
                <div className="text-6xl">💬</div>
                <h3 className="text-xl font-semibold">Start a conversation</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Ask a question or start typing below
                </p>
              </div>
            </div>
          ) : (
            <div className="py-4 space-y-4">
              {optimisticMessages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={{
                    id: message.id,
                    role: message.role,
                    content: message.content,
                    sources: message.sources,
                    attached_documents: message.attached_documents,
                    timestamp: new Date(message.created_at),
                  }}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          <ChatInput
            sessionId={sessionId}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </div>
      </div>
    </>
  )
}
