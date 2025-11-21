'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { uploadFile as storageUploadFile, deleteFile as storageDeleteFile } from '@/lib/supabase/storage-server'
import { generateStoragePath, createContentPreview } from '@/lib/file-utils'
import { callKBIndexEndpoint } from '@/lib/rag-service'

const STORAGE_BUCKET = 'documents'

// ============================================================================
// Document Upload Actions
// ============================================================================

/**
 * Upload document to Supabase Storage and save metadata to database
 */
export async function uploadDocument(
  file: File,
  extractedText: string,
  storageType: 'knowledge_base' | 'chat_session',
  sessionId?: string
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated', data: null }
  }

  try {
    // Generate storage path
    const storagePath = generateStoragePath(
      user.id,
      file.name,
      storageType,
      sessionId
    )

    // Upload to Supabase Storage
    const uploadResult = await storageUploadFile(STORAGE_BUCKET, storagePath, file)

    if (uploadResult.error || !uploadResult.data) {
      return { error: uploadResult.error || 'Failed to upload file', data: null }
    }

    // Create content preview
    const contentPreview = createContentPreview(extractedText, 500)

    // Save metadata to database
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        session_id: storageType === 'chat_session' ? sessionId : null,
        file_name: file.name,
        file_path: storagePath,
        file_type: file.type,
        file_size: file.size,
        content_preview: contentPreview,
        storage_type: storageType,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Failed to save document metadata:', dbError)
      // Try to clean up uploaded file
      await storageDeleteFile(STORAGE_BUCKET, storagePath)
      return { error: dbError.message, data: null }
    }

    // Revalidate relevant paths
    if (storageType === 'knowledge_base') {
      revalidatePath('/chat/knowledge')
    } else if (sessionId) {
      revalidatePath(`/chat/${sessionId}`)
    }

    return { data: document, error: null }
  } catch (error) {
    console.error('Upload document error:', error)
    return {
      error: error instanceof Error ? error.message : 'Failed to upload document',
      data: null,
    }
  }
}

/**
 * Upload document and immediately index it in RAG
 * (Used for knowledge base documents)
 */
export async function uploadAndIndexDocument(
  file: File,
  extractedText: string
) {
  // First upload the document
  const uploadResult = await uploadDocument(file, extractedText, 'knowledge_base')

  if (uploadResult.error || !uploadResult.data) {
    return uploadResult
  }

  try {
    // Index in RAG by calling the endpoint
    await indexDocumentInRAG(extractedText)

    return uploadResult
  } catch (error) {
    console.error('Failed to index document in RAG:', error)
    // Document is uploaded but not indexed - return success with warning
    return {
      data: uploadResult.data,
      error: null,
      warning: 'Document uploaded but indexing failed. Please try re-indexing manually.',
    }
  }
}

/**
 * Index document content in RAG system via KB endpoint
 */
async function indexDocumentInRAG(fileContent: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  try {
    // Call KB index endpoint to index the document to user's knowledge base
    await callKBIndexEndpoint({
      user_id: user.id,
      file_contents: [fileContent],
    })
  } catch (error) {
    console.error('KB indexing error:', error)
    throw error
  }
}

// ============================================================================
// Document Retrieval Actions
// ============================================================================

/**
 * Get all documents for the current user
 * Optionally filter by storage type or session ID
 */
export async function getDocuments(
  storageType?: 'knowledge_base' | 'chat_session',
  sessionId?: string
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated', data: null }
  }

  try {
    let query = supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Filter by storage type if provided
    if (storageType) {
      query = query.eq('storage_type', storageType)
    }

    // Filter by session ID if provided
    if (sessionId) {
      query = query.eq('session_id', sessionId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch documents:', error)
      return { error: error.message, data: null }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Get documents error:', error)
    return {
      error: error instanceof Error ? error.message : 'Failed to fetch documents',
      data: null,
    }
  }
}

/**
 * Get a single document by ID
 */
export async function getDocument(documentId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated', data: null }
  }

  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Failed to fetch document:', error)
      return { error: error.message, data: null }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Get document error:', error)
    return {
      error: error instanceof Error ? error.message : 'Failed to fetch document',
      data: null,
    }
  }
}

// ============================================================================
// Document Deletion Actions
// ============================================================================

/**
 * Delete document from both storage and database
 */
export async function deleteDocument(documentId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  try {
    // First get the document to get the file path
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !document) {
      return { error: 'Document not found or unauthorized' }
    }

    // Delete from storage
    const deleteStorageResult = await storageDeleteFile(STORAGE_BUCKET, document.file_path)

    if (deleteStorageResult.error) {
      console.warn('Failed to delete file from storage:', deleteStorageResult.error)
      // Continue anyway to delete database record
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', user.id)

    if (dbError) {
      console.error('Failed to delete document from database:', dbError)
      return { error: dbError.message }
    }

    // Revalidate paths
    if (document.storage_type === 'knowledge_base') {
      revalidatePath('/chat/knowledge')
    } else if (document.session_id) {
      revalidatePath(`/chat/${document.session_id}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Delete document error:', error)
    return {
      error: error instanceof Error ? error.message : 'Failed to delete document',
    }
  }
}
