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

// Report data for assistant messages
export interface MessageReports {
  report_md: string
  csv_exports?: Record<string, string>
}

// Analysis data for assistant messages
export interface MessageAnalysis {
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

// Charts data for assistant messages
export interface MessageCharts {
  [key: string]: string | undefined  // chart_name -> base64 PNG
}

// Client-side message type (matches UI, includes DB fields)
export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: MessageSource[]
  attached_documents?: AttachedDocument[]
  reports?: MessageReports | null
  analysis?: MessageAnalysis | null
  charts?: MessageCharts | null
  created_at: string
  session_id?: string
}

// Custom types
export interface AuthError {
  message: string
  status?: number
}
