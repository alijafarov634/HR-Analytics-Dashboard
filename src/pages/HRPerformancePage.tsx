import React, { useMemo } from 'react';
import {
  Activity,
  Award,
  Clock,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { ChartCard } from '../components/ChartCard';
import {
  EmployeesByDeptChart,
  EmploymentTypeChart,
  MonthlyTurnoverTrendChart,
} from '../components/Charts';
import { FilterBar } from '../components/FilterBar';
import { KPICard } from '../components/KPICard';
import { useHRData } from '../context/HRDataContext';
import { useFilterTransition } from '../hooks/useFilterTransition';
import {
  computeEmployeesByDepartment,
  computeHRPerformance,
  filterEmployeesForWindow,
} from '../utils/analytics';

function formatDelta(val: number | null, suffix: string): string {
  if (val === null) return 'Baseline';
  if (val > 0) return `+${val}${suffix}`;
  return `${val}${suffix}`;
}

function trendOf(val: number | null): 'up' | 'down' | 'neutral' {
  if (val === null || val === 0) return 'neutral';
  return val > 0 ? 'up' : 'down';
}

export const HRPerformancePage: React.FC = () => {
  const {
    employees,
    vacancies,
    settings,
    dateRange,
    departmentFilter,
    setDateRange,
    setDepartmentFilter,
  } = useHRData();

  const isUpdating = useFilterTransition([dateRange, departmentFilter]);

  const perf = useMemo(
    () =>
      computeHRPerformance(employees, vacancies, departmentFilter, dateRange),
    [employees, vacancies, departmentFilter, dateRange]
  );

  const filteredEmployees = useMemo(
    () => filterEmployeesForWindow(employees, departmentFilter, dateRange),
    [employees, departmentFilter, dateRange]
  );

  const deptHeadcount = useMemo(
    () => computeEmployeesByDepartment(filteredEmployees, departmentFilter),
    [filteredEmployees, departmentFilter]
  );

  const targetRetentionDiff =
    Math.round((perf.retentionRate - settings.targetRetentionRate) * 10) / 10;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-balance font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-[26px]">
            HR Performance
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Workforce retention, tenure stability, and departmental headcount health.
          </p>
        </div>

        <FilterBar
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          department={departmentFilter}
          onDepartmentChange={setDepartmentFilter}
        />
      </div>

      {/* Key Workforce KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard
          title="Employee Turnover Rate"
          value={`${perf.turnoverRate}%`}
          changeValue={
            perf.turnoverDeltaPts === null
              ? `${perf.totalExited} exited`
              : formatDelta(perf.turnoverDeltaPts, ' pts')
          }
          comparisonText={
            perf.turnoverDeltaPts === null
              ? 'across full history'
              : `vs ${perf.comparisonLabel}`
          }
          trend={trendOf(perf.turnoverDeltaPts)}
          isPositiveGood={false}
          icon={Activity}
          isLoading={isUpdating}
        />
        <KPICard
          title="Employee Retention Rate"
          value={`${perf.retentionRate}%`}
          changeValue={
            perf.retentionDeltaPts === null
              ? `${targetRetentionDiff >= 0 ? '+' : ''}${targetRetentionDiff} pts`
              : formatDelta(perf.retentionDeltaPts, ' pts')
          }
          comparisonText={
            perf.retentionDeltaPts === null
              ? `vs ${settings.targetRetentionRate}% target`
              : `vs ${perf.comparisonLabel} (Target ${settings.targetRetentionRate}%)`
          }
          trend={trendOf(
            perf.retentionDeltaPts === null
              ? targetRetentionDiff
              : perf.retentionDeltaPts
          )}
          isPositiveGood
          icon={ShieldCheck}
          isLoading={isUpdating}
        />
        <KPICard
          title="Average Employee Tenure"
          value={`${perf.avgTenureYears} yrs`}
          changeValue={formatDelta(perf.tenureDeltaYears, ' yrs')}
          comparisonText={
            perf.tenureDeltaYears === null
              ? 'mean active tenure'
              : `vs ${perf.comparisonLabel}`
          }
          trend={trendOf(perf.tenureDeltaYears)}
          isPositiveGood
          icon={Clock}
          isLoading={isUpdating}
        />
        <KPICard
          title="Active Headcount"
          value={perf.activeHeadcount}
          changeValue={formatDelta(perf.headcountChangePct, '%')}
          comparisonText={
            perf.headcountChangePct === null
              ? 'no prior baseline'
              : `vs ${perf.comparisonLabel}`
          }
          trend={trendOf(perf.headcountChangePct)}
          isPositiveGood
          icon={Users}
          isLoading={isUpdating}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          title="Department Headcount"
          subtitle="Active staff distribution across departments"
          isLoading={isUpdating}
        >
          <EmployeesByDeptChart data={deptHeadcount} />
        </ChartCard>

        <ChartCard
          title="Employee Distribution by Employment Type"
          subtitle="Breakdown across Full-Time, Part-Time, Contract, and Intern"
          isLoading={isUpdating}
        >
          <EmploymentTypeChart data={perf.employmentTypeDistribution} />
        </ChartCard>
      </div>

      <ChartCard
        title="Monthly Employee Turnover Trends"
        subtitle="Monthly attrition percentage over the selected period"
        isLoading={isUpdating}
      >
        <MonthlyTurnoverTrendChart data={perf.monthlyTurnoverTrends} />
      </ChartCard>

      {/* Departmental Breakdown Table */}
      <ChartCard
        title="Department Workforce Metrics"
        subtitle="Headcount, tenure, turnover rate, and performance averages by unit"
        rightMetric={
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <Award className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
            Scale 1.0 – 5.0
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                <th className="py-3 pr-4">Department</th>
                <th className="py-3 px-4 text-right">Active Headcount</th>
                <th className="py-3 px-4 text-right">Avg. Tenure</th>
                <th className="py-3 px-4 text-right">Turnover Rate</th>
                <th className="py-3 px-4 text-right">Avg. Rating</th>
                <th className="py-3 pl-4 text-right">Open Roles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 tabular-nums">
              {perf.departmentPerformance.map((row) => (
                <tr key={row.department} className="hover:bg-slate-50/80">
                  <td className="py-3 pr-4 font-medium text-slate-900">
                    {row.department}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-900">
                    {row.headcount}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-700">
                    {row.avgTenure} yrs
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`font-medium ${
                        row.turnoverRate > 15
                          ? 'text-rose-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      {row.turnoverRate}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-700">
                    {row.avgPerformance.toFixed(1)}
                  </td>
                  <td className="py-3 pl-4 text-right text-slate-700">
                    {row.openRoles}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
};
