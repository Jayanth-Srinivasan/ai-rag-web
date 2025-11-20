"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Paperclip, Loader2, X, FileText } from "lucide-react"
import { toast } from "sonner"
import { parseFiles } from "@/lib/file-parser"
import { validateFiles, formatFileSize, getFileIcon } from "@/lib/file-utils"
import { uploadChatSessionDocument } from "@/app/chat/actions"

interface ChatInputProps {
  sessionId: string
  onSendMessage: (message: string, fileContents?: string[], documentIds?: string[]) => Promise<void>
  isLoading?: boolean
}

export function ChatInput({ sessionId, onSendMessage, isLoading = false }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!message.trim() && selectedFiles.length === 0) || isLoading || isParsing) return

    const messageToSend = message.trim()
    const filesToProcess = selectedFiles

    // Clear inputs immediately for better UX
    setMessage("")
    setSelectedFiles([])
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }

    try {
      let fileContents: string[] | undefined
      let documentIds: string[] = []

      // Parse and upload files if any
      if (filesToProcess.length > 0) {
        setIsParsing(true)

        try {
          // Parse files to extract text content
          fileContents = await parseFiles(filesToProcess)

          // Upload each file to Supabase Storage
          const uploadPromises = filesToProcess.map(async (file, index) => {
            const extractedText = fileContents?.[index] || ''
            return uploadChatSessionDocument(sessionId, file, extractedText)
          })

          const uploadResults = await Promise.allSettled(uploadPromises)

          // Collect successful document IDs
          documentIds = uploadResults
            .filter((result) => result.status === 'fulfilled' && result.value.data)
            .map((result) => (result as PromiseFulfilledResult<any>).value.data.id)

          // Check for upload failures
          const failedCount = uploadResults.length - documentIds.length

          if (failedCount > 0) {
            console.error('Some files failed to upload')
            toast.error(`Failed to upload ${failedCount} of ${filesToProcess.length} file(s)`)
          } else {
            toast.success(`${filesToProcess.length} file(s) uploaded successfully`)
          }
        } catch (error) {
          toast.error("Failed to process files")
          console.error("File processing error:", error)
          // Continue anyway - we'll try to send whatever content we extracted
        } finally {
          setIsParsing(false)
        }
      }

      // Send message with optional file contents and document IDs
      await onSendMessage(messageToSend || "Analyze these documents", fileContents, documentIds)
    } catch (error) {
      toast.error("Failed to send message")
      setMessage(messageToSend)
      setSelectedFiles(filesToProcess)
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
    fileInputRef.current?.click()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    if (files.length === 0) return

    // Validate files
    const validation = validateFiles(files)

    if (!validation.valid) {
      toast.error(validation.errors[0] || "Invalid file(s)")
      return
    }

    // Add to selected files
    setSelectedFiles((prev) => [...prev, ...files])

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.txt,.doc,.docx,.xls,.xlsx,.csv,.md"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Selected files display */}
      {selectedFiles.length > 0 && (
        <div className="px-4 pt-3 pb-2 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg text-sm"
              >
                <span className="text-lg">{getFileIcon(file.name)}</span>
                <span className="text-gray-700 dark:text-gray-300 max-w-[150px] truncate">
                  {file.name}
                </span>
                <span className="text-gray-500 dark:text-gray-500 text-xs">
                  {formatFileSize(file.size)}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  disabled={isLoading || isParsing}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-3 p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={handleAttachment}
          className="shrink-0 h-10 w-10 text-gray-600 dark:text-gray-400"
          disabled={isLoading || isParsing}
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={selectedFiles.length > 0 ? "Add a message (optional)..." : "Ask a question..."}
          className="min-h-11 max-h-[200px] resize-none py-3 px-4 border-gray-200 dark:border-gray-800"
          disabled={isLoading || isParsing}
          rows={1}
        />

        <Button
          type="submit"
          size="icon"
          className="shrink-0 h-10 w-10 bg-black hover:bg-gray-800 text-white"
          disabled={(!message.trim() && selectedFiles.length === 0) || isLoading || isParsing}
        >
          {isLoading || isParsing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </form>
  )
}
