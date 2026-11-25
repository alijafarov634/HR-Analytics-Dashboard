import React, { useMemo } from 'react';
import {
  Award,
  Clock,
  FileCheck,
  Filter,
  UserCheck,
  Users,
} from 'lucide-react';
import { ChartCard } from '../components/ChartCard';
import {
  MonthlyHiringTrendsChart,
  RecruitmentFunnelChart,
  RecruitmentSourcesChart,
} from '../components/Charts';
import { FilterBar } from '../components/FilterBar';
import { KPICard } from '../components/KPICard';
import { useHRData } from '../context/HRDataContext';
import { useFilterTransition } from '../hooks/useFilterTransition';
import {
  computeMonthlyHiringTrends,
  computeRecruitmentAnalyticsKPIs,
  computeRecruitmentFunnel,
  computeRecruitmentSources,
  filterCandidates,
  getDateWindowBounds,
  isDateInRange,
} from '../utils/analytics';

function formatPct(v: number | null): string {
  if (v === null) return 'All time';
  return v > 0 ? `+${v}%` : `${v}%`;
}

function formatSigned(v: number | null, suffix: string): string {
  if (v === null) return 'No prior';
  return v > 0 ? `+${v}${suffix}` : `${v}${suffix}`;
}

function trendOf(v: number | null): 'up' | 'down' | 'neutral' {
  if (v === null || v === 0) return 'neutral';
  return v > 0 ? 'up' : 'down';
}

export const RecruitmentAnalyticsPage: React.FC = () => {
  const {
    candidates,
    activities,
    dateRange,
    departmentFilter,
    setDateRange,
    setDepartmentFilter,
  } = useHRData();

  const isUpdating = useFilterTransition([dateRange, departmentFilter]);

  const filteredCandidates = useMemo(
    () => filterCandidates(candidates, departmentFilter, dateRange),
    [candidates, departmentFilter, dateRange]
  );

  const metrics = useMemo(
    () =>
      computeRecruitmentAnalyticsKPIs(
        candidates,
        departmentFilter,
        dateRange
      ),
    [candidates, departmentFilter, dateRange]
  );

  const funnelData = useMemo(
    () => computeRecruitmentFunnel(filteredCandidates),
    [filteredCandidates]
  );

  const monthlyTrends = useMemo(
    () => computeMonthlyHiringTrends(filteredCandidates, dateRange),
    [filteredCandidates, dateRange]
  );

  const sourcePerformance = useMemo(
    () => computeRecruitmentSources(filteredCandidates),
    [filteredCandidates]
  );

  const filteredActivities = useMemo(() => {
    const { start, end, isAllTime } = getDateWindowBounds(dateRange);
    return activities
      .filter((a) => {
        const deptOk =
          departmentFilter === 'All' || a.department === departmentFilter;
        const dateOk = isAllTime || isDateInRange(a.date, start, end);
        return deptOk && dateOk;
      })
      .slice(0, 8);
  }, [activities, departmentFilter, dateRange]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-balance font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-[26px]">
            Recruitment Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Deep-dive pipeline conversion, channel efficiency, and hiring velocity.
          </p>
        </div>
        <FilterBar
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          department={departmentFilter}
          onDepartmentChange={setDepartmentFilter}
        />
      </div>

      {/* 6 Recruitment KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KPICard
          title="Total Job Applications"
          value={metrics.totalApplications}
          changeValue={formatPct(metrics.applicationsChangePct)}
          comparisonText={
            metrics.applicationsChangePct === null
              ? 'full recorded pipeline'
              : `vs ${metrics.comparisonLabel}`
          }
          trend={trendOf(metrics.applicationsChangePct)}
          icon={Users}
          isLoading={isUpdating}
        />
        <KPICard
          title="Total Interviews"
          value={metrics.totalInterviews}
          changeValue={formatPct(metrics.interviewsChangePct)}
          comparisonText={
            metrics.interviewsChangePct === null
              ? 'full recorded pipeline'
              : `vs ${metrics.comparisonLabel}`
          }
          trend={trendOf(metrics.interviewsChangePct)}
          icon={Filter}
          isLoading={isUpdating}
        />
        <KPICard
          title="Total Offers"
          value={metrics.totalOffers}
          changeValue={formatPct(metrics.offersChangePct)}
          comparisonText={
            metrics.offersChangePct === null
              ? 'full recorded pipeline'
              : `vs ${metrics.comparisonLabel}`
          }
          trend={trendOf(metrics.offersChangePct)}
          icon={FileCheck}
          isLoading={isUpdating}
        />
        <KPICard
          title="Total Hires"
          value={metrics.totalHires}
          changeValue={formatPct(metrics.hiresChangePct)}
          comparisonText={
            metrics.hiresChangePct === null
              ? 'full recorded pipeline'
              : `vs ${metrics.comparisonLabel}`
          }
          trend={trendOf(metrics.hiresChangePct)}
          icon={UserCheck}
          isLoading={isUpdating}
        />
        <KPICard
          title="Recruitment Conversion Rate"
          value={`${metrics.conversionRate}%`}
          changeValue={formatSigned(metrics.conversionDeltaPts, ' pts')}
          comparisonText={
            metrics.conversionDeltaPts === null
              ? 'no prior baseline'
              : `vs ${metrics.comparisonLabel}`
          }
          trend={trendOf(metrics.conversionDeltaPts)}
          icon={Award}
          isLoading={isUpdating}
        />
        <KPICard
          title="Average Time to Hire"
          value={
            metrics.avgTimeToHire === null ? '—' : `${metrics.avgTimeToHire}d`
          }
          changeValue={formatSigned(metrics.timeToHireDeltaDays, 'd')}
          comparisonText={
            metrics.timeToHireDeltaDays === null
              ? metrics.avgTimeToHire === null
                ? 'no hires in period'
                : 'no prior baseline'
              : `vs ${metrics.comparisonLabel}`
          }
          trend={trendOf(metrics.timeToHireDeltaDays)}
          isPositiveGood={false}
          icon={Clock}
          isLoading={isUpdating}
        />
      </div>

      {/* Funnel & Monthly Trends */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          title="Recruitment Funnel"
          subtitle="Stage-by-stage volume and pass-through rates"
          isLoading={isUpdating}
          skeletonHeight={286}
        >
          <RecruitmentFunnelChart data={funnelData} />
        </ChartCard>

        <ChartCard
          title={
            dateRange === '30d'
              ? 'Weekly Hiring Trends (Last 30 Days)'
              : 'Hiring Trends by Month'
          }
          subtitle="Applications, interviews, and hires over time"
          isLoading={isUpdating}
        >
          <MonthlyHiringTrendsChart data={monthlyTrends} showInterviews />
        </ChartCard>
      </div>

      {/* Source Performance Chart + Table */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard
          title="Recruitment Source Performance"
          subtitle="Volume and conversion effectiveness by candidate channel"
          isLoading={isUpdating}
        >
          <RecruitmentSourcesChart data={sourcePerformance} />
        </ChartCard>

        <ChartCard
          title="Channel Conversion Breakdown"
          subtitle="Detailed funnel performance across sourcing channels"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                  <th className="py-2.5 pr-3">Source</th>
                  <th className="py-2.5 px-3 text-right">Apps</th>
                  <th className="py-2.5 px-3 text-right">Interviews</th>
                  <th className="py-2.5 px-3 text-right">Offers</th>
                  <th className="py-2.5 px-3 text-right">Hires</th>
                  <th className="py-2.5 px-3 text-right">Conv. Rate</th>
                  <th className="py-2.5 pl-3 text-right">Avg. Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 tabular-nums">
                {sourcePerformance.map((row) => (
                  <tr key={row.source} className="hover:bg-slate-50/80">
                    <td className="py-2.5 pr-3 font-medium text-slate-900">
                      {row.source}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700">
                      {row.applications}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700">
                      {row.interviews}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700">
                      {row.offers}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">
                      {row.hires}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-blue-700">
                      {row.conversionRate}%
                    </td>
                    <td className="py-2.5 pl-3 text-right text-slate-600">
                      {row.avgDaysToHire > 0 ? `${row.avgDaysToHire}d` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>

      {/* Recent Recruitment Activities */}
      <ChartCard
        title="Recent Recruitment Activity"
        subtitle="Latest stage transitions, interviews, and finalized offers"
        isLoading={isUpdating}
        skeletonHeight={200}
      >
        {filteredActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
            <p className="text-sm font-semibold text-slate-700">
              No recruitment activity recorded
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Try expanding the date range or selecting All Departments.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredActivities.map((act) => (
              <div
                key={act.id}
                className="flex flex-col gap-1 rounded-md px-2 py-3 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">
                    {act.candidateName}{' '}
                    <span className="font-normal text-slate-500">
                      · {act.department} · {act.type}
                    </span>
                  </p>
                  <p className="text-xs text-slate-600">{act.description}</p>
                </div>
                <div className="shrink-0 text-xs text-slate-500 tabular-nums sm:text-right">
                  <span className="font-medium text-slate-700">{act.actor}</span>
                  <span className="mx-1.5" aria-hidden="true">
                    ·
                  </span>
                  <span>{act.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </ChartCard>
    </div>
  );
};
