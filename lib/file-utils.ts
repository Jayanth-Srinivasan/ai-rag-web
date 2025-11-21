/**
 * File utility functions for validation, formatting, and file type detection
 */

// Maximum file size in bytes (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024

// Allowed file MIME types
export const ALLOWED_FILE_TYPES = {
  // PDF
  'application/pdf': ['.pdf'],

  // Text
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
  'text/csv': ['.csv'],

  // Microsoft Word
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],

  // Microsoft Excel
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],

  // Microsoft PowerPoint (note: parsing not yet implemented)
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
} as const

// File extensions mapped to display names
export const FILE_TYPE_NAMES: Record<string, string> = {
  pdf: 'PDF Document',
  txt: 'Text File',
  md: 'Markdown',
  csv: 'CSV Spreadsheet',
  doc: 'Word Document',
  docx: 'Word Document',
  xls: 'Excel Spreadsheet',
  xlsx: 'Excel Spreadsheet',
  ppt: 'PowerPoint',
  pptx: 'PowerPoint',
}

/**
 * Format file size in bytes to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

/**
 * Get file type display name from filename
 */
export function getFileTypeName(filename: string): string {
  const extension = getFileExtension(filename)
  return FILE_TYPE_NAMES[extension] || 'Unknown File'
}

/**
 * Validate if file type is allowed
 */
export function validateFileType(file: File): boolean {
  const fileType = file.type.toLowerCase()
  const fileName = file.name.toLowerCase()

  // Check MIME type
  if (fileType && fileType in ALLOWED_FILE_TYPES) {
    return true
  }

  // Check extension as fallback
  const allowedExtensions = Object.values(ALLOWED_FILE_TYPES).flat()
  return allowedExtensions.some((ext) => fileName.endsWith(ext))
}

/**
 * Validate file size
 */
export function validateFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE
}

/**
 * Validate file (type and size)
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!validateFileType(file)) {
    return {
      valid: false,
      error: `File type not supported. Please upload PDF, TXT, Word, Excel, or CSV files.`,
    }
  }

  if (!validateFileSize(file)) {
    return {
      valid: false,
      error: `File size exceeds ${formatFileSize(MAX_FILE_SIZE)} limit.`,
    }
  }

  return { valid: true }
}

/**
 * Validate multiple files
 */
export function validateFiles(
  files: File[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  files.forEach((file) => {
    const result = validateFile(file)
    if (!result.valid && result.error) {
      errors.push(`${file.name}: ${result.error}`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Get file icon based on file type
 */
export function getFileIcon(filename: string): string {
  const extension = getFileExtension(filename)

  const iconMap: Record<string, string> = {
    pdf: '📄',
    txt: '📝',
    md: '📝',
    csv: '📊',
    doc: '📘',
    docx: '📘',
    xls: '📊',
    xlsx: '📊',
    ppt: '📽️',
    pptx: '📽️',
  }

  return iconMap[extension] || '📎'
}

/**
 * Generate storage path for file
 * @param userId - User ID
 * @param filename - Original filename
 * @param storageType - 'knowledge_base' or 'chat_session'
 * @param sessionId - Session ID (required for chat_session type)
 */
export function generateStoragePath(
  userId: string,
  filename: string,
  storageType: 'knowledge_base' | 'chat_session',
  sessionId?: string
): string {
  // Sanitize filename
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')

  // Add timestamp to avoid collisions
  const timestamp = Date.now()
  const filenameWithTimestamp = `${timestamp}_${sanitizedFilename}`

  if (storageType === 'knowledge_base') {
    return `${userId}/knowledge-base/${filenameWithTimestamp}`
  } else {
    if (!sessionId) {
      throw new Error('Session ID is required for chat_session storage type')
    }
    return `${userId}/sessions/${sessionId}/${filenameWithTimestamp}`
  }
}

/**
 * Create content preview (first N characters)
 */
export function createContentPreview(
  content: string,
  maxLength: number = 500
): string {
  if (content.length <= maxLength) {
    return content
  }

  return content.substring(0, maxLength) + '...'
}
