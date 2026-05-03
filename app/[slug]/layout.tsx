import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TopNav } from '@/components/slug-layout/TopNav'
import { BottomNav } from '@/components/slug-layout/BottomNav'

export default async function SlugLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
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

  const { data: memberships } = await supabase
    .from('wedding_members')
    .select('role, weddings(id, slug, name)')
    .eq('user_id', user.id)

  type WeddingRow = { id: string; slug: string; name: string }
  const allWeddings = (memberships ?? [])
    .map(m => {
      const w = m.weddings
      if (!w || Array.isArray(w)) return null
      return w as unknown as WeddingRow
    })
    .filter((w): w is WeddingRow => w !== null)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopNav
        currentSlug={slug}
        currentWeddingName={wedding.name}
        allWeddings={allWeddings}
      />
      <main className="flex-1 pb-16">
        {children}
      </main>
      <BottomNav slug={slug} />
    </div>
  )
}
