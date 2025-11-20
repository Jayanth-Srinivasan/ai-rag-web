import { Database } from './supabase'

// Export the Database type for use with Supabase client
export type { Database }

// Profile types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

// Chat Session types
export type ChatSession = Database['public']['Tables']['chat_sessions']['Row']
export type ChatSessionInsert = Database['public']['Tables']['chat_sessions']['Insert']
export type ChatSessionUpdate = Database['public']['Tables']['chat_sessions']['Update']

// Chat Message types
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row']
export type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert']
export type ChatMessageUpdate = Database['public']['Tables']['chat_messages']['Update']

// Document types
export type Document = Database['public']['Tables']['documents']['Row']
export type DocumentInsert = Database['public']['Tables']['documents']['Insert']
export type DocumentUpdate = Database['public']['Tables']['documents']['Update']

// Message source type (for document references)
export interface MessageSource {
  title: string
  page?: number
}

// Attached document type (for user-uploaded files)
export interface AttachedDocument {
  id: string
  file_name: string
  file_type: string
  file_size: number
  file_path: string
}

// Client-side message type (matches UI, includes DB fields)
export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: MessageSource[]
  attached_documents?: AttachedDocument[]
  created_at: string
  session_id?: string
}

// Custom types
export interface AuthError {
  message: string
  status?: number
}
