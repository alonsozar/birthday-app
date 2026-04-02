export default function UpcomingBirthdays({ customers, getDaysUntil }) {
  return (
    <section className="upcoming-section">
      <h2 className="section-title">חוגגים בקרוב</h2>
      <div className="upcoming-list">
        {customers.map(c => {
          const days = getDaysUntil(c)
          return (
            <div key={c.id} className="upcoming-item">
              <span className="upcoming-days-badge">
                בעוד {days} {days === 1 ? 'יום' : 'ימים'}
              </span>
              <span className="customer-name">{c.fullName}</span>
              {c.age !== null && (
                <span className="customer-age-small">יחגוג גיל {c.age + 1}</span>
              )}
              {c.phone && (
                <span className="customer-phone">{c.phone}</span>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
