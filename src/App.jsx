import { useState } from 'react'
import FileUploader from './components/FileUploader'
import TodayBirthdays from './components/TodayBirthdays'
import UpcomingBirthdays from './components/UpcomingBirthdays'
import CustomerTable from './components/CustomerTable'
import { parseExcelData } from './utils/parseExcel'

const STORAGE_KEY = 'birthday_app_customers'
const STORAGE_FILE_KEY = 'birthday_app_filename'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    // Restore Date objects from ISO strings
    return parsed.map(c => ({
      ...c,
      birthDate: c.birthDate ? new Date(c.birthDate) : null,
    }))
  } catch {
    return []
  }
}

export default function App() {
  const [customers, setCustomers] = useState(() => loadFromStorage())
  const [fileName, setFileName] = useState(() => localStorage.getItem(STORAGE_FILE_KEY) || '')
  const [error, setError] = useState('')

  const handleFile = async (file) => {
    setError('')
    try {
      const data = await parseExcelData(file)
      if (data.length === 0) {
        setError('לא נמצאו נתונים בקובץ. אנא בדוק שהקובץ מכיל עמודות של שם, שם משפחה, טלפון ותאריך לידה.')
        return
      }
      setCustomers(data)
      setFileName(file.name)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      localStorage.setItem(STORAGE_FILE_KEY, file.name)
    } catch (e) {
      setError('שגיאה בקריאת הקובץ: ' + e.message)
    }
  }

  // Age calculated fresh each render so it's always accurate (not stale from localStorage)
  const calcAge = (birthDate) => {
    if (!birthDate) return null
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
    return age
  }

  const today = new Date()
  const todayDay = today.getDate()
  const todayMonth = today.getMonth() + 1

  const getDaysUntilBirthday = (customer) => {
    const bday = customer.birthDate
    if (!bday) return Infinity
    // Normalize to midnight so time-of-day doesn't affect the day count
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    let next = new Date(today.getFullYear(), bday.getMonth(), bday.getDate())
    if (next < todayMidnight) {
      next = new Date(today.getFullYear() + 1, bday.getMonth(), bday.getDate())
    }
    const diff = (next - todayMidnight) / (1000 * 60 * 60 * 24)
    return diff === 365 ? 0 : diff
  }

  // Enrich with live age on every render — never stale
  const enriched = customers.map(c => ({ ...c, age: calcAge(c.birthDate) }))

  const todayBirthdays = enriched.filter(c => {
    if (!c.birthDate) return false
    return c.birthDate.getDate() === todayDay && (c.birthDate.getMonth() + 1) === todayMonth
  })

  const upcomingBirthdays = enriched.filter(c => {
    if (!c.birthDate) return false
    const days = getDaysUntilBirthday(c)
    return days > 0 && days <= 2
  }).sort((a, b) => getDaysUntilBirthday(a) - getDaysUntilBirthday(b))

  const allSorted = [...enriched].sort((a, b) => getDaysUntilBirthday(a) - getDaysUntilBirthday(b))

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-content">
          <p className="app-greeting">היי אולג,</p>
          <h1 className="app-title">הנה ימי ההולדת של הלקוחות שלך</h1>
        </div>
        {fileName && <span className="file-badge">{fileName}</span>}
      </header>

      <main className="app-main">
        {customers.length === 0 ? (
          <div className="upload-screen">
            <div className="upload-intro">
              <h2>ברוך הבא</h2>
              <p>טען קובץ אקסל עם רשימת הלקוחות כדי להתחיל</p>
            </div>
            <FileUploader onFile={handleFile} />
            {error && <p className="error-msg">{error}</p>}
          </div>
        ) : (
          <>
            <div className="top-bar">
              <FileUploader onFile={handleFile} compact />
              {error && <p className="error-msg">{error}</p>}
            </div>

            {todayBirthdays.length > 0 && (
              <TodayBirthdays customers={todayBirthdays} />
            )}

            {upcomingBirthdays.length > 0 && (
              <UpcomingBirthdays
                customers={upcomingBirthdays}
                getDaysUntil={getDaysUntilBirthday}
              />
            )}

            {todayBirthdays.length === 0 && upcomingBirthdays.length === 0 && (
              <div className="no-birthdays">
                <p>אין ימי הולדת היום או בימיים הקרובים</p>
              </div>
            )}

            <CustomerTable
              customers={allSorted}
              getDaysUntil={getDaysUntilBirthday}
              todayBirthdays={todayBirthdays}
            />
          </>
        )}
      </main>
    </div>
  )
}
