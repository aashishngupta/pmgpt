'use client';
import { cn } from '@/lib/utils';

export interface Column {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  render?: (value: string | number, row: Record<string, string | number>) => React.ReactNode;
}

interface MetricTableProps {
  title?: string;
  subtitle?: string;
  columns: Column[];
  rows: Record<string, string | number>[];
  className?: string;
}

export function MetricTable({ title, subtitle, columns, rows, className }: MetricTableProps) {
  return (
    <div className={cn('bg-brand-surface border border-brand-line rounded-xl overflow-hidden', className)}>
      {(title || subtitle) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-line">
          {title && <div className="text-[14px] font-semibold text-brand-ink">{title}</div>}
          {subtitle && <span className="text-[11px] text-brand-ink-2">{subtitle}</span>}
        </div>
      )}
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-brand-line bg-brand-bg-2">
            {columns.map(col => (
              <th
                key={col.key}
                className={cn(
                  'px-5 py-2.5 font-medium text-brand-ink-2',
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-brand-line last:border-0 hover:bg-brand-bg-2 transition-colors">
              {columns.map(col => (
                <td
                  key={col.key}
                  className={cn(
                    'px-5 py-3 text-brand-ink',
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                  )}
                >
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
