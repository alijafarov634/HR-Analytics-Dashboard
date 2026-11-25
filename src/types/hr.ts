export type Department =
  | 'HR'
  | 'IT'
  | 'Finance'
  | 'Marketing'
  | 'Sales'
  | 'Operations';

export const DEPARTMENTS: Department[] = [
  'HR',
  'IT',
  'Finance',
  'Marketing',
  'Sales',
  'Operations',
];

export type RecruitmentStage =
  | 'Applied'
  | 'Screening'
  | 'Interview'
  | 'Offer'
  | 'Hired'
  | 'Rejected';

export const RECRUITMENT_STAGES: RecruitmentStage[] = [
  'Applied',
  'Screening',
  'Interview',
  'Offer',
  'Hired',
  'Rejected',
];

export type RecruitmentSource =
  | 'LinkedIn'
  | 'Job Portals'
  | 'Referrals'
  | 'Company Website'
  | 'Other';

export const RECRUITMENT_SOURCES: RecruitmentSource[] = [
  'LinkedIn',
  'Job Portals',
  'Referrals',
  'Company Website',
  'Other',
];

export type CandidateStatus =
  | 'Active'
  | 'In Review'
  | 'Shortlisted'
  | 'Offer Extended'
  | 'Hired'
  | 'Rejected'
  | 'Withdrawn';

export const CANDIDATE_STATUSES: CandidateStatus[] = [
  'Active',
  'In Review',
  'Shortlisted',
  'Offer Extended',
  'Hired',
  'Rejected',
  'Withdrawn',
];

export type EmploymentType = 'Full-Time' | 'Part-Time' | 'Contract' | 'Intern';

export type EmploymentStatus = 'Active' | 'On Leave' | 'Probation' | 'Inactive';

export type DateRangeOption =
  | '30d'
  | '90d'
  | '6m'
  | '12m'
  | 'all';

export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  position: string;
  department: Department;
  applicationDate: string; // YYYY-MM-DD
  stage: RecruitmentStage;
  highestStageReached: 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired';
  source: RecruitmentSource;
  status: CandidateStatus;
  daysToHire?: number;
  offerExtended?: boolean;
  offerAccepted?: boolean;
  experienceYears: number;
  expectedSalary: number;
  recruiter: string;
  notes: string;
}

export interface Employee {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  jobTitle: string;
  department: Department;
  hireDate: string; // YYYY-MM-DD
  exitDate?: string; // YYYY-MM-DD if Inactive
  employmentType: EmploymentType;
  employmentStatus: EmploymentStatus;
  manager: string;
  annualSalary: number;
  performanceScore: number; // 1.0 - 5.0
}

export interface JobVacancy {
  id: string;
  title: string;
  department: Department;
  openedDate: string; // YYYY-MM-DD
  closedDate?: string;
  openings: number;
  filled: number;
  status: 'Open' | 'Filled' | 'On Hold';
  hiringManager: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface RecruitmentActivity {
  id: string;
  date: string; // YYYY-MM-DD
  candidateId: string;
  candidateName: string;
  department: Department;
  type: 'Application' | 'Screening' | 'Interview' | 'Offer' | 'Hire' | 'Rejection';
  description: string;
  actor: string;
}

export interface HRSettings {
  organizationName: string;
  hrLeadName: string;
  hrLeadTitle: string;
  targetTimeToHireDays: number;
  targetOfferAcceptanceRate: number;
  targetRetentionRate: number;
  defaultDateRange: DateRangeOption;
  rowsPerPage: number;
}
