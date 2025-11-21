// Types for RAG API

/**
 * Request payload sent to the RAG endpoint
 * Matches the backend API specification exactly
 */
export interface RAGRequest {
  user_id: string                    // Required: Unique identifier for the user
  session_id: string                 // Required: Unique identifier for the chat session
  file_contents?: string[]           // Optional: Array of document text content to index
  question?: string                  // Optional: The question to ask about the indexed documents
  index_user?: boolean               // Optional: If true, also indexes to user's persistent KB (default: false)
}

/**
 * Response received from the RAG endpoint (FastAPI backend format)
 */
export interface RAGResponse {
  user_id: string
  session_id: string
  message: string  // Always markdown formatted
  reports?: RAGReports | null
  analysis?: RAGAnalysis | null
  charts?: RAGCharts | null
}

/**
 * Reports section of RAG response
 */
export interface RAGReports {
  report_md: string  // Markdown report content
  csv_exports?: Record<string, string>  // filename -> CSV content
}

/**
 * Analysis section of RAG response
 */
export interface RAGAnalysis {
  aggregate?: {
    total_cost: number
    by_service: Array<{ service: string; cost: number }>
  }
  idle_resources?: Array<{
    resource_id: string
    inventory_state: string
    cost: number
  }>
  rightsizing?: Array<{
    resource_id: string
    instance_type: string
    avg_cpu: number
    recommended_action: string
    estimated_monthly_saving: number
  }>
  reserved_candidates?: Array<Record<string, unknown>>
}

/**
 * Charts section of RAG response
 */
export interface RAGCharts {
  top_services_png_base64?: string
  [key: string]: string | undefined  // Allow additional chart keys
}

/**
 * Error response from RAG endpoint
 */
export interface RAGError {
  error: string
  details?: string
}

/**
 * Request payload for KB user upload endpoint
 */
export interface UserKBUploadRequest {
  user_id: string
  file_contents: string[]
}

/**
 * Response from KB user upload endpoint
 */
export interface UserKBUploadResponse {
  user_id: string
  status: string
  detail: Array<{ mock?: boolean; [key: string]: unknown }>
}
