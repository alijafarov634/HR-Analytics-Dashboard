import React from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  rightMetric?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  isLoading?: boolean;
  skeletonHeight?: number;
}

export const ChartSkeleton: React.FC<{ height?: number }> = ({
  height = 280,
}) => (
  <div
    style={{ height }}
    className="flex w-full flex-col justify-between rounded-lg border border-slate-100 bg-slate-50/60 p-4 animate-pulse"
    aria-hidden="true"
  >
    <div className="flex items-center justify-between">
      <div className="h-3 w-32 rounded bg-slate-200/80" />
      <div className="h-3 w-16 rounded bg-slate-200/80" />
    </div>
    <div className="flex flex-1 items-end gap-3 pt-6 pb-2">
      <div className="h-2/5 flex-1 rounded-t bg-slate-200/70" />
      <div className="h-3/4 flex-1 rounded-t bg-slate-200/80" />
      <div className="h-1/2 flex-1 rounded-t bg-slate-200/70" />
      <div className="h-5/6 flex-1 rounded-t bg-slate-200/80" />
      <div className="h-3/5 flex-1 rounded-t bg-slate-200/70" />
      <div className="h-2/3 flex-1 rounded-t bg-slate-200/75" />
    </div>
    <div className="h-2.5 w-full rounded bg-slate-200/70" />
  </div>
);

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  rightMetric,
  children,
  className = '',
  isLoading = false,
  skeletonHeight = 280,
}) => {
  return (
    <section
      className={`print-break-inside-avoid flex flex-col rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors duration-150 hover:border-slate-300/90 ${className}`}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-base font-semibold leading-snug text-slate-900">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              {subtitle}
            </p>
          )}
        </div>
        {rightMetric && <div className="shrink-0 text-right">{rightMetric}</div>}
      </div>
      <div className="flex-1">
        {isLoading ? <ChartSkeleton height={skeletonHeight} /> : children}
      </div>
    </section>
  );
};
