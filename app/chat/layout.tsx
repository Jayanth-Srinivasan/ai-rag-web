import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ChatSidebar } from "@/components/chat/chat-sidebar"

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // const supabase = await createClient()
  // const { data: { user } } = await supabase.auth.getUser()

  // if (!user) {
  //   redirect("/auth")
  // }
  const user = {
    id: "test-user-id",
    email: "demo@example.com",
  } as any

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ChatSidebar user={user} />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
