import React, { useMemo } from 'react';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Download,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { ChartCard } from '../components/ChartCard';
import {
  EmployeesByDeptChart,
  MonthlyHiringTrendsChart,
  RecruitmentFunnelChart,
  RecruitmentSourcesChart,
  TimeToHireByDeptChart,
  WorkforceDistributionChart,
} from '../components/Charts';
import { FilterBar } from '../components/FilterBar';
import { KPICard } from '../components/KPICard';
import { useHRData } from '../context/HRDataContext';
import { useFilterTransition } from '../hooks/useFilterTransition';
import {
  computeEmployeesByDepartment,
  computeMonthlyHiringTrends,
  computeOverviewKPIs,
  computeRecruitmentFunnel,
  computeRecruitmentSources,
  computeTimeToHireByDepartment,
  computeWorkforceDistribution,
  downloadCSV,
  filterCandidates,
  filterEmployeesForWindow,
} from '../utils/analytics';

function formatSignedPct(val: number | null): string {
  if (val === null) return '—';
  if (val > 0) return `+${val}%`;
  if (val < 0) return `${val}%`;
  return '0%';
}

function formatSignedNum(val: number | null, suffix = ''): string {
  if (val === null) return '—';
  if (val > 0) return `+${val}${suffix}`;
  return `${val}${suffix}`;
}

function getTrend(val: number | null): 'up' | 'down' | 'neutral' {
  if (val === null || val === 0) return 'neutral';
  return val > 0 ? 'up' : 'down';
}

export const OverviewPage: React.FC = () => {
  const {
    employees,
    candidates,
    vacancies,
    settings,
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

  const filteredEmployees = useMemo(
    () => filterEmployeesForWindow(employees, departmentFilter, dateRange),
    [employees, departmentFilter, dateRange]
  );

  const kpis = useMemo(
    () =>
      computeOverviewKPIs(
        employees,
        candidates,
        vacancies,
        departmentFilter,
        dateRange
      ),
    [employees, candidates, vacancies, departmentFilter, dateRange]
  );

  const funnelData = useMemo(
    () => computeRecruitmentFunnel(filteredCandidates),
    [filteredCandidates]
  );

  const monthlyTrends = useMemo(
    () => computeMonthlyHiringTrends(filteredCandidates, dateRange),
    [filteredCandidates, dateRange]
  );

  const deptHeadcount = useMemo(
    () => computeEmployeesByDepartment(filteredEmployees, departmentFilter),
    [filteredEmployees, departmentFilter]
  );

  const sourceData = useMemo(
    () => computeRecruitmentSources(filteredCandidates),
    [filteredCandidates]
  );

  const workforceDist = useMemo(
    () => computeWorkforceDistribution(filteredEmployees),
    [filteredEmployees]
  );

  const timeToHireDept = useMemo(
    () => computeTimeToHireByDepartment(filteredCandidates, departmentFilter),
    [filteredCandidates, departmentFilter]
  );

  const handleExportOverview = () => {
    const headers = ['Metric', 'Value', 'Comparison vs Prior Period'];
    const rows: Array<[string, string | number, string]> = [
      [
        'Total Employees',
        kpis.totalEmployees,
        kpis.employeesChangePct === null
          ? 'No prior baseline'
          : `${formatSignedPct(kpis.employeesChangePct)} vs ${kpis.comparisonLabel}`,
      ],
      [
        'Total Candidates',
        kpis.totalCandidates,
        kpis.candidatesChangePct === null
          ? 'Full history'
          : `${formatSignedPct(kpis.candidatesChangePct)} vs ${kpis.comparisonLabel}`,
      ],
      [
        'Open Positions',
        kpis.openPositions,
        kpis.openPositionsDelta === null
          ? 'Full history'
          : `${formatSignedNum(kpis.openPositionsDelta)} vs ${kpis.comparisonLabel}`,
      ],
      [
        'Hired Employees',
        kpis.hiredEmployees,
        kpis.hiredChangePct === null
          ? 'Full history'
          : `${formatSignedPct(kpis.hiredChangePct)} vs ${kpis.comparisonLabel}`,
      ],
      [
        'Average Time to Hire (Days)',
        kpis.avgTimeToHire === null ? 'N/A' : kpis.avgTimeToHire,
        kpis.timeToHireDeltaDays === null
          ? 'No prior baseline'
          : `${formatSignedNum(kpis.timeToHireDeltaDays, 'd')} vs ${kpis.comparisonLabel}`,
      ],
      [
        'Offer Acceptance Rate (%)',
        kpis.offerAcceptanceRate === null
          ? 'N/A'
          : `${kpis.offerAcceptanceRate}%`,
        kpis.offerAcceptanceDeltaPts === null
          ? 'No prior baseline'
          : `${formatSignedNum(kpis.offerAcceptanceDeltaPts, ' pts')} vs ${kpis.comparisonLabel}`,
      ],
    ];
    downloadCSV(
      `hr-overview-${departmentFilter.toLowerCase()}-${dateRange}.csv`,
      headers,
      rows
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-balance font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-[26px]">
            HR Analytics Overview
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor recruitment performance and workforce metrics.
          </p>
        </div>

        <FilterBar
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          department={departmentFilter}
          onDepartmentChange={setDepartmentFilter}
          actions={
            <button
              type="button"
              onClick={handleExportOverview}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white shadow-xs transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap shrink-0 sm:w-auto"
            >
              <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Export Report</span>
            </button>
          }
        />
      </div>

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KPICard
          title="Total Employees"
          value={kpis.totalEmployees}
          changeValue={
            kpis.employeesChangePct === null
              ? 'Baseline'
              : formatSignedPct(kpis.employeesChangePct)
          }
          comparisonText={
            kpis.employeesChangePct === null
              ? 'no prior headcount'
              : `vs ${kpis.comparisonLabel}`
          }
          trend={getTrend(kpis.employeesChangePct)}
          isPositiveGood
          icon={Users}
          isLoading={isUpdating}
        />
        <KPICard
          title="Total Candidates"
          value={kpis.totalCandidates}
          changeValue={
            kpis.candidatesChangePct === null
              ? 'All time'
              : formatSignedPct(kpis.candidatesChangePct)
          }
          comparisonText={
            kpis.candidatesChangePct === null
              ? 'full recorded pipeline'
              : `vs ${kpis.comparisonLabel}`
          }
          trend={getTrend(kpis.candidatesChangePct)}
          isPositiveGood
          icon={UserPlus}
          isLoading={isUpdating}
        />
        <KPICard
          title="Open Positions"
          value={kpis.openPositions}
          changeValue={
            kpis.openPositionsDelta === null
              ? 'Current'
              : formatSignedNum(kpis.openPositionsDelta)
          }
          comparisonText={
            kpis.openPositionsDelta === null
              ? 'active requisitions'
              : `open seats vs ${kpis.comparisonLabel}`
          }
          trend={getTrend(kpis.openPositionsDelta)}
          isPositiveGood={false}
          icon={Briefcase}
          isLoading={isUpdating}
        />
        <KPICard
          title="Hired Employees"
          value={kpis.hiredEmployees}
          changeValue={
            kpis.hiredChangePct === null
              ? 'All time'
              : formatSignedPct(kpis.hiredChangePct)
          }
          comparisonText={
            kpis.hiredChangePct === null
              ? 'total finalized hires'
              : `vs ${kpis.comparisonLabel}`
          }
          trend={getTrend(kpis.hiredChangePct)}
          isPositiveGood
          icon={UserCheck}
          isLoading={isUpdating}
        />
        <KPICard
          title="Average Time to Hire"
          value={kpis.avgTimeToHire === null ? '—' : `${kpis.avgTimeToHire}d`}
          changeValue={
            kpis.timeToHireDeltaDays === null
              ? 'No prior'
              : formatSignedNum(kpis.timeToHireDeltaDays, 'd')
          }
          comparisonText={
            kpis.timeToHireDeltaDays === null
              ? kpis.avgTimeToHire === null
                ? 'no hires in period'
                : 'prior period had 0 hires'
              : `vs ${kpis.comparisonLabel}`
          }
          trend={getTrend(kpis.timeToHireDeltaDays)}
          isPositiveGood={false}
          icon={Clock}
          isLoading={isUpdating}
        />
        <KPICard
          title="Offer Acceptance Rate"
          value={
            kpis.offerAcceptanceRate === null
              ? '—'
              : `${kpis.offerAcceptanceRate}%`
          }
          changeValue={
            kpis.offerAcceptanceDeltaPts === null
              ? 'No prior'
              : formatSignedNum(kpis.offerAcceptanceDeltaPts, ' pts')
          }
          comparisonText={
            kpis.offerAcceptanceDeltaPts === null
              ? kpis.offerAcceptanceRate === null
                ? 'no offers in period'
                : 'prior period had 0 offers'
              : `vs ${kpis.comparisonLabel}`
          }
          trend={getTrend(kpis.offerAcceptanceDeltaPts)}
          isPositiveGood
          icon={CheckCircle2}
          isLoading={isUpdating}
        />
      </div>

      {/* 6 Interactive Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          title="Recruitment Funnel"
          subtitle="Candidate progression and stage-to-stage conversion rates"
          isLoading={isUpdating}
          skeletonHeight={286}
        >
          <RecruitmentFunnelChart data={funnelData} />
        </ChartCard>

        <ChartCard
          title={
            dateRange === '30d'
              ? 'Weekly Hiring Trends (Last 30 Days)'
              : 'Monthly Hiring Trends'
          }
          subtitle="Applications received versus finalized hires"
          isLoading={isUpdating}
        >
          <MonthlyHiringTrendsChart data={monthlyTrends} />
        </ChartCard>

        <ChartCard
          title="Employees by Department"
          subtitle="Active headcount distribution across business units"
          isLoading={isUpdating}
        >
          <EmployeesByDeptChart data={deptHeadcount} />
        </ChartCard>

        <ChartCard
          title="Recruitment Sources"
          subtitle="Application volume and hires by sourcing channel"
          isLoading={isUpdating}
        >
          <RecruitmentSourcesChart data={sourceData} />
        </ChartCard>

        <ChartCard
          title="Workforce Distribution"
          subtitle="Employment status across active and period-exited staff"
          isLoading={isUpdating}
        >
          <WorkforceDistributionChart data={workforceDist} />
        </ChartCard>

        <ChartCard
          title="Time to Hire by Department"
          subtitle={`Average days from application to offer acceptance (Target: ${settings.targetTimeToHireDays}d)`}
          isLoading={isUpdating}
        >
          <TimeToHireByDeptChart
            data={timeToHireDept}
            targetDays={settings.targetTimeToHireDays}
          />
        </ChartCard>
      </div>
    </div>
  );
};
