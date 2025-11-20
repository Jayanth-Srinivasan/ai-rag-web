import { MessageSource } from "./database"

/**
 * Request payload sent to the RAG endpoint
 * Includes both frontend fields (user_id, session_id, etc.) for future use
 * and backend-expected fields (question, file_content)
 */
export interface RAGRequest {
  // Frontend fields (for future backend use)
  user_id: string
  session_id: string
  message: string
  timestamp: string
  session_file_content: string[] | null

  // Backend-expected fields (mapped from above)
  question: string          // Mapped from message
  file_content: string[] | null  // Mapped from session_file_content (array of file contents)
}

/**
 * Response received from the RAG endpoint (FastAPI backend format)
 */
export interface RAGResponse {
  answer: string
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
