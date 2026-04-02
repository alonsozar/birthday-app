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
          החלף קובץ
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={onChange}
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
      <div className="upload-icon">📂</div>
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
