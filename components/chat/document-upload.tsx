"use client"

import { useCallback, useState } from "react"
import { Card } from "@/components/ui/card"
import { Upload, FileText, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface DocumentUploadProps {
  onUpload?: (files: File[]) => Promise<void>
}

export function DocumentUpload({ onUpload }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type === "application/pdf" ||
      file.type === "text/plain" ||
      file.type === "application/msword" ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files])
    } else {
      toast.error("Please upload PDF, TXT, or DOC files only")
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles((prev) => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    setIsUploading(true)
    try {
      if (onUpload) {
        await onUpload(selectedFiles)
      } else {
        // Simulate upload
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
      setSelectedFiles([])
    } catch (error) {
      toast.error("Failed to upload files")
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
  }

  return (
    <div className="space-y-4">
      <Card
        className={cn(
          "relative border-2 border-dashed transition-colors",
          isDragging
            ? "border-blue-600 bg-blue-50 dark:bg-blue-950/20"
            : "border-border/50 hover:border-border"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="p-12 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-black dark:bg-white mb-4">
              <Upload className="h-8 w-8 text-white dark:text-black" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {isDragging ? "Drop files here" : "Upload Documents"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Supported formats: PDF, TXT, DOC, DOCX (Max 10MB)
            </p>
          </div>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.txt,.doc,.docx"
            onChange={handleFileSelect}
          />
        </label>
      </Card>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Selected Files ({selectedFiles.length})</h4>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <Card key={index} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeFile(index)}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black font-medium"
          >
            {isUploading ? "Uploading..." : `Upload ${selectedFiles.length} File(s)`}
          </Button>
        </div>
      )}
    </div>
  )
}
