import React, { useState } from 'react';
import { ArrowRight, BarChart2 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  DepartmentHeadcountDatum,
  FunnelDatum,
  HRPerformanceMetrics,
  MonthlyTrendDatum,
  SourcePerformanceDatum,
  TimeToHireByDeptDatum,
  WorkforceDistributionDatum,
} from '../utils/analytics';

const DEPT_COLORS: Record<string, string> = {
  IT: '#2563EB',
  Sales: '#0EA5E9',
  Operations: '#1E293B',
  Marketing: '#4F46E5',
  Finance: '#0D9488',
  HR: '#64748B',
};

const WORKFORCE_COLORS: Record<string, string> = {
  Active: '#16A34A',
  'On Leave': '#D97706',
  Probation: '#2563EB',
  Inactive: '#94A3B8',
};

const FUNNEL_COLORS = ['#1E3A8A', '#1D4ED8', '#2563EB', '#3B82F6', '#0D9488'];

const TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
  fontSize: '12px',
  padding: '10px 12px',
  color: '#0F172A',
};

const LABEL_TEXT_STYLE: React.CSSProperties = {
  fill: '#334155',
  fontSize: 11,
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
};

const ChartEmptyState: React.FC<{
  title: string;
  description: string;
  height?: number;
}> = ({ title, description, height = 280 }) => (
  <div
    style={{ minHeight: height }}
    className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center"
  >
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
      <BarChart2 className="h-5 w-5" aria-hidden="true" />
    </div>
    <p className="mt-3 text-sm font-semibold text-slate-700">{title}</p>
    <p className="mt-1 max-w-xs text-xs text-slate-500">{description}</p>
  </div>
);

export const RecruitmentFunnelChart: React.FC<{ data: FunnelDatum[] }> = ({
  data,
}) => {
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);
  const appliedCount = data[0]?.count ?? 0;
  const hiredStage = data[data.length - 1];
  const overallConversion = hiredStage?.conversionFromTop ?? 0;

  if (appliedCount === 0) {
    return (
      <ChartEmptyState
        title="No candidates in this pipeline window"
        description="Try widening the date range or selecting All Departments to inspect funnel progression."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Stage-to-Stage Pipeline & Overall Conversion Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 text-xs">
          {data.map((item, idx) => (
            <React.Fragment key={item.stage}>
              {idx > 0 && (
                <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-slate-400 tabular-nums">
                  <ArrowRight className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span className="text-slate-600">
                    {item.conversionFromPrev}%
                  </span>
                </span>
              )}
              <button
                type="button"
                onMouseEnter={() => setHoveredStage(item.stage)}
                onMouseLeave={() => setHoveredStage(null)}
                onFocus={() => setHoveredStage(item.stage)}
                onBlur={() => setHoveredStage(null)}
                className={`inline-flex items-baseline gap-1 rounded px-1.5 py-0.5 transition-colors ${
                  hoveredStage === item.stage
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="font-medium">{item.stage}</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {item.count}
                </span>
              </button>
            </React.Fragment>
          ))}
        </div>

        <div className="shrink-0 text-right tabular-nums">
          <span className="text-[11px] font-medium text-slate-500">
            Applied → Hired
          </span>
          <p className="font-display text-sm font-bold text-emerald-700">
            {overallConversion}%{' '}
            <span className="text-[11px] font-normal text-slate-500">
              ({hiredStage?.count ?? 0}/{appliedCount})
            </span>
          </p>
        </div>
      </div>

      {/* Recharts Horizontal Funnel BarChart with Visual Labels */}
      <div className="h-[224px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 86, left: 6, bottom: 4 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="#E2E8F0"
            />
            <XAxis
              type="number"
              tick={{ fill: '#64748B', fontSize: 11 }}
              axisLine={{ stroke: '#E2E8F0' }}
              tickLine={false}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="stage"
              width={76}
              tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: '#F1F5F9' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as FunnelDatum;
                return (
                  <div style={TOOLTIP_STYLE}>
                    <p className="font-semibold text-slate-900">
                      {d.stage} Stage
                    </p>
                    <div className="mt-1.5 space-y-1 tabular-nums">
                      <p className="text-slate-600">
                        Candidates Reached:{' '}
                        <span className="font-semibold text-slate-900">
                          {d.count}
                        </span>
                      </p>
                      <p className="text-slate-600">
                        Overall Rate (from Applied):{' '}
                        <span className="font-semibold text-blue-700">
                          {d.conversionFromTop}%
                        </span>
                      </p>
                      {d.previousStage && (
                        <>
                          <p className="text-slate-600">
                            {d.previousStage} → {d.stage}:{' '}
                            <span className="font-semibold text-emerald-700">
                              {d.conversionFromPrev}%
                            </span>
                          </p>
                          <p className="text-slate-500">
                            Stage Drop-off: {d.droppedCount} ({d.dropOffRate}%)
                          </p>
                        </>
                      )}
                      <p className="border-t border-slate-100 pt-1 text-[11px] text-slate-500">
                        Currently in stage: {d.currentlyInStage} · Exited here:{' '}
                        {d.rejectedAtStage}
                      </p>
                    </div>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="count"
              radius={[0, 6, 6, 0]}
              barSize={26}
              onMouseEnter={(entry) => {
                const payload = (entry as { payload?: FunnelDatum })?.payload;
                if (payload?.stage) setHoveredStage(payload.stage);
              }}
              onMouseLeave={() => setHoveredStage(null)}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`funnel-${entry.stage}`}
                  fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]}
                  fillOpacity={
                    hoveredStage && hoveredStage !== entry.stage ? 0.45 : 1
                  }
                />
              ))}
              <LabelList
                dataKey="labelText"
                position="right"
                style={LABEL_TEXT_STYLE}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const MonthlyHiringTrendsChart: React.FC<{
  data: MonthlyTrendDatum[];
  showInterviews?: boolean;
}> = ({ data, showInterviews = false }) => {
  const hasAnyActivity = data.some(
    (d) => d.applications > 0 || d.hires > 0 || d.interviews > 0
  );

  if (data.length === 0 || !hasAnyActivity) {
    return (
      <ChartEmptyState
        title="No hiring activity recorded"
        description="Expand the selected date range or department filter to view hiring velocity over time."
      />
    );
  }

  return (
    <div className="h-[280px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 14, right: 18, left: -12, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#E2E8F0"
          />
          <XAxis
            dataKey="month"
            tick={{ fill: '#64748B', fontSize: 12 }}
            axisLine={{ stroke: '#E2E8F0' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748B', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            itemStyle={{ fontVariantNumeric: 'tabular-nums' }}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={9}
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px', color: '#475569' }}
          />
          <Line
            type="monotone"
            dataKey="applications"
            name="Applications"
            stroke="#2563EB"
            strokeWidth={2.5}
            dot={{ r: 3.5, fill: '#2563EB', strokeWidth: 0 }}
            activeDot={{ r: 5.5, stroke: '#DBEAFE', strokeWidth: 3 }}
          />
          {showInterviews && (
            <Line
              type="monotone"
              dataKey="interviews"
              name="Interviews"
              stroke="#6366F1"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 3, fill: '#6366F1', strokeWidth: 0 }}
              activeDot={{ r: 5, stroke: '#E0E7FF', strokeWidth: 3 }}
            />
          )}
          <Line
            type="monotone"
            dataKey="hires"
            name="Hires"
            stroke="#16A34A"
            strokeWidth={2.5}
            dot={{ r: 3.5, fill: '#16A34A', strokeWidth: 0 }}
            activeDot={{ r: 5.5, stroke: '#DCFCE7', strokeWidth: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const EmployeesByDeptChart: React.FC<{
  data: DepartmentHeadcountDatum[];
}> = ({ data }) => {
  const [hoveredDept, setHoveredDept] = useState<string | null>(null);
  const totalHeadcount = data.reduce((acc, d) => acc + d.count, 0);

  if (totalHeadcount === 0) {
    return (
      <ChartEmptyState
        title="No active staff in selection"
        description="Adjust the department or date range filter to inspect workforce distribution."
      />
    );
  }

  return (
    <div className="flex h-auto flex-col items-center gap-4 sm:h-[280px] sm:flex-row">
      <div className="relative h-[220px] w-full min-w-0 sm:h-[260px] sm:w-3/5">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="department"
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={88}
              paddingAngle={2}
              onMouseEnter={(_, idx) => {
                if (data[idx]) setHoveredDept(data[idx].department);
              }}
              onMouseLeave={() => setHoveredDept(null)}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.department}
                  fill={DEPT_COLORS[entry.department] || '#64748B'}
                  fillOpacity={
                    hoveredDept && hoveredDept !== entry.department ? 0.4 : 1
                  }
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as DepartmentHeadcountDatum;
                return (
                  <div style={TOOLTIP_STYLE}>
                    <p className="font-semibold text-slate-900">
                      {d.department}
                    </p>
                    <p className="mt-1 text-slate-600 tabular-nums">
                      Headcount:{' '}
                      <span className="font-semibold text-slate-900">
                        {d.count}
                      </span>{' '}
                      ({d.percentage}%)
                    </p>
                    <p className="text-slate-500 tabular-nums">
                      Active: {d.active} · Probation: {d.probation} · Leave:{' '}
                      {d.onLeave}
                    </p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold text-slate-900 tabular-nums">
            {totalHeadcount}
          </span>
          <span className="text-[11px] font-medium text-slate-500">
            Active Staff
          </span>
        </div>
      </div>

      <div className="w-full space-y-1.5 pr-1 sm:w-2/5">
        {data.map((d) => {
          const isHighlighted = hoveredDept === d.department;
          return (
            <button
              key={d.department}
              type="button"
              onMouseEnter={() => setHoveredDept(d.department)}
              onMouseLeave={() => setHoveredDept(null)}
              onFocus={() => setHoveredDept(d.department)}
              onBlur={() => setHoveredDept(null)}
              className={`flex w-full items-center justify-between rounded-md px-2 py-1 text-xs transition-colors ${
                isHighlighted ? 'bg-slate-100' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-xs"
                  style={{
                    backgroundColor: DEPT_COLORS[d.department] || '#64748B',
                  }}
                />
                <span className="truncate font-medium text-slate-700">
                  {d.department}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2 tabular-nums">
                <span className="font-semibold text-slate-900">{d.count}</span>
                <span className="w-10 text-right text-slate-500">
                  {d.percentage}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const RecruitmentSourcesChart: React.FC<{
  data: SourcePerformanceDatum[];
}> = ({ data }) => {
  const totalApps = data.reduce((sum, item) => sum + item.applications, 0);

  if (totalApps === 0) {
    return (
      <ChartEmptyState
        title="No sourcing channel data"
        description="No candidate applications match the active date range and department filter."
      />
    );
  }

  return (
    <div className="h-[280px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 16, left: -12, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#E2E8F0"
          />
          <XAxis
            dataKey="source"
            tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }}
            axisLine={{ stroke: '#E2E8F0' }}
            tickLine={false}
            interval={0}
            tickFormatter={(v: string) =>
              v === 'Company Website' ? 'Website' : v
            }
          />
          <YAxis
            tick={{ fill: '#64748B', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: '#F8FAFC' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as SourcePerformanceDatum;
              return (
                <div style={TOOLTIP_STYLE}>
                  <p className="font-semibold text-slate-900">{d.source}</p>
                  <p className="mt-1 text-slate-600 tabular-nums">
                    Applications:{' '}
                    <span className="font-semibold text-slate-900">
                      {d.applications}
                    </span>
                  </p>
                  <p className="text-slate-600 tabular-nums">
                    Hires:{' '}
                    <span className="font-semibold text-emerald-700">
                      {d.hires}
                    </span>
                  </p>
                  <p className="text-slate-600 tabular-nums">
                    Conversion:{' '}
                    <span className="font-semibold text-blue-700">
                      {d.conversionRate}%
                    </span>
                  </p>
                </div>
              );
            }}
          />
          <Legend
            verticalAlign="bottom"
            iconType="square"
            iconSize={9}
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px', color: '#475569' }}
          />
          <Bar
            dataKey="applications"
            name="Applications"
            fill="#2563EB"
            radius={[4, 4, 0, 0]}
            barSize={20}
          >
            <LabelList
              dataKey="applications"
              position="top"
              style={LABEL_TEXT_STYLE}
              formatter={(v: unknown) => (Number(v) > 0 ? String(v) : '')}
            />
          </Bar>
          <Bar
            dataKey="hires"
            name="Hires"
            fill="#0D9488"
            radius={[4, 4, 0, 0]}
            barSize={20}
          >
            <LabelList
              dataKey="hires"
              position="top"
              style={LABEL_TEXT_STYLE}
              formatter={(v: unknown) => (Number(v) > 0 ? String(v) : '')}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const WorkforceDistributionChart: React.FC<{
  data: WorkforceDistributionDatum[];
}> = ({ data }) => {
  const totalCount = data.reduce((sum, d) => sum + d.count, 0);

  if (totalCount === 0) {
    return (
      <ChartEmptyState
        title="No workforce records"
        description="No employees match the current department and date window."
      />
    );
  }

  return (
    <div className="h-[280px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 22, right: 16, left: -12, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#E2E8F0"
          />
          <XAxis
            dataKey="status"
            tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
            axisLine={{ stroke: '#E2E8F0' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748B', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: '#F8FAFC' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as WorkforceDistributionDatum;
              return (
                <div style={TOOLTIP_STYLE}>
                  <p className="font-semibold text-slate-900">{d.status}</p>
                  <p className="mt-1 text-slate-600 tabular-nums">
                    Employees:{' '}
                    <span className="font-semibold text-slate-900">
                      {d.count}
                    </span>{' '}
                    ({d.percentage}%)
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="count" name="Employees" radius={[6, 6, 0, 0]} barSize={42}>
            {data.map((entry) => (
              <Cell
                key={entry.status}
                fill={WORKFORCE_COLORS[entry.status] || '#64748B'}
              />
            ))}
            <LabelList
              dataKey="count"
              position="top"
              style={LABEL_TEXT_STYLE}
              formatter={(v: unknown) => (Number(v) > 0 ? String(v) : '')}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const TimeToHireByDeptChart: React.FC<{
  data: TimeToHireByDeptDatum[];
  targetDays: number;
}> = ({ data, targetDays }) => {
  const hasAnyHires = data.some((d) => d.hires > 0 && d.avgDays > 0);

  if (data.length === 0 || !hasAnyHires) {
    return (
      <ChartEmptyState
        title="No finalized hires in period"
        description="Time-to-hire benchmarks appear once at least one candidate completes the hiring stage in this window."
      />
    );
  }

  return (
    <div className="h-[280px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 24, right: 16, left: -12, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#E2E8F0"
          />
          <XAxis
            dataKey="department"
            tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
            axisLine={{ stroke: '#E2E8F0' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748B', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            unit="d"
          />
          <Tooltip
            cursor={{ fill: '#F8FAFC' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as TimeToHireByDeptDatum;
              return (
                <div style={TOOLTIP_STYLE}>
                  <p className="font-semibold text-slate-900">{d.department}</p>
                  <p className="mt-1 text-slate-600 tabular-nums">
                    Avg. Time to Hire:{' '}
                    <span className="font-semibold text-slate-900">
                      {d.avgDays > 0 ? `${d.avgDays} days` : 'No hires'}
                    </span>
                  </p>
                  <p className="text-slate-500 tabular-nums">
                    Hires in period: {d.hires}
                  </p>
                </div>
              );
            }}
          />
          <ReferenceLine
            y={targetDays}
            stroke="#D97706"
            strokeDasharray="4 4"
            label={{
              value: `Target ${targetDays}d`,
              position: 'insideTopRight',
              fill: '#B45309',
              fontSize: 11,
              fontWeight: 600,
            }}
          />
          <Bar
            dataKey="avgDays"
            name="Avg. Days"
            fill="#1D4ED8"
            radius={[6, 6, 0, 0]}
            barSize={32}
          >
            <LabelList
              dataKey="avgDays"
              position="top"
              style={LABEL_TEXT_STYLE}
              formatter={(v: unknown) => (Number(v) > 0 ? `${v}d` : '')}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const EmploymentTypeChart: React.FC<{
  data: HRPerformanceMetrics['employmentTypeDistribution'];
}> = ({ data }) => {
  const TYPE_COLORS: Record<string, string> = {
    'Full-Time': '#2563EB',
    'Part-Time': '#0EA5E9',
    Contract: '#4F46E5',
    Intern: '#0D9488',
  };

  const totalCount = data.reduce((sum, d) => sum + d.count, 0);

  if (totalCount === 0) {
    return (
      <ChartEmptyState
        title="No employment type data"
        description="Adjust the department or date window filters to view contract distribution."
      />
    );
  }

  return (
    <div className="h-[280px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 22, right: 16, left: -12, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#E2E8F0"
          />
          <XAxis
            dataKey="type"
            tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
            axisLine={{ stroke: '#E2E8F0' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748B', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: '#F8FAFC' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as {
                type: string;
                count: number;
                percentage: number;
              };
              return (
                <div style={TOOLTIP_STYLE}>
                  <p className="font-semibold text-slate-900">{d.type}</p>
                  <p className="mt-1 text-slate-600 tabular-nums">
                    Employees:{' '}
                    <span className="font-semibold text-slate-900">
                      {d.count}
                    </span>{' '}
                    ({d.percentage}%)
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
            {data.map((entry) => (
              <Cell
                key={entry.type}
                fill={TYPE_COLORS[entry.type] || '#2563EB'}
              />
            ))}
            <LabelList
              dataKey="count"
              position="top"
              style={LABEL_TEXT_STYLE}
              formatter={(v: unknown) => (Number(v) > 0 ? String(v) : '')}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const MonthlyTurnoverTrendChart: React.FC<{
  data: HRPerformanceMetrics['monthlyTurnoverTrends'];
}> = ({ data }) => {
  if (data.length === 0) {
    return (
      <ChartEmptyState
        title="No turnover data available"
        description="Expand the selected date range or department filter to inspect attrition trends."
      />
    );
  }

  return (
    <div className="h-[280px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 14, right: 18, left: -10, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#E2E8F0"
          />
          <XAxis
            dataKey="month"
            tick={{ fill: '#64748B', fontSize: 12 }}
            axisLine={{ stroke: '#E2E8F0' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748B', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            unit="%"
            domain={[0, 'auto']}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value: unknown, name: unknown) => [
              `${value}%`,
              String(name),
            ]}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={9}
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px', color: '#475569' }}
          />
          <Line
            type="monotone"
            dataKey="turnoverRate"
            name="Monthly Turnover Rate"
            stroke="#DC2626"
            strokeWidth={2.5}
            dot={{ r: 3.5, fill: '#DC2626', strokeWidth: 0 }}
            activeDot={{ r: 5.5, stroke: '#FEE2E2', strokeWidth: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
