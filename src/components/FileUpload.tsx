"use client";
import React, { useState, useRef } from 'react';
import { UploadCloud, FileType } from 'lucide-react';
import { processExcelData, ParsedBirthday } from '@/lib/parseUtils';

interface FileUploadProps {
  onDataParsed: (data: ParsedBirthday[]) => void;
}

export default function FileUpload({ onDataParsed }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    try {
      const buffer = await file.arrayBuffer();
      const parsed = processExcelData(buffer);
      if (parsed.length > 0) {
        onDataParsed(parsed);
      } else {
        setError('לא נמצאו נתונים בקובץ.');
      }
    } catch (e: any) {
      setError(e.message || 'אירעה שגיאה בקריאת הקובץ.');
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div 
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`mt-8 border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors
          ${isDragging ? 'border-navy-800 bg-slate-50' : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300'}
        `}
      >
        <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
          <UploadCloud className="w-8 h-8 text-slate-400" strokeWidth={1.5} />
        </div>
        <h3 className="text-xl font-semibold text-navy-800 mb-2">גרור קובץ אקסל לכאן</h3>
        <p className="text-slate-500 mb-6 max-w-xs text-sm">
          אנא העלה קובץ עם עמודות המכילות שם ותאריך לידה
        </p>
        
        <div className="flex items-center gap-2 text-xs font-medium bg-white px-4 py-2 rounded-full text-slate-600 shadow-sm border border-slate-100">
          <FileType className="w-4 h-4 text-slate-400" />
          <span>XLSX, CSV</span>
        </div>
        <input 
          type="file" 
          accept=".xlsx,.xls,.csv" 
          className="hidden" 
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFile(e.target.files[0]);
            }
          }}
        />
      </div>
      {error && (
        <div className="mt-4 p-4 text-sm text-red-600 bg-red-50 rounded-lg text-center font-medium border border-red-100">
          {error}
        </div>
      )}
    </div>
  );
}
