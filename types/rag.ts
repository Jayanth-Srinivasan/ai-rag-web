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
 * CSV exports in reports
 */
export interface CSVExports {
  [key: string]: string  // filename -> CSV content
}

/**
 * Reports section of the response
 */
export interface RAGReports {
  report_md: string
  csv_exports: CSVExports
}

/**
 * Analysis aggregate data
 */
export interface AnalysisAggregate {
  total_cost: number
  by_service: Array<{ service: string; cost: number }>
}

/**
 * Idle resource analysis
 */
export interface IdleResource {
  resource_id: string
  inventory_state: string
  cost: number
}

/**
 * Rightsizing recommendation
 */
export interface RightsizingRecommendation {
  resource_id: string
  instance_type: string
  avg_cpu: number
  recommended_action: string
  estimated_monthly_saving: number
}

/**
 * Analysis section of the response
 */
export interface RAGAnalysis {
  aggregate: AnalysisAggregate
  idle_resources: IdleResource[]
  rightsizing: RightsizingRecommendation[]
  reserved_candidates: unknown[]
}

/**
 * Charts section of the response
 */
export interface RAGCharts {
  top_services_png_base64?: string
  [key: string]: string | undefined  // Allow other chart types
}

/**
 * Response received from the RAG endpoint (FastAPI backend format)
 */
export interface RAGResponse {
  user_id?: string
  session_id?: string
  message: string
  reports?: RAGReports | null
  analysis?: RAGAnalysis | null
  charts?: RAGCharts | null
  // Legacy fields for backwards compatibility
  answer?: string
  sources?: string[]
  index_status?: string
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
