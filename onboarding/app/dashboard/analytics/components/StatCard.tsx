'use client';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  positive?: boolean;
  neutral?: boolean;
  icon?: React.ElementType;
  iconColor?: string;
  subtitle?: string;
  className?: string;
}

export function StatCard({
  label, value, delta, positive, neutral,
  icon: Icon, iconColor = 'text-brand-accent', subtitle, className,
}: StatCardProps) {
  return (
    <div className={cn('bg-brand-surface border border-brand-line rounded-xl p-4 flex flex-col gap-2.5', className)}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-brand-ink-2 uppercase tracking-wider leading-none">{label}</span>
        {Icon && (
          <div className={cn('p-1.5 rounded-lg bg-brand-bg-2', iconColor)}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
      <div className="text-[26px] font-bold text-brand-ink leading-none">{value}</div>
      {subtitle && <div className="text-[11px] text-brand-ink-2">{subtitle}</div>}
      {delta && (
        <div className={cn(
          'flex items-center gap-1 text-[11px] font-medium',
          neutral ? 'text-brand-ink-2' : positive ? 'text-green-600' : 'text-red-500',
        )}>
          {neutral ? <Minus className="w-3 h-3" /> : positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {delta}
        </div>
      )}
    </div>
  );
}
