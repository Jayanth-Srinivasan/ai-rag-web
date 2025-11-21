"use client"

import { useState, useOptimistic, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MessageBubble } from "@/components/chat/message-bubble"
import { ChatInput } from "@/components/chat/chat-input"
import { ChatHeader } from "@/components/chat/chat-header"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Link from "next/link"
import { Upload, Sparkles, Loader2 } from "lucide-react"
import type { Message } from "@/types/database"
import { createMessage, generateAIResponse, updateSessionTitle, deleteSession, deleteMessage, updateMessage } from "@/app/chat/actions"
import { uploadDocument } from "@/app/documents/actions"
import { KBSyncDialog } from "@/components/chat/kb-sync-dialog"

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
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0)
  const [syncToKB, setSyncToKB] = useState<boolean | null>(null)
  const [showKBSyncDialog, setShowKBSyncDialog] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<{ files: File[], extractedTexts: string[] } | null>(null)

  const loadingPhrases = [
    "Thinking...",
    "Imagining...",
    "Forging...",
    "Pondering...",
    "Crafting...",
    "Weaving...",
    "Conjuring...",
    "Brewing...",
    "Musing...",
    "Synthesizing...",
    "Assembling...",
    "Composing...",
    "Distilling...",
    "Reflecting...",
    "Generating...",
  ]

  useEffect(() => {
    if (!isAIResponding) {
      setLoadingPhraseIndex(0)
      return
    }
    const interval = setInterval(() => {
      setLoadingPhraseIndex((prev) => (prev + 1) % loadingPhrases.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [isAIResponding, loadingPhrases.length])

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
      const aiResult = await generateAIResponse(sessionId, content, fileContents, syncToKB === true)

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

  // Handle retry: delete assistant message, resend with retry context
  const handleRetry = async (assistantMessageId: string) => {
    // Find the assistant message and the previous user message
    const messageIndex = optimisticMessages.findIndex(m => m.id === assistantMessageId)
    if (messageIndex <= 0) return

    const userMessage = optimisticMessages[messageIndex - 1]
    if (userMessage.role !== 'user') return

    setIsAIResponding(true)

    try {
      // Delete the assistant message
      const deleteResult = await deleteMessage(sessionId, assistantMessageId)
      if (deleteResult.error) {
        toast.error("Failed to retry message")
        return
      }

      // Refresh to update UI
      router.refresh()

      // Resend with retry context
      const retryPrompt = `[RETRY REQUEST] The user has requested to rethink and provide a better response. Please reconsider the following question and provide an improved answer:\n\n${userMessage.content}`

      const aiResult = await generateAIResponse(sessionId, retryPrompt)
      if (aiResult.error) {
        toast.error(aiResult.error)
      } else {
        router.refresh()
      }
    } catch (error) {
      toast.error("Failed to retry message")
    } finally {
      setIsAIResponding(false)
    }
  }

  // Handle edit: update user message, delete assistant response, regenerate
  const handleEdit = async (userMessageId: string, newContent: string) => {
    // Find the user message and any following assistant message
    const messageIndex = optimisticMessages.findIndex(m => m.id === userMessageId)
    if (messageIndex < 0) return

    setIsAIResponding(true)

    try {
      // Update the user message
      const updateResult = await updateMessage(sessionId, userMessageId, newContent)
      if (updateResult.error) {
        toast.error("Failed to update message")
        return
      }

      // Delete any following assistant message
      if (messageIndex + 1 < optimisticMessages.length) {
        const nextMessage = optimisticMessages[messageIndex + 1]
        if (nextMessage.role === 'assistant') {
          await deleteMessage(sessionId, nextMessage.id)
        }
      }

      // Refresh to update UI
      router.refresh()

      // Generate new AI response
      const aiResult = await generateAIResponse(sessionId, newContent)
      if (aiResult.error) {
        toast.error(aiResult.error)
      } else {
        router.refresh()
      }
    } catch (error) {
      toast.error("Failed to edit message")
    } finally {
      setIsAIResponding(false)
    }
  }

  const isLoading = isPending || isAIResponding

  // Handle first file upload - show KB sync dialog
  const handleFirstFileUpload = (files: File[], extractedTexts: string[]) => {
    if (syncToKB === null) {
      setPendingFiles({ files, extractedTexts })
      setShowKBSyncDialog(true)
    }
  }

  // Handle KB sync preference confirmation
  const handleKBSyncConfirm = async (shouldSync: boolean) => {
    setSyncToKB(shouldSync)

    // If user chose to sync and there are pending files, also upload to KB
    if (shouldSync && pendingFiles) {
      for (let i = 0; i < pendingFiles.files.length; i++) {
        try {
          await uploadDocument(
            pendingFiles.files[i],
            pendingFiles.extractedTexts[i],
            'knowledge_base'
          )
        } catch (error) {
          console.error('Failed to sync file to KB:', error)
        }
      }
      toast.success("Documents also saved to Knowledge Base")
    }

    setPendingFiles(null)
  }

  // Handle KB sync toggle from header
  const handleKBSyncToggle = (enabled: boolean) => {
    setSyncToKB(enabled)
    if (!enabled) {
      toast.info("Further documents will not be added to Knowledge Base")
    } else {
      toast.success("Documents will be synced to Knowledge Base")
    }
  }

  return (
    <>
      <KBSyncDialog
        open={showKBSyncDialog}
        onOpenChange={setShowKBSyncDialog}
        onConfirm={handleKBSyncConfirm}
      />
      <div className="flex h-full flex-col">
        <ChatHeader
          title={chatTitle}
          onRename={handleRename}
          onDelete={handleDelete}
          syncToKB={syncToKB}
          onSyncToggle={handleKBSyncToggle}
        />

        <ScrollArea className="flex-1 px-4 h-0">
          {optimisticMessages.length === 0 ? (
            <div className="flex h-full items-center justify-center py-12">
              <div className="max-w-xl w-full space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-900 mb-2">
                    <Sparkles className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-black dark:text-white">Start a conversation</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Ask questions about your documents and get intelligent answers
                  </p>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-500 text-center">Try asking:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      "Summarize the main points from my documents",
                      "What are the key findings in the research?",
                      "Explain the methodology used",
                      "Compare the different approaches discussed"
                    ].map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(prompt)}
                        disabled={isLoading}
                        className="p-3 text-left border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <p className="text-sm text-gray-700 dark:text-gray-300">{prompt}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-center pt-2">
                  <Link href="/chat/knowledge">
                    <Button variant="outline" className="gap-2 border-gray-300 dark:border-gray-700">
                      <Upload className="h-4 w-4" />
                      Upload Documents
                    </Button>
                  </Link>
                </div>
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
                  onRetry={handleRetry}
                  onEdit={handleEdit}
                  isLoading={isLoading}
                />
              ))}
              {isAIResponding && (
                <div className="flex gap-3 animate-in fade-in duration-300">
                  <div className="flex-1 max-w-[85%]">
                    <div className="px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-900 text-black dark:text-white">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400 transition-opacity duration-300">
                          {loadingPhrases[loadingPhraseIndex]}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          <ChatInput
            sessionId={sessionId}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            syncToKB={syncToKB}
            onFirstFileUpload={syncToKB === null ? handleFirstFileUpload : undefined}
          />
        </div>
      </div>
    </>
  )
}
