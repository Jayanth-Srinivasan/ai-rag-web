import { redirect } from 'next/navigation'
import { getChatSession, getMessages } from '../actions'
import { ChatInterface } from '@/components/chat/chat-interface'

export default async function ChatSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params

  // Fetch session and messages in parallel
  const [sessionResult, messagesResult] = await Promise.all([
    getChatSession(sessionId),
    getMessages(sessionId),
  ])

  // Handle errors
  if (sessionResult.error || !sessionResult.data) {
    // Session doesn't exist or user doesn't have access
    redirect('/chat')
  }

  const session = sessionResult.data
  const messages = messagesResult.data || []

  // Convert DB messages to client format
  const formattedMessages = messages.map((msg) => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    sources: msg.sources ? (msg.sources as any[]) : undefined,
    attached_documents: (msg as any).attached_documents,
    created_at: msg.created_at,
    session_id: msg.session_id,
  }))

  return (
    <ChatInterface
      sessionId={session.id}
      initialMessages={formattedMessages}
      initialTitle={session.title}
    />
  )
}
