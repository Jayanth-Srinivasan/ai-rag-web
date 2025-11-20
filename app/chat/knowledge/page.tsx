"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DocumentUpload } from "@/components/chat/document-upload"
import {
  FileText,
  Search,
  Trash2,
  Loader2,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { getDocuments, deleteDocument, uploadAndIndexDocument } from "@/app/documents/actions"
import { parseFiles } from "@/lib/file-parser"
import { formatFileSize } from "@/lib/file-utils"
import type { Document } from "@/types/database"

export default function KnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    setIsLoading(true)
    try {
      const result = await getDocuments('knowledge_base')

      if (result.error) {
        toast.error("Failed to load documents")
        return
      }

      setDocuments(result.data || [])
    } catch (error) {
      toast.error("An error occurred while loading documents")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpload = async (files: File[]) => {
    setIsUploading(true)

    try {
      // Parse all files
      const extractedTexts = await parseFiles(files)

      // Upload and index each file
      let successCount = 0
      let failCount = 0

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const extractedText = extractedTexts[i]

        try {
          const result = await uploadAndIndexDocument(file, extractedText)

          if (result.error) {
            console.error(`Failed to upload ${file.name}:`, result.error)
            failCount++
          } else {
            successCount++
          }
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error)
          failCount++
        }
      }

      // Show single summary toast
      if (failCount > 0 && successCount > 0) {
        toast.warning(`Uploaded ${successCount} file(s), ${failCount} failed`)
      } else if (failCount > 0) {
        toast.error(`Failed to upload ${failCount} file(s)`)
      } else {
        toast.success(`Successfully uploaded and indexed ${successCount} file(s)`)
      }

      // Refresh document list
      await fetchDocuments()
    } catch (error) {
      toast.error("An error occurred during file upload")
      console.error("Upload error:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (documentId: string, documentName: string) => {
    if (!confirm(`Are you sure you want to delete "${documentName}"?`)) {
      return
    }

    try {
      const result = await deleteDocument(documentId)

      if (result.error) {
        toast.error("Failed to delete document")
        return
      }

      toast.success("Document deleted successfully")

      // Refresh document list
      await fetchDocuments()
    } catch (error) {
      toast.error("An error occurred while deleting the document")
    }
  }

  const filteredDocuments = documents.filter((doc) =>
    doc.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-black">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-2xl font-semibold text-black dark:text-white mb-6">Knowledge Base</h1>
        <div className="mb-6">
          <DocumentUpload onUpload={handleUpload} />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-gray-200 dark:border-gray-800"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {searchQuery ? "No documents found" : "No documents yet"}
            </p>
            {!searchQuery && (
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Upload documents to build your knowledge base
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-5 w-5 text-gray-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-black dark:text-white truncate">
                      {doc.file_name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatFileSize(doc.file_size)} • {formatDate(doc.created_at)}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  onClick={() => handleDelete(doc.id, doc.file_name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {isUploading && (
        <div className="absolute inset-0 bg-black/20 dark:bg-white/10 flex items-center justify-center">
          <div className="bg-white dark:bg-black p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <Loader2 className="h-8 w-8 animate-spin text-black dark:text-white mx-auto mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Uploading and indexing documents...</p>
          </div>
        </div>
      )}
    </div>
  )
}
