import React from 'react';
import {
  CheckCircle2,
  Clock,
  FileCheck,
  MinusCircle,
  PauseCircle,
  Search,
  UserCheck,
  XCircle,
} from 'lucide-react';
import {
  CandidateStatus,
  EmploymentStatus,
  RecruitmentStage,
} from '../types/hr';

type StatusValue = CandidateStatus | EmploymentStatus | RecruitmentStage;

const STATUS_STYLE_MAP: Record<
  StatusValue,
  { color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  // Recruitment Stages & Candidate Statuses
  Applied: { color: 'text-slate-600', icon: Clock },
  Screening: { color: 'text-sky-700', icon: Search },
  Interview: { color: 'text-blue-700', icon: UserCheck },
  Offer: { color: 'text-indigo-700', icon: FileCheck },
  'Offer Extended': { color: 'text-indigo-700', icon: FileCheck },
  Hired: { color: 'text-emerald-700', icon: CheckCircle2 },
  Active: { color: 'text-emerald-700', icon: CheckCircle2 },
  'In Review': { color: 'text-sky-700', icon: Search },
  Shortlisted: { color: 'text-blue-700', icon: UserCheck },
  Rejected: { color: 'text-rose-700', icon: XCircle },
  Withdrawn: { color: 'text-amber-700', icon: MinusCircle },

  // Employment Statuses
  'On Leave': { color: 'text-amber-700', icon: PauseCircle },
  Probation: { color: 'text-blue-700', icon: Clock },
  Inactive: { color: 'text-slate-500', icon: MinusCircle },
};

export const StatusText: React.FC<{ value: StatusValue }> = ({ value }) => {
  const cfg = STATUS_STYLE_MAP[value] || {
    color: 'text-slate-700',
    icon: Clock,
  };
  const Icon = cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${cfg.color}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{value}</span>
    </span>
  );
};
