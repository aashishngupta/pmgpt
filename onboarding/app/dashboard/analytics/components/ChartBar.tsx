'use client';
import { cn } from '@/lib/utils';

interface BarItem {
  label: string;
  value: number;
  color?: string;
}

interface ChartBarProps {
  data: BarItem[];
  height?: number;
  showValues?: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
  maxValue?: number;
}

export function ChartBar({
  data, height = 120, showValues = true, title, subtitle, className, maxValue,
}: ChartBarProps) {
  const max = maxValue ?? Math.max(...data.map(d => d.value), 1);
  const barArea = height - (showValues ? 20 : 0) - 18;

  return (
    <div className={cn('bg-brand-surface border border-brand-line rounded-xl p-5', className)}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <div className="text-[14px] font-semibold text-brand-ink">{title}</div>}
          {subtitle && <div className="text-[11px] text-brand-ink-2 mt-0.5">{subtitle}</div>}
        </div>
      )}
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            {showValues && (
              <span className="text-[10px] font-medium text-brand-ink-2">{d.value}</span>
            )}
            <div
              className={cn('w-full rounded-t-md transition-all hover:opacity-75 cursor-default', d.color ?? 'bg-brand-accent/75')}
              style={{ height: `${Math.max((d.value / max) * barArea, 2)}px` }}
              title={`${d.label}: ${d.value}`}
            />
            <span className="text-[9px] text-brand-ink-2 truncate w-full text-center leading-tight">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
