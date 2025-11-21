'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { MessageSource } from '@/types/database'
import { callRAGEndpoint } from '@/lib/rag-service'
import { uploadDocument } from '@/app/documents/actions'

// ============================================================================
// Chat Session Actions
// ============================================================================

/**
 * Create a new chat session
 * Returns the new session ID
 */
export async function createChatSession(title: string = 'New Chat') {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({
      user_id: user.id,
      title,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create chat session:', error)
    return { error: error.message }
  }

  return { data }
}

/**
 * Get all chat sessions for the current user
 * Ordered by most recently updated
 */
export async function getChatSessions() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated', data: null }
  }

  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch chat sessions:', error)
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

/**
 * Get a single chat session by ID
 */
export async function getChatSession(sessionId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated', data: null }
  }

  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('Failed to fetch chat session:', error)
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

/**
 * Update chat session title
 */
export async function updateSessionTitle(sessionId: string, title: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('chat_sessions')
    .update({ title })
    .eq('id', sessionId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Failed to update session title:', error)
    return { error: error.message }
  }

  revalidatePath('/chat')
  revalidatePath(`/chat/${sessionId}`)

  return { success: true }
}

/**
 * Delete a chat session (cascade deletes all messages)
 */
export async function deleteSession(sessionId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Failed to delete session:', error)
    return { error: error.message }
  }

  revalidatePath('/chat')

  return { success: true }
}

// ============================================================================
// Chat Message Actions
// ============================================================================

/**
 * Get all messages for a chat session
 * Ordered chronologically
 * Includes attached document metadata for messages with file attachments
 */
export async function getMessages(sessionId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated', data: null }
  }

  // First verify user owns this session
  const { data: session } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) {
    return { error: 'Session not found or unauthorized', data: null }
  }

  const { data: messages, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to fetch messages:', error)
    return { error: error.message, data: null }
  }

  // Fetch document metadata for messages with attachments
  const messagesWithDocs = await Promise.all(
    messages.map(async (message) => {
      if (!message.attached_document_ids || message.attached_document_ids.length === 0) {
        return message
      }

      // Fetch document metadata for this message's attachments
      const { data: documents } = await supabase
        .from('documents')
        .select('id, file_name, file_type, file_size, file_path')
        .in('id', message.attached_document_ids)

      return {
        ...message,
        attached_documents: documents || [],
      }
    })
  )

  return { data: messagesWithDocs, error: null }
}

/**
 * Create a new message in a chat session
 */
export async function createMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
  sources?: MessageSource[],
  documentIds?: string[]
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated', data: null }
  }

  // First verify user owns this session
  const { data: session } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) {
    return { error: 'Session not found or unauthorized', data: null }
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      session_id: sessionId,
      role,
      content,
      sources: sources as never, // JSONB type
      attached_document_ids: documentIds || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create message:', error)
    return { error: error.message, data: null }
  }

  // Trigger will automatically update session's updated_at
  revalidatePath(`/chat/${sessionId}`)
  revalidatePath('/chat')

  return { data, error: null }
}

/**
 * Delete a message from a chat session
 */
export async function deleteMessage(sessionId: string, messageId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify user owns this session
  const { data: session } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) {
    return { error: 'Session not found or unauthorized' }
  }

  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('id', messageId)
    .eq('session_id', sessionId)

  if (error) {
    console.error('Failed to delete message:', error)
    return { error: error.message }
  }

  revalidatePath(`/chat/${sessionId}`)
  return { error: null }
}

/**
 * Update message content
 */
export async function updateMessage(sessionId: string, messageId: string, content: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify user owns this session
  const { data: session } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) {
    return { error: 'Session not found or unauthorized' }
  }

  const { error } = await supabase
    .from('chat_messages')
    .update({ content })
    .eq('id', messageId)
    .eq('session_id', sessionId)

  if (error) {
    console.error('Failed to update message:', error)
    return { error: error.message }
  }

  revalidatePath(`/chat/${sessionId}`)
  return { error: null }
}

/**
 * Generate AI response by calling the RAG endpoint
 * Stores both the user message and AI response in the database
 * Optionally handles file uploads for chat session
 */
export async function generateAIResponse(
  sessionId: string,
  userMessage: string,
  fileContents?: string[],
  indexUser: boolean = false
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated', data: null }
  }

  try {
    // Prepare RAG request matching backend API specification
    const ragRequest = {
      user_id: user.id,
      session_id: sessionId,
      question: userMessage,
      file_contents: fileContents && fileContents.length > 0 ? fileContents : undefined,
      index_user: indexUser,
    }

    // Call external RAG endpoint
    const ragResponse = await callRAGEndpoint(ragRequest)

    // Store AI response in database
    const result = await createMessage(
      sessionId,
      'assistant',
      ragResponse.message,
      ragResponse.sources
    )

    return result
  } catch (error) {
    console.error('[generateAIResponse] Failed:', error)

    // Return error but don't crash - allow user to see the error
    return {
      error: error instanceof Error ? error.message : 'Failed to generate AI response',
      data: null,
    }
  }
}

/**
 * @deprecated Use generateAIResponse instead
 * Create a mock AI response (placeholder until RAG is implemented)
 */
export async function createMockAIResponse(sessionId: string) {
  const mockContent = "This is a placeholder response. In a real implementation, this would be generated by your RAG backend using the uploaded documents as context. The AI would retrieve relevant information from your knowledge base and provide an accurate, contextual answer."

  const mockSources: MessageSource[] = [
    { title: "Example Document.pdf", page: 5 },
    { title: "Research Paper.pdf", page: 12 },
  ]

  // Add a small delay to simulate AI processing
  await new Promise(resolve => setTimeout(resolve, 1500))

  return await createMessage(sessionId, 'assistant', mockContent, mockSources)
}

// ============================================================================
// Chat Session Document Actions
// ============================================================================

/**
 * Upload a document to a chat session
 * Documents are stored in Supabase Storage and linked to the session
 */
export async function uploadChatSessionDocument(
  sessionId: string,
  file: File,
  extractedText: string
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated', data: null }
  }

  // Verify user owns this session
  const { data: session } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) {
    return { error: 'Session not found or unauthorized', data: null }
  }

  // Upload document with chat_session type
  return await uploadDocument(file, extractedText, 'chat_session', sessionId)
}
