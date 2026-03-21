import * as xlsx from 'xlsx';

export interface ParsedBirthday {
  id: string;
  name: string;
  birthday: Date;
}

export function processExcelData(buffer: ArrayBuffer): ParsedBirthday[] {
  const workbook = xlsx.read(buffer, { type: 'array', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Read as array of arrays, with cellDates converting Excel serial numbers to JS Dates
  const rawData = xlsx.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
  if (!rawData || rawData.length === 0) return [];

  let headerRowIdx = -1;
  let nameColIdx = -1;
  let dateColIdx = -1;

  // Scan up to the first 10 rows to skip junk/empty rows and find headers
  const scanLimit = Math.min(rawData.length, 10);
  for (let r = 0; r < scanLimit; r++) {
    const row = rawData[r];
    if (!row || !Array.isArray(row)) continue;

    const headers = row.map((h: any) => String(h || '').toLowerCase().trim());
    let tempNameIdx = -1;
    let tempDateIdx = -1;

    for (let c = 0; c < headers.length; c++) {
      const h = headers[c];
      if (!h || typeof h !== 'string') continue;
      
      if (h.includes('name') || h.includes('שם')) {
        tempNameIdx = c;
      }
      if (h.includes('birth') || h.includes('dob') || h.includes('תאריך') || h.includes('לידה')) {
        tempDateIdx = c;
      }
    }

    if (tempNameIdx !== -1 && tempDateIdx !== -1) {
      headerRowIdx = r;
      nameColIdx = tempNameIdx;
      dateColIdx = tempDateIdx;
      break;
    }
  }

  if (headerRowIdx === -1) {
    throw new Error('לא ניתן לזהות עמודות מתאימות ב-10 השורות הראשונות (נדרש "שם" ו"תאריך לידה").');
  }

  const results: ParsedBirthday[] = [];

  // Parse data starting from the row directly after the found header
  for (let i = headerRowIdx + 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || !row[nameColIdx] || !row[dateColIdx]) continue;
    
    const name = String(row[nameColIdx]).trim();
    if (!name) continue;

    const dateValue = row[dateColIdx];
    let birthdayDate: Date | null = null;
    
    // cellDates maps numerical excel dates to JS Dates
    if (dateValue instanceof Date) {
      birthdayDate = dateValue;
    } else {
      // string parsing
      birthdayDate = new Date(dateValue);
      if (isNaN(birthdayDate.getTime()) && typeof dateValue === 'string') {
        const parts = dateValue.split(/[\/\-\.]/);
        if (parts.length >= 3) {
          birthdayDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        }
      }
    }

    if (birthdayDate && !isNaN(birthdayDate.getTime())) {
      results.push({
        id: Math.random().toString(36).substring(2, 9),
        name,
        birthday: birthdayDate
      });
    }
  }

  return results;
}
