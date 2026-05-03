import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InviteEditClient } from '@/components/invite/InviteEditClient'

interface PageProps {
  params: Promise<{ slug: string }>
}

interface InviteConfig {
  id?: string
  couple_names: string | null
  tagline: string | null
  story_text: string | null
  theme_color: string | null
  published: boolean
}

export default async function InviteEditPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: wedding } = await supabase
    .from('weddings')
    .select('id, name, slug')
    .eq('slug', slug)
    .single()

  if (!wedding) redirect('/dashboard')

  const { data: membership } = await supabase
    .from('wedding_members')
    .select('role')
    .eq('wedding_id', wedding.id)
    .eq('user_id', user.id)
    .single()

  if (membership?.role !== 'admin') redirect(`/${slug}/overview`)

  const { data: inviteConfig } = await supabase
    .from('invite_config')
    .select('couple_names, tagline, story_text, theme_color, published')
    .eq('wedding_id', wedding.id)
    .single<InviteConfig>()

  return (
    <InviteEditClient
      weddingId={wedding.id}
      slug={slug}
      inviteConfig={inviteConfig ?? null}
    />
  )
}
