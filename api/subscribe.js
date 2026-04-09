import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { subscription } = req.body;
  if (!subscription?.endpoint) return res.status(400).json({ error: 'Missing subscription' });

  const { error } = await supabase
    .from('birthday_push_subscriptions')
    .upsert(
      { endpoint: subscription.endpoint, subscription },
      { onConflict: 'endpoint' }
    );

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ success: true });
}
