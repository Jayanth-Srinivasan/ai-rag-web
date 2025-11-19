"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DocumentUpload } from "@/components/chat/document-upload"
import {
  FileText,
  Search,
  Trash2,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

// Mock data - replace with actual data from your backend
const documents = [
  {
    id: "1",
    name: "Machine Learning Fundamentals.pdf",
    size: "2.4 MB",
    uploadedAt: "2025-01-15",
  },
  {
    id: "2",
    name: "Python Best Practices.pdf",
    size: "1.8 MB",
    uploadedAt: "2025-01-14",
  },
  {
    id: "3",
    name: "Database Design Patterns.pdf",
    size: "3.2 MB",
    uploadedAt: "2025-01-12",
  },
]

export default function KnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-full flex flex-col bg-white dark:bg-black">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-2xl font-semibold text-black dark:text-white mb-6">Knowledge Base</h1>
        <div className="mb-6">
          <DocumentUpload />
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
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery ? "No documents found" : "No documents yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-black dark:text-white truncate">
                      {doc.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {doc.size} • {doc.uploadedAt}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
