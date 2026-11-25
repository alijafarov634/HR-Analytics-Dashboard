import React from 'react';
import { LucideIcon, Minus, TrendingDown, TrendingUp } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  changeValue: string;
  comparisonText: string;
  trend: 'up' | 'down' | 'neutral';
  isPositiveGood?: boolean;
  icon: LucideIcon;
  isLoading?: boolean;
}

export const KPICardSkeleton: React.FC = () => (
  <div
    className="flex h-full min-h-[148px] flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] animate-pulse"
    aria-hidden="true"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="h-4 w-28 rounded bg-slate-200" />
      <div className="h-9 w-9 shrink-0 rounded-lg bg-slate-100" />
    </div>
    <div className="mt-3 h-8 w-20 rounded bg-slate-200" />
    <div className="mt-4 border-t border-slate-100 pt-2.5">
      <div className="h-3.5 w-36 rounded bg-slate-100" />
    </div>
  </div>
);

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  changeValue,
  comparisonText,
  trend,
  isPositiveGood = true,
  icon: Icon,
  isLoading = false,
}) => {
  if (isLoading) {
    return <KPICardSkeleton />;
  }

  const isFavorable =
    trend === 'neutral'
      ? null
      : isPositiveGood
      ? trend === 'up'
      : trend === 'down';

  const trendColorClass =
    isFavorable === null
      ? 'text-slate-600'
      : isFavorable
      ? 'text-emerald-700'
      : 'text-rose-700';

  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div className="group flex h-full min-h-[148px] flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_6px_16px_rgba(15,23,42,0.06)]">
      <div>
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium leading-snug text-slate-600">
            {title}
          </p>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors duration-150 group-hover:bg-blue-100/80">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>

        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="font-display text-[26px] font-bold leading-none tracking-tight text-slate-900 tabular-nums sm:text-[28px]">
            {value}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-2.5 text-xs">
        <span
          className={`inline-flex shrink-0 items-center gap-1 font-semibold tabular-nums ${trendColorClass}`}
        >
          <TrendIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {changeValue}
        </span>
        <span className="truncate text-slate-500">{comparisonText}</span>
      </div>
    </div>
  );
};
