import { RAGRequest, RAGResponse, RAGError } from "@/types/rag"
import { MessageSource } from "@/types/database"

/**
 * Calls the external RAG endpoint with the provided parameters
 *
 * @param params - Object containing user_id, session_id, message, timestamp, and session_file_content
 * @returns Promise with mapped response containing message and MessageSource objects
 * @throws Error if the request fails or returns an error
 */
export async function callRAGEndpoint(
  params: Omit<RAGRequest, 'question' | 'file_content'>
): Promise<{ message: string; sources?: MessageSource[] }> {
  const ragUrl = process.env.RAG_API_URL

  // Build request with both frontend fields and backend-expected fields
  const requestBody: RAGRequest = {
    // Frontend fields (for future backend use)
    user_id: params.user_id,
    session_id: params.session_id,
    message: params.message,
    timestamp: params.timestamp,
    session_file_content: params.session_file_content,

    // Backend-expected fields (mapped from above)
    question: params.message,
    file_content: params.session_file_content,
  }

  // DEVELOPMENT MODE: Console log payload if RAG endpoint is not configured
  if (!ragUrl || ragUrl.includes('localhost') || ragUrl.includes('example')) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("[RAG Service] 🔧 DEVELOPMENT MODE - Backend not configured")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("[RAG Service] 📦 Full Request Payload:")
    console.log(JSON.stringify(requestBody, null, 2))
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("[RAG Service] 📊 Request Summary:")
    console.log("  - User ID:", requestBody.user_id)
    console.log("  - Session ID:", requestBody.session_id)
    console.log("  - Question:", requestBody.question)
    console.log("  - Timestamp:", requestBody.timestamp)
    console.log("  - Has Files:", requestBody.file_content !== null && requestBody.file_content.length > 0)
    console.log("  - File Count:", requestBody.file_content?.length || 0)
    if (requestBody.file_content && requestBody.file_content.length > 0) {
      console.log("  - File Contents Preview:")
      requestBody.file_content.forEach((content, index) => {
        const preview = content.substring(0, 100).replace(/\n/g, ' ')
        console.log(`    [${index + 1}] ${preview}... (${content.length} chars)`)
      })
    }
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("[RAG Service] ✅ Returning mock response")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

    // Return mock response
    return {
      message: "This is a mock AI response. Configure RAG_API_URL in your .env.local file to connect to your actual RAG backend. Your request payload has been logged to the console for debugging.",
      sources: [
        { title: "Mock Source 1", page: 1 },
        { title: "Mock Source 2", page: 5 },
      ],
    }
  }

  try {
    console.log("[RAG Service] Calling endpoint:", ragUrl)
    console.log("[RAG Service] Request params:", {
      user_id: requestBody.user_id,
      session_id: requestBody.session_id,
      question: requestBody.question.substring(0, 50) + "...",
      timestamp: requestBody.timestamp,
      has_files: requestBody.file_content !== null && requestBody.file_content.length > 0,
      file_count: requestBody.file_content?.length || 0,
    })

    const response = await fetch(ragUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData: RAGError = await response.json().catch(() => ({
        error: "Failed to parse error response",
      }))

      console.error("[RAG Service] Error response:", errorData)
      throw new Error(
        errorData.error || `RAG endpoint returned ${response.status}`
      )
    }

    const data: RAGResponse = await response.json()

    console.log("[RAG Service] Success! Response received")
    console.log("[RAG Service] Answer length:", data.answer.length)
    console.log("[RAG Service] Sources count:", data.sources?.length || 0)
    if (data.index_status) {
      console.log("[RAG Service] Index status:", data.index_status)
    }

    // Map response to frontend format
    const mappedResponse: { message: string; sources?: MessageSource[] } = {
      message: data.answer,
      sources: data.sources?.map((sourceText, index) => ({
        title: `Source ${index + 1}`,
        page: undefined,
      })),
    }

    return mappedResponse
  } catch (error) {
    console.error("[RAG Service] Request failed:", error)

    // Re-throw with more context
    if (error instanceof Error) {
      throw new Error(`RAG service error: ${error.message}`)
    }

    throw new Error("Unknown error occurred while calling RAG service")
  }
}
