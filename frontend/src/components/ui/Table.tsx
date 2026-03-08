export interface TableColumn<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  /** Optional: align content (default: left) */
  align?: 'left' | 'right' | 'center';
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  /** Optional: extra class for the table wrapper */
  className?: string;
}

export default function Table<T>({
  columns,
  data,
  keyExtractor,
  className = '',
}: TableProps<T>) {
  return (
    <div className={`overflow-hidden rounded-xl border border-ink-200 ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-ink-200 bg-ink-50/80">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-600 ${
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              className="bg-white hover:bg-ink-50/50 transition-colors"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 text-sm text-ink-700 ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''
                  }`}
                >
                  {col.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
