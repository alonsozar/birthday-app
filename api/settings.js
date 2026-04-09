import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('birthday_settings')
      .select('key, value')
    if (error) return res.status(500).json({ error: error.message })
    const settings = Object.fromEntries((data || []).map(r => [r.key, r.value]))
    return res.json(settings)
  }

  if (req.method === 'POST') {
    const { key, value } = req.body
    if (!key || value === undefined) return res.status(400).json({ error: 'Missing key/value' })
    const { error } = await supabase
      .from('birthday_settings')
      .upsert({ key, value: String(value) }, { onConflict: 'key' })
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ ok: true })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
