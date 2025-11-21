import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FileText, RefreshCw, Pencil, Copy, Check, X, Download, BarChart3, AlertTriangle, TrendingDown } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import ReactMarkdown from "react-markdown"
import type { MessageReports, MessageAnalysis, MessageCharts } from "@/types/database"

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
  reports?: MessageReports | null
  analysis?: MessageAnalysis | null
  charts?: MessageCharts | null
  timestamp: Date
}

interface MessageBubbleProps {
  message: Message
  onRetry?: (messageId: string) => void
  onEdit?: (messageId: string, newContent: string) => void
  isLoading?: boolean
}

// Helper to download CSV
function downloadCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

// Chart display component
function ChartDisplay({ charts }: { charts: MessageCharts }) {
  const chartEntries = Object.entries(charts).filter(([_, value]) => value)

  if (chartEntries.length === 0) return null

  return (
    <div className="mt-3 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        <BarChart3 className="h-4 w-4" />
        Charts
      </div>
      <div className="grid gap-3">
        {chartEntries.map(([key, base64]) => (
          <div key={key} className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
            <img
              src={`data:image/png;base64,${base64}`}
              alt={key.replace(/_/g, ' ')}
              className="w-full max-w-md"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// Analysis highlights component
function AnalysisHighlights({ analysis }: { analysis: MessageAnalysis }) {
  return (
    <div className="mt-3 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        <TrendingDown className="h-4 w-4" />
        Analysis Highlights
      </div>

      {/* Aggregate costs */}
      {analysis.aggregate && (
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Total Cost: ${analysis.aggregate.total_cost.toFixed(2)}
          </div>
          <div className="mt-1 flex flex-wrap gap-2">
            {analysis.aggregate.by_service.map((s, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {s.service}: ${s.cost.toFixed(2)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Idle resources */}
      {analysis.idle_resources && analysis.idle_resources.length > 0 && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4" />
            Idle Resources ({analysis.idle_resources.length})
          </div>
          <div className="mt-2 space-y-1">
            {analysis.idle_resources.map((r, i) => (
              <div key={i} className="text-xs text-amber-700 dark:text-amber-300">
                {r.resource_id} - ${r.cost}/month ({r.inventory_state})
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rightsizing recommendations */}
      {analysis.rightsizing && analysis.rightsizing.length > 0 && (
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="text-sm font-medium text-green-800 dark:text-green-200">
            Rightsizing Opportunities
          </div>
          <div className="mt-2 space-y-1">
            {analysis.rightsizing.map((r, i) => (
              <div key={i} className="text-xs text-green-700 dark:text-green-300">
                {r.resource_id} ({r.instance_type}) - Save ${r.estimated_monthly_saving.toFixed(2)}/month
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Reports download component
function ReportsSection({ reports }: { reports: MessageReports }) {
  const csvFiles = reports.csv_exports ? Object.entries(reports.csv_exports) : []

  return (
    <div className="mt-3 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        <FileText className="h-4 w-4" />
        Reports & Downloads
      </div>

      {csvFiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {csvFiles.map(([filename, content]) => (
            <Button
              key={filename}
              variant="outline"
              size="sm"
              className="text-xs gap-1"
              onClick={() => {
                downloadCSV(filename, content)
                toast.success(`Downloaded ${filename}`)
              }}
            >
              <Download className="h-3 w-3" />
              {filename}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
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

        {/* Charts section for assistant messages */}
        {!isUser && message.charts && <ChartDisplay charts={message.charts} />}

        {/* Analysis highlights for assistant messages */}
        {!isUser && message.analysis && <AnalysisHighlights analysis={message.analysis} />}

        {/* Reports/Downloads for assistant messages */}
        {!isUser && message.reports && <ReportsSection reports={message.reports} />}

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
