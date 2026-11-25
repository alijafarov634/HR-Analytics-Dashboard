import { REFERENCE_DATE_STR } from '../data/mockData';
import {
  Candidate,
  DateRangeOption,
  Department,
  DEPARTMENTS,
  Employee,
  EmploymentStatus,
  EmploymentType,
  JobVacancy,
  RECRUITMENT_SOURCES,
  RecruitmentSource,
} from '../types/hr';

const REF_DATE = new Date(`${REFERENCE_DATE_STR}T23:59:59Z`);

export interface DateWindowBounds {
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
  label: string;
  isAllTime: boolean;
}

export function getDateWindowBounds(range: DateRangeOption): DateWindowBounds {
  const end = new Date(REF_DATE);

  if (range === 'all') {
    const start = new Date('2025-01-01T00:00:00Z');
    const prevStart = new Date('2024-01-01T00:00:00Z');
    const prevEnd = new Date('2024-12-31T23:59:59Z');
    return {
      start,
      end,
      prevStart,
      prevEnd,
      label: 'Jan 2025 baseline',
      isAllTime: true,
    };
  }

  const daysMap: Record<Exclude<DateRangeOption, 'all'>, number> = {
    '30d': 30,
    '90d': 90,
    '6m': 180,
    '12m': 365,
  };

  const days = daysMap[range];
  const ms = days * 24 * 60 * 60 * 1000;
  const start = new Date(end.getTime() - ms);
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - ms);

  const labelMap: Record<Exclude<DateRangeOption, 'all'>, string> = {
    '30d': 'prev. 30 days',
    '90d': 'prev. 90 days',
    '6m': 'prev. 6 months',
    '12m': 'prev. 12 months',
  };

  return {
    start,
    end,
    prevStart,
    prevEnd,
    label: labelMap[range],
    isAllTime: false,
  };
}

export function isDateInRange(dateStr: string, start: Date, end: Date): boolean {
  const d = new Date(`${dateStr}T12:00:00Z`);
  return d >= start && d <= end;
}

export function filterCandidates(
  candidates: Candidate[],
  department: Department | 'All',
  dateRange: DateRangeOption
): Candidate[] {
  const { start, end, isAllTime } = getDateWindowBounds(dateRange);
  return candidates.filter((c) => {
    const deptOk = department === 'All' || c.department === department;
    const dateOk = isAllTime || isDateInRange(c.applicationDate, start, end);
    return deptOk && dateOk;
  });
}

export function filterEmployees(
  employees: Employee[],
  department: Department | 'All'
): Employee[] {
  return employees.filter(
    (e) => department === 'All' || e.department === department
  );
}

/**
 * Returns employees who were active during or exited within the selected date window.
 */
export function filterEmployeesForWindow(
  employees: Employee[],
  department: Department | 'All',
  dateRange: DateRangeOption
): Employee[] {
  const { start, end, isAllTime } = getDateWindowBounds(dateRange);
  return employees.filter((e) => {
    if (department !== 'All' && e.department !== department) return false;
    const hiredOnOrBeforeEnd = new Date(`${e.hireDate}T12:00:00Z`) <= end;
    if (!hiredOnOrBeforeEnd) return false;
    if (isAllTime) return true;
    if (!e.exitDate) return true;
    // Exited during the selected window
    return new Date(`${e.exitDate}T12:00:00Z`) >= start;
  });
}

export function filterVacancies(
  vacancies: JobVacancy[],
  department: Department | 'All'
): JobVacancy[] {
  return vacancies.filter(
    (v) => department === 'All' || v.department === department
  );
}

export function calcPctChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export interface OverviewKPIs {
  totalEmployees: number;
  employeesChangePct: number | null;
  totalCandidates: number;
  candidatesChangePct: number | null;
  openPositions: number;
  openPositionsDelta: number | null;
  hiredEmployees: number;
  hiredChangePct: number | null;
  avgTimeToHire: number | null;
  timeToHireDeltaDays: number | null;
  offerAcceptanceRate: number | null;
  offerAcceptanceDeltaPts: number | null;
  comparisonLabel: string;
  isAllTime: boolean;
}

export function computeOverviewKPIs(
  allEmployees: Employee[],
  allCandidates: Candidate[],
  allVacancies: JobVacancy[],
  department: Department | 'All',
  dateRange: DateRangeOption
): OverviewKPIs {
  const { start, prevStart, prevEnd, end, label, isAllTime } =
    getDateWindowBounds(dateRange);

  const deptEmployees = filterEmployees(allEmployees, department);
  const currentEmployees = deptEmployees.filter((e) => {
    const hired = new Date(`${e.hireDate}T12:00:00Z`) <= end;
    const notExited = !e.exitDate || new Date(`${e.exitDate}T12:00:00Z`) > end;
    return hired && notExited && e.employmentStatus !== 'Inactive';
  });

  // Headcount at start of selected window (hired before start and not exited before start)
  const headcountAtStart = deptEmployees.filter((e) => {
    const hiredBeforeStart = new Date(`${e.hireDate}T12:00:00Z`) < start;
    const notExitedBeforeStart =
      !e.exitDate || new Date(`${e.exitDate}T12:00:00Z`) >= start;
    return hiredBeforeStart && notExitedBeforeStart;
  }).length;

  const currCandidates = filterCandidates(allCandidates, department, dateRange);
  const prevCandidates = isAllTime
    ? []
    : allCandidates.filter((c) => {
        const deptOk = department === 'All' || c.department === department;
        return deptOk && isDateInRange(c.applicationDate, prevStart, prevEnd);
      });

  const deptVacancies = filterVacancies(allVacancies, department);
  const openPositions = deptVacancies
    .filter(
      (v) =>
        v.status === 'Open' && new Date(`${v.openedDate}T12:00:00Z`) <= end
    )
    .reduce((acc, v) => acc + Math.max(0, v.openings - v.filled), 0);

  // Seats open at the end of the prior period (apples-to-apples seat count)
  const prevOpenPositions = isAllTime
    ? null
    : deptVacancies
        .filter((v) => {
          const openedBeforePrevEnd =
            new Date(`${v.openedDate}T12:00:00Z`) <= prevEnd;
          const notClosedBeforePrevEnd =
            !v.closedDate || new Date(`${v.closedDate}T12:00:00Z`) > prevEnd;
          return (
            openedBeforePrevEnd &&
            notClosedBeforePrevEnd &&
            v.status !== 'On Hold'
          );
        })
        .reduce((acc, v) => acc + v.openings, 0);

  const currHired = currCandidates.filter((c) => c.stage === 'Hired');
  const prevHired = prevCandidates.filter((c) => c.stage === 'Hired');

  const currHireDays = currHired
    .map((c) => c.daysToHire)
    .filter((d): d is number => typeof d === 'number');
  const avgTimeToHire =
    currHireDays.length > 0
      ? Math.round(
          (currHireDays.reduce((a, b) => a + b, 0) / currHireDays.length) * 10
        ) / 10
      : null;

  const prevHireDays = prevHired
    .map((c) => c.daysToHire)
    .filter((d): d is number => typeof d === 'number');
  const prevAvgTimeToHire =
    prevHireDays.length > 0
      ? prevHireDays.reduce((a, b) => a + b, 0) / prevHireDays.length
      : null;

  const currOffers = currCandidates.filter(
    (c) => c.offerExtended || c.stage === 'Offer' || c.stage === 'Hired'
  );
  const currAccepted = currOffers.filter(
    (c) => c.offerAccepted || c.stage === 'Hired'
  );
  const offerAcceptanceRate =
    currOffers.length > 0
      ? Math.round((currAccepted.length / currOffers.length) * 1000) / 10
      : null;

  const prevOffers = prevCandidates.filter(
    (c) => c.offerExtended || c.stage === 'Offer' || c.stage === 'Hired'
  );
  const prevAccepted = prevOffers.filter(
    (c) => c.offerAccepted || c.stage === 'Hired'
  );
  const prevOfferAcceptanceRate =
    prevOffers.length > 0
      ? (prevAccepted.length / prevOffers.length) * 100
      : null;

  return {
    totalEmployees: currentEmployees.length,
    employeesChangePct: calcPctChange(
      currentEmployees.length,
      headcountAtStart
    ),
    totalCandidates: currCandidates.length,
    candidatesChangePct: isAllTime
      ? null
      : calcPctChange(currCandidates.length, prevCandidates.length),
    openPositions,
    openPositionsDelta:
      prevOpenPositions === null ? null : openPositions - prevOpenPositions,
    hiredEmployees: currHired.length,
    hiredChangePct: isAllTime
      ? null
      : calcPctChange(currHired.length, prevHired.length),
    avgTimeToHire,
    timeToHireDeltaDays:
      avgTimeToHire !== null && prevAvgTimeToHire !== null
        ? Math.round((avgTimeToHire - prevAvgTimeToHire) * 10) / 10
        : null,
    offerAcceptanceRate,
    offerAcceptanceDeltaPts:
      offerAcceptanceRate !== null && prevOfferAcceptanceRate !== null
        ? Math.round((offerAcceptanceRate - prevOfferAcceptanceRate) * 10) / 10
        : null,
    comparisonLabel: label,
    isAllTime,
  };
}

export interface RecruitmentAnalyticsKPIs {
  totalApplications: number;
  applicationsChangePct: number | null;
  totalInterviews: number;
  interviewsChangePct: number | null;
  totalOffers: number;
  offersChangePct: number | null;
  totalHires: number;
  hiresChangePct: number | null;
  conversionRate: number;
  conversionDeltaPts: number | null;
  avgTimeToHire: number | null;
  timeToHireDeltaDays: number | null;
  comparisonLabel: string;
}

const STAGE_ORDER: Record<
  'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired',
  number
> = {
  Applied: 1,
  Screening: 2,
  Interview: 3,
  Offer: 4,
  Hired: 5,
};

export function computeRecruitmentAnalyticsKPIs(
  allCandidates: Candidate[],
  department: Department | 'All',
  dateRange: DateRangeOption
): RecruitmentAnalyticsKPIs {
  const { prevStart, prevEnd, label, isAllTime } =
    getDateWindowBounds(dateRange);

  const curr = filterCandidates(allCandidates, department, dateRange);
  const prev = isAllTime
    ? []
    : allCandidates.filter((c) => {
        const deptOk = department === 'All' || c.department === department;
        return deptOk && isDateInRange(c.applicationDate, prevStart, prevEnd);
      });

  const totalApplications = curr.length;
  const prevApps = prev.length;

  const totalInterviews = curr.filter(
    (c) => STAGE_ORDER[c.highestStageReached] >= STAGE_ORDER.Interview
  ).length;
  const prevInterviews = prev.filter(
    (c) => STAGE_ORDER[c.highestStageReached] >= STAGE_ORDER.Interview
  ).length;

  const totalOffers = curr.filter(
    (c) => STAGE_ORDER[c.highestStageReached] >= STAGE_ORDER.Offer
  ).length;
  const prevOffers = prev.filter(
    (c) => STAGE_ORDER[c.highestStageReached] >= STAGE_ORDER.Offer
  ).length;

  const currHired = curr.filter((c) => c.stage === 'Hired');
  const prevHired = prev.filter((c) => c.stage === 'Hired');

  const totalHires = currHired.length;
  const prevHiresCount = prevHired.length;

  const conversionRate =
    totalApplications > 0
      ? Math.round((totalHires / totalApplications) * 1000) / 10
      : 0;
  const prevConversionRate =
    !isAllTime && prevApps > 0
      ? Math.round((prevHiresCount / prevApps) * 1000) / 10
      : null;

  const hireDays = currHired
    .map((c) => c.daysToHire)
    .filter((d): d is number => typeof d === 'number');
  const avgTimeToHire =
    hireDays.length > 0
      ? Math.round(
          (hireDays.reduce((a, b) => a + b, 0) / hireDays.length) * 10
        ) / 10
      : null;

  const prevHireDays = prevHired
    .map((c) => c.daysToHire)
    .filter((d): d is number => typeof d === 'number');
  const prevAvgTime =
    prevHireDays.length > 0
      ? prevHireDays.reduce((a, b) => a + b, 0) / prevHireDays.length
      : null;

  return {
    totalApplications,
    applicationsChangePct: isAllTime
      ? null
      : calcPctChange(totalApplications, prevApps),
    totalInterviews,
    interviewsChangePct: isAllTime
      ? null
      : calcPctChange(totalInterviews, prevInterviews),
    totalOffers,
    offersChangePct: isAllTime
      ? null
      : calcPctChange(totalOffers, prevOffers),
    totalHires,
    hiresChangePct: isAllTime
      ? null
      : calcPctChange(totalHires, prevHiresCount),
    conversionRate,
    conversionDeltaPts:
      prevConversionRate !== null
        ? Math.round((conversionRate - prevConversionRate) * 10) / 10
        : null,
    avgTimeToHire,
    timeToHireDeltaDays:
      avgTimeToHire !== null && prevAvgTime !== null
        ? Math.round((avgTimeToHire - prevAvgTime) * 10) / 10
        : null,
    comparisonLabel: label,
  };
}

export interface FunnelDatum {
  stage: 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired';
  previousStage: 'Applied' | 'Screening' | 'Interview' | 'Offer' | null;
  count: number;
  conversionFromPrev: number;
  conversionFromTop: number;
  droppedCount: number;
  dropOffRate: number;
  currentlyInStage: number;
  rejectedAtStage: number;
  labelText: string;
}

export function computeRecruitmentFunnel(candidates: Candidate[]): FunnelDatum[] {
  const stages: Array<'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired'> = [
    'Applied',
    'Screening',
    'Interview',
    'Offer',
    'Hired',
  ];

  const getEffectiveRank = (c: Candidate): number => {
    const highestRank = STAGE_ORDER[c.highestStageReached] || 1;
    if (c.stage === 'Rejected') {
      return highestRank;
    }
    const currentRank = STAGE_ORDER[c.stage] || 1;
    return Math.max(highestRank, currentRank);
  };

  const counts = stages.map((stage) => {
    const threshold = STAGE_ORDER[stage];
    return candidates.filter((c) => getEffectiveRank(c) >= threshold).length;
  });

  const topCount = counts[0];

  return stages.map((stage, idx) => {
    const count = counts[idx];
    const prevStage = idx === 0 ? null : (stages[idx - 1] as FunnelDatum['previousStage']);
    const prevCount = idx === 0 ? count : counts[idx - 1];

    const conversionFromPrev =
      idx === 0
        ? 100
        : prevCount > 0
        ? Math.round((count / prevCount) * 1000) / 10
        : 0;
    const conversionFromTop =
      topCount > 0 ? Math.round((count / topCount) * 1000) / 10 : 0;

    const droppedCount = idx === 0 ? 0 : Math.max(0, prevCount - count);
    const dropOffRate =
      idx === 0
        ? 0
        : prevCount > 0
        ? Math.round((droppedCount / prevCount) * 1000) / 10
        : 0;

    const currentlyInStage = candidates.filter(
      (c) => c.stage === stage && c.status !== 'Withdrawn'
    ).length;

    const rejectedAtStage = candidates.filter(
      (c) =>
        (c.stage === 'Rejected' || c.status === 'Withdrawn') &&
        getEffectiveRank(c) === STAGE_ORDER[stage]
    ).length;

    return {
      stage,
      previousStage: prevStage,
      count,
      conversionFromPrev,
      conversionFromTop,
      droppedCount,
      dropOffRate,
      currentlyInStage,
      rejectedAtStage,
      labelText: `${count} (${conversionFromTop}%)`,
    };
  });
}

export interface MonthlyTrendDatum {
  monthKey: string;
  month: string;
  applications: number;
  interviews: number;
  offers: number;
  hires: number;
}

export function computeMonthlyHiringTrends(
  candidates: Candidate[],
  dateRange: DateRangeOption
): MonthlyTrendDatum[] {
  const { start, end, isAllTime } = getDateWindowBounds(dateRange);

  // For 30-day window, show 4 weekly intervals covering [start, end] so every candidate fits cleanly
  if (dateRange === '30d') {
    const totalMs = end.getTime() - start.getTime();
    const stepMs = totalMs / 4;
    const buckets: MonthlyTrendDatum[] = [];

    for (let i = 0; i < 4; i++) {
      const bStart = new Date(start.getTime() + i * stepMs);
      const bEnd =
        i === 3 ? end : new Date(start.getTime() + (i + 1) * stepMs - 1);
      const startFmt = bStart.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      });
      const endFmt = bEnd.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      });
      const inBucket = candidates.filter((c) => {
        const d = new Date(`${c.applicationDate}T12:00:00Z`);
        return d >= bStart && d <= bEnd;
      });
      buckets.push({
        monthKey: `W${i + 1}`,
        month: `${startFmt}–${endFmt}`,
        applications: inBucket.length,
        interviews: inBucket.filter(
          (c) => STAGE_ORDER[c.highestStageReached] >= STAGE_ORDER.Interview
        ).length,
        offers: inBucket.filter(
          (c) => STAGE_ORDER[c.highestStageReached] >= STAGE_ORDER.Offer
        ).length,
        hires: inBucket.filter((c) => c.stage === 'Hired').length,
      });
    }
    return buckets;
  }

  // Monthly buckets from start's UTC month (or earliest candidate month for 'all') through REF_DATE's month
  let firstYear = start.getUTCFullYear();
  let firstMonth = start.getUTCMonth();

  if (isAllTime && candidates.length > 0) {
    const earliest = [...candidates]
      .map((c) => c.applicationDate)
      .sort()[0];
    const earliestDate = new Date(`${earliest}T12:00:00Z`);
    firstYear = earliestDate.getUTCFullYear();
    firstMonth = earliestDate.getUTCMonth();
  }

  const endYear = end.getUTCFullYear();
  const endMonth = end.getUTCMonth();

  const buckets: Array<{ monthKey: string; month: string }> = [];
  let cur = new Date(Date.UTC(firstYear, firstMonth, 1));
  const last = new Date(Date.UTC(endYear, endMonth, 1));

  while (cur <= last) {
    const yyyy = cur.getUTCFullYear();
    const mm = String(cur.getUTCMonth() + 1).padStart(2, '0');
    const monthKey = `${yyyy}-${mm}`;
    const monthLabel = cur.toLocaleString('en-US', {
      month: 'short',
      year: '2-digit',
      timeZone: 'UTC',
    });
    buckets.push({ monthKey, month: monthLabel });
    cur = new Date(Date.UTC(yyyy, cur.getUTCMonth() + 1, 1));
  }

  return buckets.map(({ monthKey, month }) => {
    const inMonth = candidates.filter((c) =>
      c.applicationDate.startsWith(monthKey)
    );
    return {
      monthKey,
      month,
      applications: inMonth.length,
      interviews: inMonth.filter(
        (c) => STAGE_ORDER[c.highestStageReached] >= STAGE_ORDER.Interview
      ).length,
      offers: inMonth.filter(
        (c) => STAGE_ORDER[c.highestStageReached] >= STAGE_ORDER.Offer
      ).length,
      hires: inMonth.filter((c) => c.stage === 'Hired').length,
    };
  });
}

export interface DepartmentHeadcountDatum {
  department: Department;
  count: number;
  active: number;
  probation: number;
  onLeave: number;
  inactive: number;
  percentage: number;
}

export function computeEmployeesByDepartment(
  employees: Employee[],
  selectedDept: Department | 'All' = 'All'
): DepartmentHeadcountDatum[] {
  const depts =
    selectedDept === 'All' ? DEPARTMENTS : [selectedDept];
  const currentTotal = employees.filter(
    (e) =>
      (selectedDept === 'All' || e.department === selectedDept) &&
      e.employmentStatus !== 'Inactive'
  ).length;

  return depts.map((dept) => {
    const deptEmps = employees.filter((e) => e.department === dept);
    const active = deptEmps.filter((e) => e.employmentStatus === 'Active').length;
    const probation = deptEmps.filter(
      (e) => e.employmentStatus === 'Probation'
    ).length;
    const onLeave = deptEmps.filter(
      (e) => e.employmentStatus === 'On Leave'
    ).length;
    const inactive = deptEmps.filter(
      (e) => e.employmentStatus === 'Inactive'
    ).length;
    const current = active + probation + onLeave;
    return {
      department: dept,
      count: current,
      active,
      probation,
      onLeave,
      inactive,
      percentage:
        currentTotal > 0 ? Math.round((current / currentTotal) * 1000) / 10 : 0,
    };
  });
}

export interface SourcePerformanceDatum {
  source: RecruitmentSource;
  applications: number;
  interviews: number;
  offers: number;
  hires: number;
  conversionRate: number;
  avgDaysToHire: number;
}

export function computeRecruitmentSources(
  candidates: Candidate[]
): SourcePerformanceDatum[] {
  return RECRUITMENT_SOURCES.map((source) => {
    const list = candidates.filter((c) => c.source === source);
    const interviews = list.filter(
      (c) => STAGE_ORDER[c.highestStageReached] >= STAGE_ORDER.Interview
    ).length;
    const offers = list.filter(
      (c) => STAGE_ORDER[c.highestStageReached] >= STAGE_ORDER.Offer
    ).length;
    const hired = list.filter((c) => c.stage === 'Hired');
    const hireDays = hired
      .map((c) => c.daysToHire)
      .filter((d): d is number => typeof d === 'number');

    return {
      source,
      applications: list.length,
      interviews,
      offers,
      hires: hired.length,
      conversionRate:
        list.length > 0
          ? Math.round((hired.length / list.length) * 1000) / 10
          : 0,
      avgDaysToHire:
        hireDays.length > 0
          ? Math.round(
              (hireDays.reduce((a, b) => a + b, 0) / hireDays.length) * 10
            ) / 10
          : 0,
    };
  });
}

export interface WorkforceDistributionDatum {
  status: EmploymentStatus;
  count: number;
  percentage: number;
}

export function computeWorkforceDistribution(
  employees: Employee[]
): WorkforceDistributionDatum[] {
  const statuses: EmploymentStatus[] = [
    'Active',
    'On Leave',
    'Probation',
    'Inactive',
  ];
  const total = employees.length || 1;
  return statuses.map((status) => {
    const count = employees.filter((e) => e.employmentStatus === status).length;
    return {
      status,
      count,
      percentage: Math.round((count / total) * 1000) / 10,
    };
  });
}

export interface TimeToHireByDeptDatum {
  department: Department;
  avgDays: number;
  hires: number;
}

export function computeTimeToHireByDepartment(
  candidates: Candidate[],
  selectedDept: Department | 'All' = 'All'
): TimeToHireByDeptDatum[] {
  const depts = selectedDept === 'All' ? DEPARTMENTS : [selectedDept];
  return depts.map((department) => {
    const hired = candidates.filter(
      (c) =>
        c.department === department &&
        c.stage === 'Hired' &&
        typeof c.daysToHire === 'number'
    );
    const avgDays =
      hired.length > 0
        ? Math.round(
            (hired.reduce((acc, c) => acc + (c.daysToHire || 0), 0) /
              hired.length) *
              10
          ) / 10
        : 0;
    return {
      department,
      avgDays,
      hires: hired.length,
    };
  });
}

export function computeEmployeeTenureYears(
  emp: Employee,
  asOfDate: Date = REF_DATE
): number {
  const start = new Date(`${emp.hireDate}T12:00:00Z`);
  const exitD = emp.exitDate ? new Date(`${emp.exitDate}T12:00:00Z`) : null;
  const end = exitD && exitD < asOfDate ? exitD : asOfDate;
  const diffYears =
    (end.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  return Math.max(0.1, Math.round(diffYears * 10) / 10);
}

export interface HRPerformanceMetrics {
  turnoverRate: number;
  turnoverDeltaPts: number | null;
  retentionRate: number;
  retentionDeltaPts: number | null;
  avgTenureYears: number;
  tenureDeltaYears: number | null;
  activeHeadcount: number;
  headcountChangePct: number | null;
  totalExited: number;
  comparisonLabel: string;
  employmentTypeDistribution: Array<{
    type: EmploymentType;
    count: number;
    percentage: number;
  }>;
  monthlyTurnoverTrends: Array<{
    month: string;
    turnoverRate: number;
    retentionRate: number;
    exits: number;
    headcount: number;
  }>;
  departmentPerformance: Array<{
    department: Department;
    headcount: number;
    avgTenure: number;
    turnoverRate: number;
    avgPerformance: number;
    openRoles: number;
  }>;
}

export function computeHRPerformance(
  employees: Employee[],
  vacancies: JobVacancy[],
  department: Department | 'All',
  dateRange: DateRangeOption = '12m'
): HRPerformanceMetrics {
  const { start, end, prevStart, prevEnd, label, isAllTime } =
    getDateWindowBounds(dateRange);
  const filtered = filterEmployees(employees, department);

  const activeEmps = filtered.filter((e) => {
    const hired = new Date(`${e.hireDate}T12:00:00Z`) <= end;
    const notExited = !e.exitDate || new Date(`${e.exitDate}T12:00:00Z`) > end;
    return hired && notExited && e.employmentStatus !== 'Inactive';
  });

  const headcountAtStart = filtered.filter((e) => {
    const hired = new Date(`${e.hireDate}T12:00:00Z`) < start;
    const notExited =
      !e.exitDate || new Date(`${e.exitDate}T12:00:00Z`) >= start;
    return hired && notExited;
  }).length;

  const exitedInPeriod = filtered.filter((e) => {
    if (!e.exitDate) return false;
    return isAllTime ? true : isDateInRange(e.exitDate, start, end);
  });

  const avgHeadcount =
    headcountAtStart + activeEmps.length > 0
      ? (headcountAtStart + activeEmps.length) / 2
      : activeEmps.length || 1;
  const turnoverRate =
    Math.round((exitedInPeriod.length / avgHeadcount) * 1000) / 10;
  const retentionRate = Math.max(
    0,
    Math.round((100 - turnoverRate) * 10) / 10
  );

  // Previous period comparison
  const headcountAtPrevStart = filtered.filter((e) => {
    const hired = new Date(`${e.hireDate}T12:00:00Z`) < prevStart;
    const notExited =
      !e.exitDate || new Date(`${e.exitDate}T12:00:00Z`) >= prevStart;
    return hired && notExited;
  }).length;

  const exitedInPrev = isAllTime
    ? []
    : filtered.filter(
        (e) => e.exitDate && isDateInRange(e.exitDate, prevStart, prevEnd)
      );

  const prevAvgHeadcount =
    headcountAtPrevStart + headcountAtStart > 0
      ? (headcountAtPrevStart + headcountAtStart) / 2
      : 0;

  const prevTurnoverRate =
    !isAllTime && prevAvgHeadcount > 0
      ? Math.round((exitedInPrev.length / prevAvgHeadcount) * 1000) / 10
      : null;

  const turnoverDeltaPts =
    prevTurnoverRate !== null
      ? Math.round((turnoverRate - prevTurnoverRate) * 10) / 10
      : null;

  const retentionDeltaPts =
    turnoverDeltaPts !== null
      ? Math.round(-turnoverDeltaPts * 10) / 10
      : null;

  const tenures = activeEmps.map((e) => computeEmployeeTenureYears(e, end));
  const avgTenureYears =
    tenures.length > 0
      ? Math.round(
          (tenures.reduce((a, b) => a + b, 0) / tenures.length) * 10
        ) / 10
      : 0;

  const prevActiveEmps = isAllTime
    ? []
    : filtered.filter((e) => {
        const hired = new Date(`${e.hireDate}T12:00:00Z`) <= prevEnd;
        const notExited =
          !e.exitDate || new Date(`${e.exitDate}T12:00:00Z`) > prevEnd;
        return hired && notExited;
      });
  const prevTenures = prevActiveEmps.map((e) =>
    computeEmployeeTenureYears(e, prevEnd)
  );
  const prevAvgTenure =
    prevTenures.length > 0
      ? prevTenures.reduce((a, b) => a + b, 0) / prevTenures.length
      : null;
  const tenureDeltaYears =
    prevAvgTenure !== null
      ? Math.round((avgTenureYears - prevAvgTenure) * 10) / 10
      : null;

  const types: EmploymentType[] = [
    'Full-Time',
    'Part-Time',
    'Contract',
    'Intern',
  ];
  const totalCurrent = activeEmps.length || 1;
  const employmentTypeDistribution = types.map((type) => {
    const count = activeEmps.filter((e) => e.employmentType === type).length;
    return {
      type,
      count,
      percentage: Math.round((count / totalCurrent) * 1000) / 10,
    };
  });

  // Monthly turnover trends aligned to selected dateRange
  const monthlyCountMap: Record<DateRangeOption, number> = {
    '30d': 3,
    '90d': 4,
    '6m': 6,
    '12m': 12,
    all: 23, // Jan 2025 - Nov 2026
  };
  const numMonths = monthlyCountMap[dateRange];
  const monthlyTurnoverTrends: HRPerformanceMetrics['monthlyTurnoverTrends'] =
    [];
  const refYear = REF_DATE.getUTCFullYear();
  const refMonth = REF_DATE.getUTCMonth();

  for (let i = numMonths - 1; i >= 0; i--) {
    const monthStart = new Date(Date.UTC(refYear, refMonth - i, 1));
    const monthEnd = new Date(
      Date.UTC(refYear, refMonth - i + 1, 0, 23, 59, 59)
    );
    const yyyy = monthStart.getUTCFullYear();
    const mm = String(monthStart.getUTCMonth() + 1).padStart(2, '0');
    const monthKey = `${yyyy}-${mm}`;
    const mLabel = monthStart.toLocaleString('en-US', {
      month: 'short',
      year: '2-digit',
      timeZone: 'UTC',
    });

    const headcountInMonth = filtered.filter((e) => {
      const hired = new Date(`${e.hireDate}T12:00:00Z`) <= monthEnd;
      const notExitedBefore =
        !e.exitDate || new Date(`${e.exitDate}T12:00:00Z`) >= monthStart;
      return hired && notExitedBefore;
    }).length;

    const exitsInMonth = filtered.filter(
      (e) => e.exitDate && e.exitDate.startsWith(monthKey)
    ).length;

    const mTurnover =
      headcountInMonth > 0
        ? Math.round((exitsInMonth / headcountInMonth) * 1000) / 10
        : 0;
    const mRetention = Math.round((100 - mTurnover) * 10) / 10;

    monthlyTurnoverTrends.push({
      month: mLabel,
      turnoverRate: mTurnover,
      retentionRate: mRetention,
      exits: exitsInMonth,
      headcount: headcountInMonth,
    });
  }

  const deptsToShow = department === 'All' ? DEPARTMENTS : [department];
  const departmentPerformance = deptsToShow.map((dept) => {
    const deptAll = employees.filter((e) => e.department === dept);
    const deptActive = deptAll.filter((e) => {
      const hired = new Date(`${e.hireDate}T12:00:00Z`) <= end;
      const notExited =
        !e.exitDate || new Date(`${e.exitDate}T12:00:00Z`) > end;
      return hired && notExited && e.employmentStatus !== 'Inactive';
    });
    const deptStart = deptAll.filter((e) => {
      const hired = new Date(`${e.hireDate}T12:00:00Z`) < start;
      const notExited =
        !e.exitDate || new Date(`${e.exitDate}T12:00:00Z`) >= start;
      return hired && notExited;
    }).length;
    const deptExited = deptAll.filter(
      (e) =>
        e.exitDate && (isAllTime ? true : isDateInRange(e.exitDate, start, end))
    );
    const deptAvgHeadcount =
      deptStart + deptActive.length > 0
        ? (deptStart + deptActive.length) / 2
        : deptActive.length || 1;
    const deptTurnover =
      Math.round((deptExited.length / deptAvgHeadcount) * 1000) / 10;
    const deptTenures = deptActive.map((e) =>
      computeEmployeeTenureYears(e, end)
    );
    const deptAvgTenure =
      deptTenures.length > 0
        ? Math.round(
            (deptTenures.reduce((a, b) => a + b, 0) / deptTenures.length) * 10
          ) / 10
        : 0;
    const avgPerformance =
      deptActive.length > 0
        ? Math.round(
            (deptActive.reduce((a, e) => a + e.performanceScore, 0) /
              deptActive.length) *
              10
          ) / 10
        : 0;
    const openRoles = vacancies
      .filter((v) => v.department === dept && v.status === 'Open')
      .reduce((acc, v) => acc + Math.max(0, v.openings - v.filled), 0);

    return {
      department: dept,
      headcount: deptActive.length,
      avgTenure: deptAvgTenure,
      turnoverRate: deptTurnover,
      avgPerformance,
      openRoles,
    };
  });

  return {
    turnoverRate,
    turnoverDeltaPts,
    retentionRate,
    retentionDeltaPts,
    avgTenureYears,
    tenureDeltaYears,
    activeHeadcount: activeEmps.length,
    headcountChangePct: calcPctChange(activeEmps.length, headcountAtStart),
    totalExited: exitedInPeriod.length,
    comparisonLabel: label,
    employmentTypeDistribution,
    monthlyTurnoverTrends,
    departmentPerformance,
  };
}

export function downloadCSV(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number>>
) {
  const escape = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.map(escape).join(','),
    ...rows.map((r) => r.map(escape).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
