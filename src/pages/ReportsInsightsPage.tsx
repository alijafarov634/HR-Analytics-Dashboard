import React, { useMemo } from 'react';
import { Download, Printer } from 'lucide-react';
import { ChartCard } from '../components/ChartCard';
import { FilterBar } from '../components/FilterBar';
import { useHRData } from '../context/HRDataContext';
import { useFilterTransition } from '../hooks/useFilterTransition';
import {
  computeHRPerformance,
  computeOverviewKPIs,
  computeRecruitmentFunnel,
  computeRecruitmentSources,
  computeTimeToHireByDepartment,
  computeWorkforceDistribution,
  downloadCSV,
  filterCandidates,
  filterEmployeesForWindow,
} from '../utils/analytics';

export const ReportsInsightsPage: React.FC = () => {
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

  const overviewKPIs = useMemo(
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

  const funnel = useMemo(
    () => computeRecruitmentFunnel(filteredCandidates),
    [filteredCandidates]
  );

  const sourceStats = useMemo(
    () => computeRecruitmentSources(filteredCandidates),
    [filteredCandidates]
  );

  const timeByDept = useMemo(
    () => computeTimeToHireByDepartment(filteredCandidates, departmentFilter),
    [filteredCandidates, departmentFilter]
  );

  const hrPerf = useMemo(
    () =>
      computeHRPerformance(employees, vacancies, departmentFilter, dateRange),
    [employees, vacancies, departmentFilter, dateRange]
  );

  const workforceStatus = useMemo(
    () => computeWorkforceDistribution(filteredEmployees),
    [filteredEmployees]
  );

  const handleExportSummaryCSV = () => {
    const headers = [
      'Department',
      'Active Headcount',
      'Avg Tenure (Yrs)',
      'Turnover Rate (%)',
      'Open Positions',
      'Hires (Period)',
      'Avg Time to Hire (Days)',
    ];
    const rows = hrPerf.departmentPerformance.map((d) => {
      const tth = timeByDept.find((t) => t.department === d.department);
      return [
        d.department,
        d.headcount,
        d.avgTenure,
        d.turnoverRate,
        d.openRoles,
        tth?.hires ?? 0,
        tth?.avgDays ?? 0,
      ];
    });
    downloadCSV(
      `meridian-hr-executive-report-${departmentFilter.toLowerCase()}-${dateRange}.csv`,
      headers,
      rows
    );
  };

  const handleExportCandidatesCSV = () => {
    const headers = [
      'Candidate ID',
      'Full Name',
      'Position',
      'Department',
      'Application Date',
      'Stage',
      'Source',
      'Status',
      'Days to Hire',
    ];
    const rows = filteredCandidates.map((c) => [
      c.id,
      c.fullName,
      c.position,
      c.department,
      c.applicationDate,
      c.stage,
      c.source,
      c.status,
      c.daysToHire ?? '',
    ]);
    downloadCSV(
      `candidates-export-${departmentFilter.toLowerCase()}-${dateRange}.csv`,
      headers,
      rows
    );
  };

  const handleExportEmployeesCSV = () => {
    const headers = [
      'Employee ID',
      'Full Name',
      'Job Title',
      'Department',
      'Hire Date',
      'Employment Type',
      'Employment Status',
      'Annual Salary',
    ];
    const rows = filteredEmployees.map((e) => [
      e.id,
      e.fullName,
      e.jobTitle,
      e.department,
      e.hireDate,
      e.employmentType,
      e.employmentStatus,
      e.annualSalary,
    ]);
    downloadCSV(
      `employees-export-${departmentFilter.toLowerCase()}-${dateRange}.csv`,
      headers,
      rows
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-balance font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-[26px]">
            Reports & Insights
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Executive HR summary for {settings.organizationName} · Printable and CSV-exportable.
          </p>
        </div>

        <FilterBar
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          department={departmentFilter}
          onDepartmentChange={setDepartmentFilter}
          actions={
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <button
                type="button"
                onClick={handleExportSummaryCSV}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 whitespace-nowrap shrink-0 sm:flex-none"
              >
                <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Export Summary CSV</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white shadow-xs transition-colors hover:bg-blue-700 whitespace-nowrap shrink-0 sm:flex-none"
              >
                <Printer className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Print Report</span>
              </button>
            </div>
          }
        />
      </div>

      {/* Quick CSV Dataset Exports */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm">
        <span className="font-medium text-slate-700">
          Direct Dataset Exports (Filtered)
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCandidatesCSV}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Candidates CSV ({filteredCandidates.length})</span>
          </button>
          <button
            type="button"
            onClick={handleExportEmployeesCSV}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Employees CSV ({filteredEmployees.length})</span>
          </button>
        </div>
      </div>

      {/* Section 1: Recruitment Performance Summary */}
      <ChartCard
        title="1. Recruitment Performance Summary"
        subtitle="Pipeline volume, conversion funnel, and benchmark comparison"
        isLoading={isUpdating}
        skeletonHeight={240}
      >
        <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-5 sm:grid-cols-4 tabular-nums">
          <div>
            <p className="text-xs text-slate-500">Total Candidates</p>
            <p className="mt-1 font-display text-xl font-bold text-slate-900">
              {overviewKPIs.totalCandidates}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Hires Completed</p>
            <p className="mt-1 font-display text-xl font-bold text-emerald-700">
              {overviewKPIs.hiredEmployees}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Avg. Time to Hire</p>
            <p className="mt-1 font-display text-xl font-bold text-slate-900">
              {overviewKPIs.avgTimeToHire === null
                ? '—'
                : `${overviewKPIs.avgTimeToHire}d`}{' '}
              <span className="text-xs font-normal text-slate-500">
                (Target {settings.targetTimeToHireDays}d)
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Offer Acceptance</p>
            <p className="mt-1 font-display text-xl font-bold text-blue-700">
              {overviewKPIs.offerAcceptanceRate === null
                ? '—'
                : `${overviewKPIs.offerAcceptanceRate}%`}{' '}
              <span className="text-xs font-normal text-slate-500">
                (Target {settings.targetOfferAcceptanceRate}%)
              </span>
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                <th className="py-2.5 pr-4">Funnel Stage</th>
                <th className="py-2.5 px-4 text-right">Candidates Reached</th>
                <th className="py-2.5 px-4 text-right">Stage Conversion</th>
                <th className="py-2.5 pl-4 text-right">Cumulative Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 tabular-nums">
              {funnel.map((step) => (
                <tr key={step.stage}>
                  <td className="py-2.5 pr-4 font-medium text-slate-900">
                    {step.stage}
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-700">
                    {step.count}
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-700">
                    {step.conversionFromPrev}%
                  </td>
                  <td className="py-2.5 pl-4 text-right font-semibold text-blue-700">
                    {step.conversionFromTop}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* Section 2: Department Comparison */}
      <ChartCard
        title="2. Department Comparison"
        subtitle="Cross-departmental headcount, open requisitions, hiring velocity, and attrition"
        isLoading={isUpdating}
        skeletonHeight={240}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                <th className="py-2.5 pr-4">Department</th>
                <th className="py-2.5 px-4 text-right">Active Headcount</th>
                <th className="py-2.5 px-4 text-right">Open Roles</th>
                <th className="py-2.5 px-4 text-right">Hires (Period)</th>
                <th className="py-2.5 px-4 text-right">Avg. Time to Hire</th>
                <th className="py-2.5 px-4 text-right">Avg. Tenure</th>
                <th className="py-2.5 pl-4 text-right">Turnover Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 tabular-nums">
              {hrPerf.departmentPerformance.map((dept) => {
                const tth = timeByDept.find(
                  (t) => t.department === dept.department
                );
                return (
                  <tr key={dept.department}>
                    <td className="py-2.5 pr-4 font-medium text-slate-900">
                      {dept.department}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-700">
                      {dept.headcount}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-700">
                      {dept.openRoles}
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-emerald-700">
                      {tth?.hires ?? 0}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-700">
                      {tth && tth.avgDays > 0 ? `${tth.avgDays}d` : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-700">
                      {dept.avgTenure} yrs
                    </td>
                    <td className="py-2.5 pl-4 text-right text-slate-700">
                      {dept.turnoverRate}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* Section 3 & 4 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          title="3. Hiring Source Effectiveness"
          subtitle="Candidate yield and speed-to-hire by channel"
          isLoading={isUpdating}
          skeletonHeight={220}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                  <th className="py-2.5 pr-3">Channel</th>
                  <th className="py-2.5 px-3 text-right">Apps</th>
                  <th className="py-2.5 px-3 text-right">Hires</th>
                  <th className="py-2.5 px-3 text-right">Conv. %</th>
                  <th className="py-2.5 pl-3 text-right">Avg. Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 tabular-nums">
                {sourceStats.map((s) => (
                  <tr key={s.source}>
                    <td className="py-2.5 pr-3 font-medium text-slate-900">
                      {s.source}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700">
                      {s.applications}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">
                      {s.hires}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-blue-700">
                      {s.conversionRate}%
                    </td>
                    <td className="py-2.5 pl-3 text-right text-slate-600">
                      {s.avgDaysToHire > 0 ? `${s.avgDaysToHire}d` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>

        <ChartCard
          title="4. Workforce Statistics"
          subtitle="Employment status and contract type breakdown"
          isLoading={isUpdating}
          skeletonHeight={220}
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold text-slate-500">
                By Employment Status
              </h3>
              <dl className="mt-2.5 divide-y divide-slate-100 text-sm tabular-nums">
                {workforceStatus.map((item) => (
                  <div
                    key={item.status}
                    className="flex items-center justify-between py-2"
                  >
                    <dt className="text-slate-700">{item.status}</dt>
                    <dd className="font-semibold text-slate-900">
                      {item.count}{' '}
                      <span className="font-normal text-slate-400">
                        ({item.percentage}%)
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-slate-500">
                By Employment Type
              </h3>
              <dl className="mt-2.5 divide-y divide-slate-100 text-sm tabular-nums">
                {hrPerf.employmentTypeDistribution.map((item) => (
                  <div
                    key={item.type}
                    className="flex items-center justify-between py-2"
                  >
                    <dt className="text-slate-700">{item.type}</dt>
                    <dd className="font-semibold text-slate-900">
                      {item.count}{' '}
                      <span className="font-normal text-slate-400">
                        ({item.percentage}%)
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};
