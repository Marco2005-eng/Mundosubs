import { NextRequest, NextResponse } from 'next/server'
import { sendSubscriptionExpiryEmail } from '@/lib/email'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type ReminderType = '2_days' | 'expires_today'

type ReminderWindow = {
  type: ReminderType
  start: string
  end: string
}

function limaDate(offsetDays: number) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const target = new Date(Date.now() + offsetDays * 86400000)
  const parts = formatter.formatToParts(target)
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value

  if (!year || !month || !day) {
    throw new Error('No se pudo calcular la fecha en America/Lima')
  }

  return `${year}-${month}-${day}`
}

function limaDayUtcRange(offsetDays: number) {
  const date = limaDate(offsetDays)
  const start = new Date(`${date}T00:00:00.000-05:00`)
  const end = new Date(start.getTime() + 86400000)

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

function reminderWindows(): ReminderWindow[] {
  const today = limaDayUtcRange(0)
  const twoDays = limaDayUtcRange(2)

  return [
    { type: '2_days', start: twoDays.start, end: twoDays.end },
    { type: 'expires_today', start: today.start, end: today.end },
  ]
}

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET

  if (!secret && process.env.NODE_ENV !== 'production') return true
  if (!secret) return false

  const authHeader = req.headers.get('authorization')
  const cronHeader = req.headers.get('x-cron-secret')

  return authHeader === `Bearer ${secret}` || cronHeader === secret
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const results: Array<{ type: ReminderType; found: number; sent: number; skipped: number; failed: number }> = []

  for (const window of reminderWindows()) {
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('id, user_id, expires_at, products(name)')
      .gte('expires_at', window.start)
      .lt('expires_at', window.end)

    if (error) {
      console.error('Subscription reminder query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const subscriptionList = subscriptions ?? []
    const userIds = Array.from(new Set(subscriptionList.map((subscription: any) => subscription.user_id).filter(Boolean)))
    const subscriptionIds = subscriptionList.map((subscription: any) => subscription.id)

    const [{ data: profiles }, { data: existingLogs }] = await Promise.all([
      userIds.length
        ? supabase.from('profiles').select('id, email, full_name').in('id', userIds)
        : Promise.resolve({ data: [] as any[] }),
      subscriptionIds.length
        ? supabase
            .from('subscription_email_logs')
            .select('subscription_id')
            .eq('reminder_type', window.type)
            .in('subscription_id', subscriptionIds)
        : Promise.resolve({ data: [] as any[] }),
    ])

    const profilesById = new Map((profiles ?? []).map((profile: any) => [profile.id, profile]))
    const alreadySent = new Set((existingLogs ?? []).map((log: any) => log.subscription_id))

    let sent = 0
    let skipped = 0
    let failed = 0

    for (const subscription of subscriptionList as any[]) {
      if (alreadySent.has(subscription.id)) {
        skipped += 1
        continue
      }

      const profile = profilesById.get(subscription.user_id) as any
      if (!profile?.email) {
        skipped += 1
        continue
      }

      try {
        await sendSubscriptionExpiryEmail({
          to: profile.email,
          userName: profile.full_name ?? 'Cliente',
          productName: subscription.products?.name ?? 'tu servicio',
          expiresAt: new Date(subscription.expires_at).toLocaleDateString('es-PE', { timeZone: 'America/Lima' }),
          reminderType: window.type,
        })

        const { error: logError } = await supabase
          .from('subscription_email_logs')
          .insert({
            subscription_id: subscription.id,
            reminder_type: window.type,
          })

        if (logError) {
          console.error('Subscription reminder log error:', logError)
          failed += 1
          continue
        }

        sent += 1
      } catch (err) {
        console.error('Subscription reminder email error:', err)
        failed += 1
      }
    }

    results.push({
      type: window.type,
      found: subscriptionList.length,
      sent,
      skipped,
      failed,
    })
  }

  return NextResponse.json({ ok: true, results })
}
