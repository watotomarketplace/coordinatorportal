/**
 * Export array of objects to CSV and trigger download
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Filename for the download
 */
export const exportToCSV = (data, filename = 'export.csv') => {
  if (!data || !data.length) return
  
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const val = row[header] === null || row[header] === undefined ? '' : row[header]
      // Escape quotes and wrap in quotes if contains comma
      const stringVal = String(val).replace(/"/g, '""')
      return stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n') 
        ? `"${stringVal}"` 
        : stringVal
    }).join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
