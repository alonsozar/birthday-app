import { useRef, useState } from 'react'

export default function FileUploader({ onFile, compact = false }) {
  const inputRef = useRef()
  const [dragOver, setDragOver] = useState(false)

  const handleFile = (file) => {
    if (!file) return
    const name = file.name.toLowerCase()
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      alert('אנא בחר קובץ Excel בפורמט .xlsx או .xls')
      return
    }
    onFile(file)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  const onDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const onDragLeave = () => setDragOver(false)

  const onChange = (e) => {
    handleFile(e.target.files[0])
    e.target.value = ''
  }

  if (compact) {
    return (
      <>
        <button
          className="file-uploader-compact"
          onClick={() => inputRef.current.click()}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 16V4m0 0L3 8m4-4l4 4"/>
            <path d="M17 8v12m0 0l4-4m-4 4l-4-4"/>
          </svg>
          החלף קובץ
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={onChange}
          style={{ display: 'none' }}
        />
      </>
    )
  }

  return (
    <div
      className={`file-uploader${dragOver ? ' drag-over' : ''}`}
      onClick={() => inputRef.current.click()}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <svg className="upload-icon-svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
      <p>גרור לכאן קובץ Excel או לחץ לבחירה</p>
      <p className="upload-hint">.xlsx / .xls</p>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={onChange}
      />
    </div>
  )
}
