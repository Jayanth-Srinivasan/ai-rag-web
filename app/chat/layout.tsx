import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { Profile } from "@/types/database"
import { WelcomeToast } from "@/components/chat/welcome-toast"
import { getChatSessions } from "./actions"

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth")
  }

  // Fetch user profile and chat sessions in parallel
  const [profileResult, sessionsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
    getChatSessions(),
  ])

  let { data: profile, error: profileError } = profileResult

  // Fallback: Create profile if it doesn't exist
  // This handles cases where the database trigger wasn't set up
  if (!profile && profileError?.code === 'PGRST116') {
    // Extract name from metadata or use email
    const userName = (user.user_metadata?.name as string) || user.email?.split('@')[0] || 'User'

    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        name: userName,
      })
      .select()
      .single()

    if (!insertError && newProfile) {
      profile = newProfile as Profile
    } else if (insertError) {
      console.error('Failed to create fallback profile:', insertError)
    }
  }

  const sessions = sessionsResult.data || []

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <WelcomeToast userName={profile?.name || user.email || 'User'} />
      <ChatSidebar
        user={user}
        profile={profile as Profile | null}
        sessions={sessions}
      />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
