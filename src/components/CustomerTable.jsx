import { useState } from 'react'

export default function CustomerTable({ customers, getDaysUntil, todayBirthdays }) {
  const [search, setSearch] = useState('')

  const todayIds = new Set(todayBirthdays.map(c => c.id))

  const filtered = customers.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.fullName.toLowerCase().includes(q) ||
      c.phone.includes(q)
    )
  })

  const renderDaysBadge = (c) => {
    const days = getDaysUntil(c)
    if (todayIds.has(c.id)) {
      return <span className="days-pill today">היום</span>
    }
    if (days <= 2 && days > 0) {
      return <span className="days-pill soon">בעוד {days} {days === 1 ? 'יום' : 'ימים'}</span>
    }
    if (days < 365 && c.birthDate) {
      return <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>בעוד {days} ימים</span>
    }
    return null
  }

  return (
    <section className="table-section">
      <div className="table-controls">
        <h2 className="section-title" style={{ margin: 0 }}>כל הלקוחות</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="customer-count">{filtered.length} לקוחות</span>
          <input
            className="search-input"
            type="text"
            placeholder="חיפוש לפי שם או טלפון..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>שם מלא</th>
              <th>תאריך לידה</th>
              <th>גיל</th>
              <th>טלפון</th>
              <th>יום הולדת</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-light)', padding: '24px' }}>
                  לא נמצאו תוצאות
                </td>
              </tr>
            ) : (
              filtered.map(c => (
                <tr key={c.id} className={todayIds.has(c.id) ? 'today-row' : ''}>
                  <td>{c.fullName}</td>
                  <td>{c.birthDateFormatted || '—'}</td>
                  <td>
                    {c.age !== null ? (
                      <span className="age-pill">{c.age}</span>
                    ) : '—'}
                  </td>
                  <td>
                    <span className="phone-cell">{c.phone || '—'}</span>
                  </td>
                  <td>{renderDaysBadge(c)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
