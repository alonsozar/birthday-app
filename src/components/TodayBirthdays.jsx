export default function TodayBirthdays({ customers }) {
  return (
    <section className="today-section">
      <h2 className="section-title">חוגגים היום</h2>
      <div className="today-cards">
        {customers.map(c => (
          <div key={c.id} className="today-card">
            <div className="customer-name">{c.fullName}</div>
            {c.age !== null && (
              <span className="customer-age">גיל {c.age}</span>
            )}
            {c.phone && (
              <div className="customer-phone">{c.phone}</div>
            )}
            {c.birthDateFormatted && (
              <div className="customer-birthdate">{c.birthDateFormatted}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
