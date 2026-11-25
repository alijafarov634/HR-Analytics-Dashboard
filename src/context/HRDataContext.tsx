import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  DEFAULT_SETTINGS,
  INITIAL_ACTIVITIES,
  INITIAL_CANDIDATES,
  INITIAL_EMPLOYEES,
  INITIAL_VACANCIES,
  REFERENCE_DATE_STR,
} from '../data/mockData';
import {
  Candidate,
  CandidateStatus,
  DateRangeOption,
  Department,
  Employee,
  EmploymentStatus,
  HRSettings,
  JobVacancy,
  RecruitmentActivity,
  RecruitmentSource,
  RecruitmentStage,
} from '../types/hr';

export interface CandidateFormInput {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  position: string;
  department: Department;
  stage: RecruitmentStage;
  source: RecruitmentSource;
  status: CandidateStatus;
  experienceYears: number;
  expectedSalary: number;
  recruiter: string;
  notes: string;
  applicationDate?: string;
}

interface HRDataContextValue {
  employees: Employee[];
  candidates: Candidate[];
  vacancies: JobVacancy[];
  activities: RecruitmentActivity[];
  settings: HRSettings;
  dateRange: DateRangeOption;
  departmentFilter: Department | 'All';
  setDateRange: (range: DateRangeOption) => void;
  setDepartmentFilter: (dept: Department | 'All') => void;
  addCandidate: (input: CandidateFormInput) => Candidate;
  updateCandidate: (
    candidateId: string,
    input: CandidateFormInput
  ) => Candidate | null;
  updateCandidateStage: (
    candidateId: string,
    stage: RecruitmentStage,
    status: CandidateStatus
  ) => void;
  deleteCandidate: (candidateId: string) => void;
  updateEmployeeStatus: (
    employeeId: string,
    status: EmploymentStatus
  ) => void;
  updateSettings: (next: Partial<HRSettings>) => void;
  resetDemoData: () => void;
}

const HRDataContext = createContext<HRDataContextValue | null>(null);

const STORAGE_KEYS = {
  CANDIDATES: 'hr_dashboard_candidates_v1',
  EMPLOYEES: 'hr_dashboard_employees_v1',
  ACTIVITIES: 'hr_dashboard_activities_v1',
  SETTINGS: 'hr_dashboard_settings_v1',
};

const STAGE_RANK: Record<
  'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired',
  number
> = {
  Applied: 1,
  Screening: 2,
  Interview: 3,
  Offer: 4,
  Hired: 5,
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const HRDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<HRSettings>(() =>
    loadFromStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
  );
  const [employees, setEmployees] = useState<Employee[]>(() =>
    loadFromStorage(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES)
  );
  const [candidates, setCandidates] = useState<Candidate[]>(() =>
    loadFromStorage(STORAGE_KEYS.CANDIDATES, INITIAL_CANDIDATES)
  );
  const [vacancies] = useState<JobVacancy[]>(INITIAL_VACANCIES);
  const [activities, setActivities] = useState<RecruitmentActivity[]>(() =>
    loadFromStorage(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES)
  );

  const [dateRange, setDateRange] = useState<DateRangeOption>(
    settings.defaultDateRange
  );
  const [departmentFilter, setDepartmentFilter] = useState<Department | 'All'>(
    'All'
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
      // Ignore quota errors
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(candidates));
    } catch {
      // Ignore quota errors
    }
  }, [candidates]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    } catch {
      // Ignore quota errors
    }
  }, [employees]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
    } catch {
      // Ignore quota errors
    }
  }, [activities]);

  const addCandidate = (input: CandidateFormInput): Candidate => {
    const numericIds = candidates
      .map((c) => parseInt(c.id.replace('CND-', ''), 10))
      .filter((n) => !Number.isNaN(n));
    const nextNum = (numericIds.length ? Math.max(...numericIds) : 2080) + 1;
    const id = `CND-${nextNum}`;
    const appDate = input.applicationDate || REFERENCE_DATE_STR;

    const highestStageReached: Candidate['highestStageReached'] =
      input.stage === 'Rejected' ? 'Screening' : input.stage;

    const isHired = input.stage === 'Hired';
    const isOffer = input.stage === 'Offer' || isHired;

    const newCandidate: Candidate = {
      id,
      fullName: input.fullName.trim(),
      email: input.email.trim(),
      phone: input.phone.trim() || '+1 (415) 555-0199',
      location: input.location.trim() || 'Remote (US)',
      position: input.position.trim(),
      department: input.department,
      applicationDate: appDate,
      stage: input.stage,
      highestStageReached,
      source: input.source,
      status: input.status,
      daysToHire: isHired ? 21 : undefined,
      offerExtended: isOffer,
      offerAccepted: isHired
        ? true
        : input.status === 'Withdrawn'
        ? false
        : undefined,
      experienceYears: Number(input.experienceYears) || 0,
      expectedSalary: Number(input.expectedSalary) || 100000,
      recruiter: input.recruiter.trim() || 'Jordan Ellis',
      notes: input.notes.trim() || 'Candidate added via Candidate Management.',
    };

    setCandidates((prev) => [newCandidate, ...prev]);

    const newActivity: RecruitmentActivity = {
      id: `ACT-${Date.now()}`,
      date: appDate,
      candidateId: id,
      candidateName: newCandidate.fullName,
      department: newCandidate.department,
      type: isHired ? 'Hire' : isOffer ? 'Offer' : 'Application',
      description: `New candidate added for ${newCandidate.position} (${newCandidate.stage})`,
      actor: newCandidate.recruiter,
    };
    setActivities((prev) => [newActivity, ...prev]);

    return newCandidate;
  };

  const updateCandidate = (
    candidateId: string,
    input: CandidateFormInput
  ): Candidate | null => {
    let updatedRecord: Candidate | null = null;

    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== candidateId) return c;

        let nextHighest = c.highestStageReached;
        if (input.stage !== 'Rejected') {
          if (STAGE_RANK[input.stage] > STAGE_RANK[c.highestStageReached]) {
            nextHighest = input.stage;
          }
        }

        const isHired = input.stage === 'Hired';
        const isOffer = input.stage === 'Offer' || isHired;
        const appDate = input.applicationDate || c.applicationDate;
        const appMs = new Date(`${appDate}T12:00:00Z`).getTime();
        const refMs = new Date(`${REFERENCE_DATE_STR}T12:00:00Z`).getTime();
        const calcDays = Math.max(
          7,
          Math.min(45, Math.round((refMs - appMs) / (24 * 60 * 60 * 1000)))
        );

        updatedRecord = {
          ...c,
          fullName: input.fullName.trim(),
          email: input.email.trim(),
          phone: input.phone.trim() || c.phone,
          location: input.location.trim() || c.location,
          position: input.position.trim(),
          department: input.department,
          applicationDate: appDate,
          stage: input.stage,
          highestStageReached: nextHighest,
          source: input.source,
          status: input.status,
          offerExtended: c.offerExtended || isOffer,
          offerAccepted: isHired
            ? true
            : input.status === 'Withdrawn'
            ? false
            : c.offerAccepted,
          daysToHire: isHired ? c.daysToHire || calcDays : undefined,
          experienceYears: Number(input.experienceYears),
          expectedSalary: Number(input.expectedSalary),
          recruiter: input.recruiter.trim() || c.recruiter,
          notes: input.notes.trim(),
        };
        return updatedRecord;
      })
    );

    const trimmedName = input.fullName.trim();
    const actType: RecruitmentActivity['type'] =
      input.stage === 'Hired'
        ? 'Hire'
        : input.stage === 'Offer'
        ? 'Offer'
        : input.stage === 'Interview'
        ? 'Interview'
        : input.stage === 'Screening'
        ? 'Screening'
        : input.stage === 'Rejected'
        ? 'Rejection'
        : 'Application';

    setActivities((prev) => [
      {
        id: `ACT-${Date.now()}`,
        date: REFERENCE_DATE_STR,
        candidateId,
        candidateName: trimmedName,
        department: input.department,
        type: actType,
        description: `Updated profile for ${input.position.trim()} (${input.stage} · ${input.status})`,
        actor: input.recruiter.trim() || 'Jordan Ellis',
      },
      ...prev,
    ]);

    return updatedRecord;
  };

  const updateCandidateStage = (
    candidateId: string,
    stage: RecruitmentStage,
    status: CandidateStatus
  ) => {
    let updatedName = '';
    let updatedDept: Department = 'IT';
    let updatedRecruiter = 'Jordan Ellis';

    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== candidateId) return c;
        updatedName = c.fullName;
        updatedDept = c.department;
        updatedRecruiter = c.recruiter;

        let nextHighest = c.highestStageReached;
        if (stage !== 'Rejected') {
          if (STAGE_RANK[stage] > STAGE_RANK[c.highestStageReached]) {
            nextHighest = stage;
          }
        }

        const isHired = stage === 'Hired';
        const isOffer = stage === 'Offer' || isHired;
        const appMs = new Date(`${c.applicationDate}T12:00:00Z`).getTime();
        const refMs = new Date(`${REFERENCE_DATE_STR}T12:00:00Z`).getTime();
        const calcDays = Math.max(
          7,
          Math.min(45, Math.round((refMs - appMs) / (24 * 60 * 60 * 1000)))
        );

        return {
          ...c,
          stage,
          status,
          highestStageReached: nextHighest,
          offerExtended: c.offerExtended || isOffer,
          offerAccepted: isHired
            ? true
            : status === 'Withdrawn'
            ? false
            : c.offerAccepted,
          daysToHire: isHired ? c.daysToHire || calcDays : c.daysToHire,
        };
      })
    );

    if (updatedName) {
      const actType: RecruitmentActivity['type'] =
        stage === 'Hired'
          ? 'Hire'
          : stage === 'Offer'
          ? 'Offer'
          : stage === 'Interview'
          ? 'Interview'
          : stage === 'Screening'
          ? 'Screening'
          : stage === 'Rejected'
          ? 'Rejection'
          : 'Application';

      setActivities((prev) => [
        {
          id: `ACT-${Date.now()}`,
          date: REFERENCE_DATE_STR,
          candidateId,
          candidateName: updatedName,
          department: updatedDept,
          type: actType,
          description: `Stage updated to ${stage} (${status})`,
          actor: updatedRecruiter,
        },
        ...prev,
      ]);
    }
  };

  const deleteCandidate = (candidateId: string) => {
    setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
    setActivities((prev) => prev.filter((a) => a.candidateId !== candidateId));
  };

  const updateEmployeeStatus = (
    employeeId: string,
    status: EmploymentStatus
  ) => {
    setEmployees((prev) =>
      prev.map((e) => {
        if (e.id !== employeeId) return e;
        return {
          ...e,
          employmentStatus: status,
          exitDate:
            status === 'Inactive'
              ? e.exitDate || REFERENCE_DATE_STR
              : undefined,
        };
      })
    );
  };

  const updateSettings = (next: Partial<HRSettings>) => {
    setSettings((prev) => ({ ...prev, ...next }));
  };

  const resetDemoData = () => {
    setEmployees(INITIAL_EMPLOYEES);
    setCandidates(INITIAL_CANDIDATES);
    setActivities(INITIAL_ACTIVITIES);
    setSettings(DEFAULT_SETTINGS);
    setDateRange(DEFAULT_SETTINGS.defaultDateRange);
    setDepartmentFilter('All');
    try {
      Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    } catch {
      // Ignore storage errors
    }
  };

  return (
    <HRDataContext.Provider
      value={{
        employees,
        candidates,
        vacancies,
        activities,
        settings,
        dateRange,
        departmentFilter,
        setDateRange,
        setDepartmentFilter,
        addCandidate,
        updateCandidate,
        updateCandidateStage,
        deleteCandidate,
        updateEmployeeStatus,
        updateSettings,
        resetDemoData,
      }}
    >
      {children}
    </HRDataContext.Provider>
  );
};

export function useHRData(): HRDataContextValue {
  const ctx = useContext(HRDataContext);
  if (!ctx) {
    throw new Error('useHRData must be used inside HRDataProvider');
  }
  return ctx;
}
