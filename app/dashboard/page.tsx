import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CreateWeddingForm } from '@/components/CreateWeddingForm'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: memberships } = await supabase
    .from('wedding_members')
    .select('role, weddings(id, slug, name, date, currency)')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

  const weddings = memberships?.map(m => ({ ...(m.weddings as any), role: m.role })) ?? []

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Your Weddings</h1>
        </div>

        {weddings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center space-y-4">
            <p className="text-muted-foreground">No weddings yet. Create your first one!</p>
            <CreateWeddingForm userId={user.id} />
          </div>
        ) : (
          <div className="space-y-4">
            {weddings.map(w => (
              <Link key={w.id} href={`/${w.slug}/overview`}>
                <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">{w.name}</h2>
                      {w.date && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(w.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full capitalize">
                      {w.role}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            <div className="pt-4">
              <CreateWeddingForm userId={user.id} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
