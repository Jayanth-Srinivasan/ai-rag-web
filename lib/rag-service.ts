import { RAGRequest, RAGResponse, RAGError, UserKBUploadRequest, UserKBUploadResponse, RAGReports, RAGAnalysis, RAGCharts } from "@/types/rag"
import { MessageSource } from "@/types/database"

/**
 * Parse raw LangChain response format to extract clean content
 * Handles formats like: content="..." response_metadata={...} id='...'
 */
function parseResponseContent(rawAnswer: string): string {
  // If it looks like a LangChain string representation
  if (rawAnswer.includes('content="') && rawAnswer.includes('response_metadata=')) {
    // Extract just the content portion
    const contentMatch = rawAnswer.match(/content="([\s\S]*?)"\s*response_metadata=/)
    if (contentMatch && contentMatch[1]) {
      // Unescape the string
      return contentMatch[1]
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
    }
  }
  // Return as-is if it's already clean
  return rawAnswer
}

/**
 * Calls the KB indexing endpoint to index documents in user's knowledge base
 */
export async function callKBIndexEndpoint(
  params: { user_id: string; file_contents: string[] }
): Promise<UserKBUploadResponse> {
  const baseUrl = process.env.RAG_API_BASE_URL || ''
  const kbUrl = `${baseUrl}/kb/user/upload`

  const requestBody: UserKBUploadRequest = {
    user_id: params.user_id,
    file_contents: params.file_contents,
  }

  // Dev mode check
  if (!baseUrl || baseUrl.includes('localhost') || baseUrl.includes('example')) {
    console.log("\n[KB Index] 🔧 DEVELOPMENT MODE - KB endpoint not configured")
    console.log("[KB Index] Would POST to:", kbUrl)
    console.log("[KB Index] Payload:", JSON.stringify(requestBody, null, 2))
    return {
      user_id: params.user_id,
      status: "mock_indexed",
      detail: [{ mock: true }],
    }
  }

  try {
    console.log("[KB Index] 🚀 Indexing to user KB:", kbUrl)

    const response = await fetch(kbUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Failed to parse error" }))
      throw new Error(errorData.error || `KB endpoint returned ${response.status}`)
    }

    const data: UserKBUploadResponse = await response.json()
    console.log("[KB Index] ✅ Successfully indexed to user KB")
    return data
  } catch (error) {
    console.error("[KB Index] Failed:", error)
    throw error
  }
}

/**
 * Calls the external RAG endpoint with the provided parameters
 *
 * @param params - Object containing user_id, session_id, question, file_contents, and index_user
 * @returns Promise with mapped response containing message and MessageSource objects
 * @throws Error if the request fails or returns an error
 */
export async function callRAGEndpoint(
  params: {
    user_id: string
    session_id: string
    question?: string
    file_contents?: string[]
    index_user?: boolean
  }
): Promise<{
  message: string
  sources?: MessageSource[]
  reports?: RAGReports | null
  analysis?: RAGAnalysis | null
  charts?: RAGCharts | null
}> {
  const baseUrl = process.env.RAG_API_BASE_URL || ''
  const ragUrl = `${baseUrl}/chat`

  // Build request body matching backend API specification exactly
  const requestBody: RAGRequest = {
    user_id: params.user_id,
    session_id: params.session_id,
    file_contents: params.file_contents,
    question: params.question,
    index_user: params.index_user ?? false,  // Default to false if not provided
  }

  // DEVELOPMENT MODE: Console log payload if RAG endpoint is not configured
  if (!baseUrl || baseUrl.includes('localhost') || baseUrl.includes('example')) {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("[RAG Service] 🔧 DEVELOPMENT MODE - Backend not configured")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("[RAG Service] 📦 FULL REQUEST PAYLOAD (JSON):")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log(JSON.stringify(requestBody, null, 2))
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("[RAG Service] 📊 REQUEST SUMMARY:")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("  User ID:", requestBody.user_id)
    console.log("  Session ID:", requestBody.session_id)
    console.log("  Question:", requestBody.question || '(none)')
    console.log("  Index User:", requestBody.index_user)
    console.log("  Has Files:", requestBody.file_contents !== undefined && requestBody.file_contents !== null && requestBody.file_contents.length > 0)
    console.log("  File Count:", requestBody.file_contents?.length || 0)

    if (requestBody.file_contents && requestBody.file_contents.length > 0) {
      console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
      console.log("[RAG Service] 📄 FILE CONTENTS DETAILS:")
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

      requestBody.file_contents.forEach((content, index) => {
        console.log(`\n[File ${index + 1}/${requestBody.file_contents!.length}]`)
        console.log(`  Length: ${content.length} characters`)
        console.log(`  First 500 chars:`)
        console.log('  ────────────────────────────────────────')
        console.log('  ' + content.substring(0, 500).replace(/\n/g, '\n  '))
        if (content.length > 500) {
          console.log(`\n  ... (${content.length - 500} more characters)`)
        }
        console.log('  ────────────────────────────────────────')
      })
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("[RAG Service] ✅ Returning mock response")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

    // Return mock response
    return {
      message: "This is a mock AI response. Configure RAG_API_URL in your .env.local file to connect to your actual RAG backend. Your request payload has been logged to the console for debugging.",
      sources: [
        { title: "Mock Source 1", page: 1 },
        { title: "Mock Source 2", page: 5 },
      ],
      reports: null,
      analysis: null,
      charts: null,
    }
  }

  try {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("[RAG Service] 🚀 SENDING REQUEST TO BACKEND")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("Endpoint:", ragUrl)
    console.log("\n[RAG Service] 📦 COMPLETE PAYLOAD BEING SENT:")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log(JSON.stringify(requestBody, null, 2))
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    console.log("\n[RAG Service] 📊 PAYLOAD SUMMARY:")
    console.log("  User ID:", requestBody.user_id)
    console.log("  Session ID:", requestBody.session_id)
    console.log("  Question:", requestBody.question || '(none)')
    console.log("  Index User:", requestBody.index_user)
    console.log("  Has Files:", requestBody.file_contents !== undefined && requestBody.file_contents !== null && requestBody.file_contents.length > 0)
    console.log("  File Count:", requestBody.file_contents?.length || 0)

    if (requestBody.file_contents && requestBody.file_contents.length > 0) {
      console.log("\n[RAG Service] 📄 FILE CONTENTS IN PAYLOAD:")
      requestBody.file_contents.forEach((content, index) => {
        console.log(`\n  [File ${index + 1}] Length: ${content.length} chars`)
        console.log(`  First 300 chars: ${content.substring(0, 300).replace(/\n/g, ' ')}...`)
      })
    }
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

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

    // Handle both new format (message) and legacy format (answer)
    const messageContent = data.message || data.answer || ''

    console.log("[RAG Service] Success! Response received")
    console.log("[RAG Service] Message length:", messageContent.length)
    console.log("[RAG Service] Sources count:", data.sources?.length || 0)
    console.log("[RAG Service] Has reports:", !!data.reports)
    console.log("[RAG Service] Has analysis:", !!data.analysis)
    console.log("[RAG Service] Has charts:", !!data.charts)
    if (data.index_status) {
      console.log("[RAG Service] Index status:", data.index_status)
    }

    // Map response to frontend format, parsing out any metadata from the answer
    const mappedResponse: {
      message: string
      sources?: MessageSource[]
      reports?: RAGReports | null
      analysis?: RAGAnalysis | null
      charts?: RAGCharts | null
    } = {
      message: parseResponseContent(messageContent),
      sources: data.sources?.map((sourceText, index) => ({
        title: `Source ${index + 1}`,
        page: undefined,
      })),
      reports: data.reports || null,
      analysis: data.analysis || null,
      charts: data.charts || null,
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
