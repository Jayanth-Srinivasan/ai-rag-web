import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FileText, RefreshCw, Pencil, Copy, Check, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import ReactMarkdown from "react-markdown"

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
  onRetry?: (messageId: string) => void
  onEdit?: (messageId: string, newContent: string) => void
  isLoading?: boolean
}

export function MessageBubble({ message, onRetry, onEdit, isLoading }: MessageBubbleProps) {
  const isUser = message.role === "user"
  const [showTimestamp, setShowTimestamp] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)

  const handleDoubleClick = () => {
    setShowTimestamp(!showTimestamp)
  }

  const handleRetry = () => {
    if (onRetry) {
      onRetry(message.id)
    }
  }

  const handleStartEdit = () => {
    setEditContent(message.content)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditContent(message.content)
  }

  const handleSubmitEdit = () => {
    if (onEdit && editContent.trim() && editContent !== message.content) {
      onEdit(message.id, editContent.trim())
    }
    setIsEditing(false)
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
        {!isEditing && (
          <div className={cn(
            "absolute -top-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150",
            isUser ? "-left-8" : "-right-14"
          )}>
            {isUser ? (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={handleStartEdit}
                disabled={isLoading}
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
                  disabled={isLoading}
                >
                  <RefreshCw className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                </Button>
              </div>
            )}
          </div>
        )}

        {isUser && message.attached_documents && message.attached_documents.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {message.attached_documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700"
              >
                <FileText className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
                  {doc.file_name}
                </span>
              </div>
            ))}
          </div>
        )}

        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[60px] text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSubmitEdit} disabled={!editContent.trim()}>
                <Check className="h-4 w-4 mr-1" /> Save & Send
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "px-3 py-2 rounded-lg text-sm cursor-pointer select-none",
              isUser
                ? "bg-black dark:bg-white text-white dark:text-black"
                : "bg-gray-100 dark:bg-gray-900 text-black dark:text-white"
            )}
            onDoubleClick={handleDoubleClick}
          >
            {isUser ? (
              <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-pre:my-2 prose-code:text-xs prose-code:bg-gray-200 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            )}
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
