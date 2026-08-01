import * as XLSX from 'xlsx'

export type SheetSpec = {
  name: string
  rows: Record<string, string | number | null>[]
}

/** Roughly size each column to its widest value so the file is readable unedited. */
function columnWidths(rows: Record<string, string | number | null>[]) {
  if (rows.length === 0) return []
  return Object.keys(rows[0]).map((header) => {
    const longest = rows.reduce(
      (max, row) => Math.max(max, String(row[header] ?? '').length),
      header.length
    )
    return { wch: Math.min(60, Math.max(10, longest + 2)) }
  })
}

/**
 * Excel names cannot exceed 31 characters or contain : \ / ? * [ ]
 */
function safeSheetName(name: string, index: number) {
  const cleaned = name.replace(/[:\\/?*[\]]/g, '-').trim()
  return (cleaned || `Sheet ${index + 1}`).slice(0, 31)
}

export function exportWorkbook(name: string, sheets: SheetSpec[]) {
  const withRows = sheets.filter((s) => s.rows.length > 0)
  if (withRows.length === 0) return false

  const workbook = XLSX.utils.book_new()
  const used = new Set<string>()

  withRows.forEach((sheet, index) => {
    const worksheet = XLSX.utils.json_to_sheet(sheet.rows)
    worksheet['!cols'] = columnWidths(sheet.rows)

    let sheetName = safeSheetName(sheet.name, index)
    let suffix = 2
    while (used.has(sheetName)) {
      sheetName = `${safeSheetName(sheet.name, index).slice(0, 28)} ${suffix++}`
    }
    used.add(sheetName)

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  })

  const date = new Date().toISOString().split('T')[0]
  XLSX.writeFile(workbook, `RocketHacks_2026_Judging_${name}_${date}.xlsx`)
  return true
}

export const yesNo = (value: boolean | null | undefined) =>
  value === null || value === undefined ? '' : value ? 'Yes' : 'No'

export const minutes = (seconds: number) => Math.round(seconds / 60)
