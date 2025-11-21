"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { createChatSession, createMessage, generateAIResponse, updateSessionTitle } from "./actions"
import { toast } from "sonner"
import Link from "next/link"

export default function ChatPage() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)

  const handleStartNewChat = async () => {
    setIsCreating(true)

    try {
      const result = await createChatSession()

      if (result.error) {
        toast.error("Failed to create new chat")
        return
      }

      if (result.data) {
        router.push(`/chat/${result.data.id}`)
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  const handleExamplePrompt = async (prompt: string) => {
    setIsCreating(true)

    try {
      // Create session with the prompt as title
      const title = prompt.length > 50 ? prompt.substring(0, 50) + "..." : prompt
      const sessionResult = await createChatSession(title)

      if (sessionResult.error || !sessionResult.data) {
        toast.error("Failed to create new chat")
        return
      }

      // Send the example prompt as first message
      await createMessage(sessionResult.data.id, 'user', prompt)

      // Redirect to the new chat session immediately
      router.push(`/chat/${sessionResult.data.id}`)

      // Generate AI response in background (will be visible when page loads)
      generateAIResponse(sessionResult.data.id, prompt).catch(() => {
        toast.error("Failed to generate response")
      })
    } catch (error) {
      toast.error("An error occurred. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  const examplePrompts = [
    "Summarize the main points from my documents",
    "What are the key findings in the research?",
    "Explain the methodology used",
    "Compare the different approaches discussed",
  ]

  return (
    <div className="h-full flex items-center justify-center p-8 bg-white dark:bg-black">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-semibold text-black dark:text-white">
            Start a conversation
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Ask questions about your documents and get intelligent answers
          </p>
        </div>
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-500 text-center">
            Try asking:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {examplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleExamplePrompt(prompt)}
                disabled={isCreating}
                className="p-4 text-left border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <p className="text-sm text-gray-700 dark:text-gray-300">{prompt}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 pt-4">
          <Button
            onClick={handleStartNewChat}
            disabled={isCreating}
            className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
          <Link href="/chat/knowledge">
            <Button
              variant="outline"
              className="border-gray-300 dark:border-gray-700"
            >
              Upload Documents
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
