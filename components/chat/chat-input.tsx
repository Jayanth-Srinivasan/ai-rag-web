"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Paperclip, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>
  isLoading?: boolean
}

export function ChatInput({ onSendMessage, isLoading = false }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || isLoading) return

    const messageToSend = message.trim()
    setMessage("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }

    try {
      await onSendMessage(messageToSend)
    } catch (error) {
      toast.error("Failed to send message")
      setMessage(messageToSend) 
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }

  const handleAttachment = () => {
    toast.info("File attachment coming soon")
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-end gap-3 p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={handleAttachment}
          className="flex-shrink-0 h-10 w-10 text-gray-600 dark:text-gray-400"
          disabled={isLoading}
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question..."
          className="min-h-11 max-h-[200px] resize-none py-3 px-4 border-gray-200 dark:border-gray-800"
          disabled={isLoading}
          rows={1}
        />

        <Button
          type="submit"
          size="icon"
          className="shrink-0 h-10 w-10 bg-black hover:bg-gray-800 text-white"
          disabled={!message.trim() || isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </form>
  )
}
