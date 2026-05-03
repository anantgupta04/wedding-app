import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InvitationsClient } from '@/components/invitations/InvitationsClient'

export default async function InvitationsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: wedding } = await supabase
    .from('weddings')
    .select('id, name')
    .eq('slug', slug)
    .single()

  if (!wedding) redirect('/dashboard')

  const { data: cards } = await supabase
    .from('invitation_cards')
    .select('*, invitation_contacts(*)')
    .eq('wedding_id', wedding.id)
    .order('created_at', { ascending: true })

  return (
    <InvitationsClient
      weddingId={wedding.id}
      initialCards={cards ?? []}
    />
  )
}
