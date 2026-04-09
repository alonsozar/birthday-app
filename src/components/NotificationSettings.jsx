import { useState, useEffect } from 'react'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64) {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6) // 6:00 – 22:00

export default function NotificationSettings({ onClose }) {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  )
  const [hour, setHour]       = useState(9)
  const [message, setMessage] = useState('היום חוגגים: {names} — אל תשכח לברך!')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [testing, setTesting] = useState(false)
  const [feedback, setFeedback] = useState('')

  // Load settings from server
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data.notification_hour_israel) setHour(parseInt(data.notification_hour_israel))
        if (data.notification_message)     setMessage(data.notification_message)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const flash = (msg) => {
    setFeedback(msg)
    setTimeout(() => setFeedback(''), 3500)
  }

  // ── Enable notifications (must be user-triggered for mobile) ──────────────
  const enableNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      flash('הדפדפן שלך אינו תומך בהתראות')
      return
    }
    try {
      const reg  = await navigator.serviceWorker.register('/sw.js')
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') {
        flash('לא ניתנה הרשאה להתראות')
        return
      }
      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })
        await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: sub.toJSON() }),
        })
      }
      flash('✓ התראות הופעלו בהצלחה!')
    } catch (e) {
      flash('שגיאה: ' + e.message)
    }
  }

  // ── Save settings to server ────────────────────────────────────────────────
  const saveSettings = async () => {
    setSaving(true)
    try {
      await Promise.all([
        fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'notification_hour_israel', value: String(hour) }),
        }),
        fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'notification_message', value: message }),
        }),
      ])
      flash('✓ ההגדרות נשמרו')
    } catch {
      flash('שגיאה בשמירת ההגדרות')
    }
    setSaving(false)
  }

  // ── Send test notification now ─────────────────────────────────────────────
  const sendTest = async () => {
    if (permission !== 'granted') {
      flash('יש להפעיל התראות קודם')
      return
    }
    setTesting(true)
    setFeedback('')
    try {
      const res  = await fetch('/api/send-push?force=1')
      const data = await res.json()
      if (data.message === 'No birthdays today') {
        flash('אין ימי הולדת היום — אבל ההתראות עובדות!')
      } else if (data.sent > 0) {
        flash(`✓ נשלח! קיבלת עדכון על ${data.birthdays} חוגג/ת`)
      } else {
        flash('שגיאה בשליחה — בדוק שהמשתנים הוגדרו בוורסל')
      }
    } catch {
      flash('שגיאה בחיבור לשרת')
    }
    setTesting(false)
  }

  // ── Permission status display ──────────────────────────────────────────────
  const statusInfo = {
    granted:     { label: 'מופעל',   color: '#2ecc71', dot: '🟢' },
    denied:      { label: 'חסום',    color: '#e74c3c', dot: '🔴' },
    default:     { label: 'לא הופעל', color: '#f39c12', dot: '🟡' },
    unsupported: { label: 'לא נתמך', color: '#999',    dot: '⚫' },
  }
  const status = statusInfo[permission] || statusInfo.default

  return (
    <div className="settings-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="settings-panel">

        {/* Header */}
        <div className="settings-header">
          <h2 className="settings-title">הגדרות התראות</h2>
          <button className="settings-close" onClick={onClose} aria-label="סגור">✕</button>
        </div>

        {loading ? (
          <div className="settings-loading">טוען הגדרות...</div>
        ) : (
          <div className="settings-body">

            {/* ── Notification status ── */}
            <section className="settings-section">
              <h3 className="settings-section-title">סטטוס התראות</h3>
              <div className="notif-status-row">
                <span className="notif-dot">{status.dot}</span>
                <span className="notif-label" style={{ color: status.color }}>
                  {status.label}
                </span>
                {permission !== 'granted' && permission !== 'denied' && (
                  <button className="btn-enable" onClick={enableNotifications}>
                    הפעל התראות
                  </button>
                )}
                {permission === 'denied' && (
                  <span className="notif-hint">
                    יש לאפשר ידנית בהגדרות הדפדפן
                  </span>
                )}
              </div>
              {permission === 'granted' && (
                <p className="notif-sub">התראות פעילות — תקבל עדכון לטלפון כל יום בשעה שתבחר</p>
              )}
            </section>

            {/* ── Notification time ── */}
            <section className="settings-section">
              <h3 className="settings-section-title">שעת ההתראה היומית</h3>
              <p className="settings-hint">בשעה הזו תקבל עדכון אם יש לקוח שחוגג היום</p>
              <select
                className="hour-select"
                value={hour}
                onChange={e => setHour(parseInt(e.target.value))}
              >
                {HOURS.map(h => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </section>

            {/* ── Message template ── */}
            <section className="settings-section">
              <h3 className="settings-section-title">נוסח ההודעה</h3>
              <p className="settings-hint">
                השתמש ב-<code>{'{names}'}</code> כמקום שמות החוגגים
              </p>
              <textarea
                className="message-textarea"
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                maxLength={200}
                placeholder="היום חוגגים: {names} — אל תשכח לברך!"
              />
              <div className="message-preview">
                <span className="preview-label">תצוגה מקדימה: </span>
                {message.replace('{names}', 'ישראל ישראלי')}
              </div>
            </section>

            {/* ── Feedback ── */}
            {feedback && (
              <div className={`settings-feedback ${feedback.startsWith('✓') ? 'success' : 'error'}`}>
                {feedback}
              </div>
            )}

            {/* ── Buttons ── */}
            <div className="settings-actions">
              <button
                className="btn-save"
                onClick={saveSettings}
                disabled={saving}
              >
                {saving ? 'שומר...' : 'שמור הגדרות'}
              </button>
              <button
                className="btn-test"
                onClick={sendTest}
                disabled={testing || permission !== 'granted'}
                title={permission !== 'granted' ? 'יש להפעיל התראות קודם' : ''}
              >
                {testing ? 'שולח...' : 'שלח התראת בדיקה עכשיו'}
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
