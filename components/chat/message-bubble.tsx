import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, RefreshCw, Pencil, Copy, Paperclip } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: Array<{
    title: string
    page?: number
  }>
  attached_documents?: Array<{
    id: string
    file_name: string
    file_type: string
    file_size: number
  }>
  timestamp: Date
}

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user"
  const [showTimestamp, setShowTimestamp] = useState(false)

  const handleDoubleClick = () => {
    setShowTimestamp(!showTimestamp)
  }

  const handleRetry = () => {
    // TODO: Implement retry logic
    toast.info('Retry feature coming soon!')
  }

  const handleEdit = () => {
    // TODO: Implement edit logic
    toast.info('Edit feature coming soon!')
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      toast.success('Copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className={cn("mb-2 group", isUser && "flex justify-end")}>
      <div className={cn("relative", isUser ? "max-w-[85%]" : "max-w-[85%]")}>
        <div className={cn(
          "absolute -top-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150",
          isUser ? "-left-8" : "-right-14"
        )}>
          {isUser ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700"
              onClick={handleEdit}
            >
              <Pencil className="h-3 w-3 text-gray-600 dark:text-gray-400" />
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={handleCopy}
              >
                <Copy className="h-3 w-3 text-gray-600 dark:text-gray-400" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={handleRetry}
              >
                <RefreshCw className="h-3 w-3 text-gray-600 dark:text-gray-400" />
              </Button>
            </div>
          )}
        </div>

        <div
          className={cn(
            "px-3 py-2 rounded-lg text-sm cursor-pointer select-none",
            isUser
              ? "bg-black dark:bg-white text-white dark:text-black"
              : "bg-gray-100 dark:bg-gray-900 text-black dark:text-white"
          )}
          onDoubleClick={handleDoubleClick}
        >
          <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>

        {isUser && message.attached_documents && message.attached_documents.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {message.attached_documents.map((doc) => (
              <Badge
                key={doc.id}
                variant="outline"
                className="text-xs flex items-center gap-1 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
              >
                <Paperclip className="h-3 w-3" />
                <span className="max-w-[150px] truncate">{doc.file_name}</span>
              </Badge>
            ))}
          </div>
        )}

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {message.sources.map((source, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="text-xs flex items-center gap-1 bg-gray-200 dark:bg-gray-800 text-black dark:text-white"
              >
                <FileText className="h-3 w-3" />
                {source.title}
                {source.page && ` (p. ${source.page})`}
              </Badge>
            ))}
          </div>
        )}
        {showTimestamp && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  )
}
