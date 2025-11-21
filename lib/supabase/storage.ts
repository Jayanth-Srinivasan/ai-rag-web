import { createClient } from '@/lib/supabase/client'

/**
 * Upload a file to Supabase Storage
 *
 * @param bucket - Storage bucket name
 * @param path - File path within the bucket
 * @param file - File to upload
 * @returns Promise with file path or error
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<{ data: { path: string } | null; error: string | null }> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false, // Don't overwrite existing files
      })

    if (error) {
      console.error('Storage upload error:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Upload file error:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Delete a file from Supabase Storage
 *
 * @param bucket - Storage bucket name
 * @param path - File path within the bucket
 * @returns Promise with success status or error
 */
export async function deleteFile(
  bucket: string,
  path: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createClient()

    const { error } = await supabase.storage.from(bucket).remove([path])

    if (error) {
      console.error('Storage delete error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Delete file error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get public URL for a file in Supabase Storage
 *
 * @param bucket - Storage bucket name
 * @param path - File path within the bucket
 * @returns Public URL string
 */
export function getPublicUrl(bucket: string, path: string): string {
  const supabase = createClient()

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)

  return data.publicUrl
}

/**
 * Get signed URL for a file (for private buckets)
 *
 * @param bucket - Storage bucket name
 * @param path - File path within the bucket
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Promise with signed URL or error
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<{ signedUrl: string | null; error: string | null }> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)

    if (error) {
      console.error('Create signed URL error:', error)
      return { signedUrl: null, error: error.message }
    }

    return { signedUrl: data.signedUrl, error: null }
  } catch (error) {
    console.error('Get signed URL error:', error)
    return {
      signedUrl: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * List files in a storage path
 *
 * @param bucket - Storage bucket name
 * @param path - Folder path to list (default: empty string for root)
 * @returns Promise with list of files or error
 */
export async function listFiles(
  bucket: string,
  path: string = ''
): Promise<{
  data: Array<{ name: string; id: string; metadata: Record<string, unknown> }> | null
  error: string | null
}> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.storage.from(bucket).list(path)

    if (error) {
      console.error('List files error:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('List files error:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
