// import { redirect } from "next/navigation"
// import { createClient } from "@/lib/supabase/server"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { User } from "@supabase/supabase-js";

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
 const user: User = {
   id: "test-user-id",
   email: "demo@example.com",
   app_metadata: {},
   user_metadata: {},
   aud: "authenticated",
   created_at: new Date().toISOString(),
 };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ChatSidebar user={user} />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
