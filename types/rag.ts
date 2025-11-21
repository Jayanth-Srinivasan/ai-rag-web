import { MessageSource } from "./database"

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
  detail: any[]
}
