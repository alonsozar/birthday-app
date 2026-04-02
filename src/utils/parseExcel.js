import * as XLSX from 'xlsx'

const FIRST_NAME_KEYS = ['שם', 'שם פרטי', 'first name', 'firstname', 'first_name', 'name']
const LAST_NAME_KEYS = ['שם משפחה', 'משפחה', 'last name', 'lastname', 'last_name', 'surname']
const PHONE_KEYS = ['טלפון', 'נייד', 'phone', 'tel', 'mobile', 'cellular', 'phone number']
const BIRTH_KEYS = ['תאריך לידה', 'יום הולדת', 'birthday', 'birth date', 'birthdate', 'dob', 'birth_date', 'date of birth']

function findKey(headers, candidates) {
  const lower = candidates.map(c => c.toLowerCase())
  return headers.find(h => lower.includes(h.toLowerCase())) || null
}

function parseDate(value) {
  if (!value) return null

  // Excel serial date number
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value)
    if (date) return new Date(date.y, date.m - 1, date.d)
  }

  if (typeof value === 'string') {
    // dd/mm/yyyy or d/m/yyyy
    const dmyMatch = value.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/)
    if (dmyMatch) {
      let [, d, m, y] = dmyMatch
      if (y.length === 2) y = '19' + y
      const date = new Date(Number(y), Number(m) - 1, Number(d))
      if (!isNaN(date.getTime())) return date
    }

    // yyyy-mm-dd
    const isoMatch = value.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/)
    if (isoMatch) {
      const date = new Date(value)
      if (!isNaN(date.getTime())) return date
    }

    // Try native parse as fallback
    const fallback = new Date(value)
    if (!isNaN(fallback.getTime())) return fallback
  }

  if (value instanceof Date) return value

  return null
}

function calcAge(birthDate) {
  if (!birthDate) return null
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
  return age
}

function formatDate(date) {
  if (!date) return ''
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  return `${d}/${m}/${y}`
}

export async function parseExcelData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array', cellDates: false })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })

        if (rows.length === 0) {
          resolve([])
          return
        }

        const headers = Object.keys(rows[0])
        const firstKey = findKey(headers, FIRST_NAME_KEYS)
        const lastKey = findKey(headers, LAST_NAME_KEYS)
        const phoneKey = findKey(headers, PHONE_KEYS)
        const birthKey = findKey(headers, BIRTH_KEYS)

        const customers = rows
          .map((row, idx) => {
            const firstName = firstKey ? String(row[firstKey] || '').trim() : ''
            const lastName = lastKey ? String(row[lastKey] || '').trim() : ''
            const phone = phoneKey ? String(row[phoneKey] || '').trim() : ''
            const birthRaw = birthKey ? row[birthKey] : null
            const birthDate = parseDate(birthRaw)

            return {
              id: idx,
              firstName,
              lastName,
              fullName: [firstName, lastName].filter(Boolean).join(' '),
              phone,
              birthDate,
              birthDateFormatted: formatDate(birthDate),
              age: calcAge(birthDate),
            }
          })
          .filter(c => c.fullName || c.phone)

        resolve(customers)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('שגיאה בקריאת הקובץ'))
    reader.readAsArrayBuffer(file)
  })
}
