import React from 'react'

interface TableColumn<T = any> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
}

interface TableProps<T = any> {
  headers: string[] | TableColumn<T>[]
  rows: T[]
  className?: string
}

const Table = <T extends Record<string, any>>({
  headers,
  rows,
  className = '',
}: TableProps<T>) => {
  const isColumnObjects = headers.length > 0 && typeof headers[0] === 'object'
  const columns = isColumnObjects ? (headers as TableColumn<T>[]) : null
  const simpleHeaders = !isColumnObjects ? (headers as string[]) : null
  
  const getCellValue = (row: T, header: string | TableColumn<T>): React.ReactNode => {
    if (typeof header === 'string') {
      return row[header] ?? '-'
    } else {
      const column = header as TableColumn<T>
      if (column.render) {
        return column.render(row)
      }
      return row[column.key] ?? '-'
    }
  }
  
  const getHeaderLabel = (header: string | TableColumn<T>): string => {
    if (typeof header === 'string') {
      return header
    }
    return (header as TableColumn<T>).header
  }
  
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {(columns || simpleHeaders)?.map((header, index) => (
              <th
                key={index}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {getHeaderLabel(header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {(columns || simpleHeaders)?.map((header, colIndex) => (
                <td
                  key={colIndex}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                >
                  {getCellValue(row, header)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No hay datos para mostrar
        </div>
      )}
    </div>
  )
}

export default Table

