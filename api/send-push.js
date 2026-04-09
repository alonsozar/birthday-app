import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const now = new Date();
  const day   = now.getDate();
  const month = now.getMonth() + 1;

  // Find today's birthdays
  const { data: customers, error: ce } = await supabase
    .from('birthday_customers')
    .select('full_name')
    .eq('birth_day', day)
    .eq('birth_month', month);

  if (ce) return res.status(500).json({ error: ce.message });
  if (!customers?.length) return res.status(200).json({ message: 'No birthdays today' });

  const names = customers.map(c => c.full_name).join(', ');
  const payload = JSON.stringify({
    title: 'יום הולדת שמח!',
    body: `היום חוגגים: ${names} — אל תשכח לברך!`
  });

  // Get all subscriptions
  const { data: subs, error: se } = await supabase
    .from('birthday_push_subscriptions')
    .select('subscription');

  if (se) return res.status(500).json({ error: se.message });

  const results = await Promise.allSettled(
    (subs || []).map(({ subscription }) =>
      webpush.sendNotification(subscription, payload)
    )
  );

  // Clean up expired subscriptions (410 Gone)
  const expired = results
    .filter(r => r.status === 'rejected' && r.reason?.statusCode === 410)
    .map((_, i) => subs[i]?.subscription?.endpoint)
    .filter(Boolean);

  if (expired.length) {
    await supabase.from('birthday_push_subscriptions').delete().in('endpoint', expired);
  }

  res.status(200).json({
    birthdays: customers.length,
    sent: results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length
  });
}
