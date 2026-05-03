'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'

export async function inviteTeammate(weddingId: string, email: string, role: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: membership } = await supabase
    .from('wedding_members')
    .select('role')
    .eq('wedding_id', weddingId)
    .eq('user_id', user.id)
    .single()

  if (membership?.role !== 'admin') return { error: 'Only admins can invite teammates' }

  const service = createServiceClient()

  // Check if an account already exists for this email
  const { data: { users }, error: listErr } = await service.auth.admin.listUsers()
  if (listErr) return { error: 'Failed to look up users' }

  const existing = users.find(u => u.email?.toLowerCase() === email.toLowerCase())

  let targetId: string

  if (existing) {
    // User already has an account — add them directly, no invite email needed
    targetId = existing.id
  } else {
    // No account yet — send a Supabase invite email so they can set up their account.
    // inviteUserByEmail creates the auth.users row immediately and sends a magic link.
    // When they click it and sign in, they'll already be in wedding_members.
    const { data: invited, error: inviteErr } = await service.auth.admin.inviteUserByEmail(email, {
      data: { invited_to_wedding: weddingId },
    })
    if (inviteErr) return { error: inviteErr.message }
    targetId = invited.user.id
  }

  const { error: insertErr } = await supabase.from('wedding_members').insert({
    wedding_id: weddingId,
    user_id: targetId,
    role,
    invited_by: user.id,
  })

  if (insertErr) {
    if (insertErr.message.includes('unique')) return { error: 'This person is already a member.' }
    return { error: insertErr.message }
  }

  return { success: true, alreadyHadAccount: !!existing }
}

export async function updateWeddingSettings(weddingId: string, name: string, date: string | null, currency: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('weddings')
    .update({ name, date: date || null, currency })
    .eq('id', weddingId)
  return error ? { error: error.message } : { success: true }
}

export async function removeMember(memberId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('wedding_members').delete().eq('id', memberId)
  return error ? { error: error.message } : { success: true }
}

export async function updateMemberRole(memberId: string, role: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('wedding_members').update({ role }).eq('id', memberId)
  return error ? { error: error.message } : { success: true }
}
