import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FileText, RefreshCw, Pencil, Copy, Check, X, Download, BarChart3, AlertTriangle, TrendingDown } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import ReactMarkdown from "react-markdown"
import { RAGReports, RAGAnalysis, RAGCharts } from "@/types/rag"

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
  reports?: RAGReports | null
  analysis?: RAGAnalysis | null
  charts?: RAGCharts | null
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

  const downloadCSV = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success(`Downloaded ${filename}`)
  }

  const downloadReportAsPDF = () => {
    if (!message.reports?.report_md) return
    // For now, download as markdown - PDF would require additional library
    const blob = new Blob([message.reports.report_md], { type: 'text/markdown;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'cost-optimization-report.md'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Downloaded report')
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

        {/* Charts Display */}
        {!isUser && message.charts && (
          <div className="mt-3 space-y-2">
            {Object.entries(message.charts).map(([key, base64]) => {
              if (!base64) return null
              return (
                <div key={key} className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="bg-gray-50 dark:bg-gray-800 px-3 py-1.5 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {key.replace(/_/g, ' ').replace('png base64', '').trim()}
                    </span>
                  </div>
                  <img
                    src={`data:image/png;base64,${base64}`}
                    alt={key}
                    className="w-full max-w-md"
                  />
                </div>
              )
            })}
          </div>
        )}

        {/* Analysis Highlights */}
        {!isUser && message.analysis && (
          <div className="mt-3 space-y-2">
            {/* Total Cost Summary */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                Total Monthly Cost: ${message.analysis.aggregate.total_cost.toFixed(2)}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {message.analysis.aggregate.by_service.map((svc, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {svc.service}: ${svc.cost.toFixed(2)}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Idle Resources Warning */}
            {message.analysis.idle_resources.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4" />
                  Idle Resources Detected
                </div>
                <div className="mt-2 space-y-1">
                  {message.analysis.idle_resources.map((res, idx) => (
                    <div key={idx} className="text-xs text-amber-700 dark:text-amber-400">
                      <span className="font-mono">{res.resource_id}</span>: ${res.cost}/month ({res.inventory_state})
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rightsizing Recommendations */}
            {message.analysis.rightsizing.length > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-green-800 dark:text-green-300">
                  <TrendingDown className="h-4 w-4" />
                  Rightsizing Opportunities
                </div>
                <div className="mt-2 space-y-1">
                  {message.analysis.rightsizing.map((rec, idx) => (
                    <div key={idx} className="text-xs text-green-700 dark:text-green-400">
                      <span className="font-mono">{rec.resource_id}</span> ({rec.instance_type}, {rec.avg_cpu}% CPU):
                      Save ${rec.estimated_monthly_saving.toFixed(2)}/month
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reports Download Section */}
        {!isUser && message.reports && (
          <div className="mt-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Available Downloads
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={downloadReportAsPDF}
              >
                <Download className="h-3 w-3 mr-1" />
                Full Report (.md)
              </Button>
              {message.reports.csv_exports && Object.entries(message.reports.csv_exports).map(([filename, content]) => (
                <Button
                  key={filename}
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => downloadCSV(filename, content)}
                >
                  <Download className="h-3 w-3 mr-1" />
                  {filename}
                </Button>
              ))}
            </div>
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
