import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export async function syncCustomersToSupabase(customers) {
  try {
    // Clear existing data
    await supabase.from('birthday_customers').delete().gt('id', 0)

    const rows = customers
      .filter(c => c.birthDate)
      .map(c => ({
        first_name: c.firstName || '',
        last_name:  c.lastName  || '',
        full_name:  c.fullName,
        phone:      c.phone     || '',
        birth_day:   c.birthDate.getDate(),
        birth_month: c.birthDate.getMonth() + 1
      }))

    if (rows.length > 0) {
      const { error } = await supabase.from('birthday_customers').insert(rows)
      if (error) console.error('Supabase sync error:', error.message)
    }
  } catch (e) {
    console.error('Supabase sync failed:', e)
  }
}
