import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  const force = req.query?.force === '1'

  // ── Fetch settings ──────────────────────────────────────────────────────────
  const { data: settingsRows } = await supabase
    .from('birthday_settings')
    .select('key, value')
  const settings = Object.fromEntries((settingsRows || []).map(r => [r.key, r.value]))

  const preferredHour = parseInt(settings.notification_hour_israel ?? '9')
  const messageTemplate = settings.notification_message ?? 'היום חוגגים: {names} — אל תשכח לברך!'

  // ── Check Israel time (only relevant for cron, skip when force=1) ───────────
  if (!force) {
    const israelTimeStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' })
    const israelHour = new Date(israelTimeStr).getHours()
    if (israelHour !== preferredHour) {
      return res.status(200).json({ message: `Not yet (Israel hour: ${israelHour}, preferred: ${preferredHour})` })
    }
  }

  // ── Find today's birthdays ─────────────────────────────────────────────────
  const now = new Date()
  const israelNowStr = now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' })
  const israelNow = new Date(israelNowStr)
  const day   = israelNow.getDate()
  const month = israelNow.getMonth() + 1

  const { data: customers, error: ce } = await supabase
    .from('birthday_customers')
    .select('full_name')
    .eq('birth_day', day)
    .eq('birth_month', month)

  if (ce) return res.status(500).json({ error: ce.message })
  if (!customers?.length) return res.status(200).json({ message: 'No birthdays today' })

  const names = customers.map(c => c.full_name).join(', ')
  const body  = messageTemplate.replace('{names}', names)

  const payload = JSON.stringify({ title: 'יום הולדת שמח! 🎂', body })

  // ── Send to all subscriptions ─────────────────────────────────────────────
  const { data: subs, error: se } = await supabase
    .from('birthday_push_subscriptions')
    .select('subscription, endpoint')
  if (se) return res.status(500).json({ error: se.message })

  const results = await Promise.allSettled(
    (subs || []).map(({ subscription }) =>
      webpush.sendNotification(subscription, payload)
    )
  )

  // Clean up expired subscriptions (410 Gone)
  const expired = results
    .map((r, i) => r.status === 'rejected' && r.reason?.statusCode === 410 ? subs[i]?.endpoint : null)
    .filter(Boolean)
  if (expired.length) {
    await supabase.from('birthday_push_subscriptions').delete().in('endpoint', expired)
  }

  res.status(200).json({
    birthdays: customers.length,
    sent:   results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length,
  })
}
