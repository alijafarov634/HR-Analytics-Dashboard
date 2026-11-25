import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { StatusText } from '../components/StatusText';
import { CandidateFormInput, useHRData } from '../context/HRDataContext';
import { REFERENCE_DATE_STR } from '../data/mockData';
import {
  CANDIDATE_STATUSES,
  Candidate,
  CandidateStatus,
  DEPARTMENTS,
  Department,
  RECRUITMENT_SOURCES,
  RECRUITMENT_STAGES,
  RecruitmentSource,
  RecruitmentStage,
} from '../types/hr';

type SortKey =
  | 'id'
  | 'fullName'
  | 'position'
  | 'department'
  | 'applicationDate'
  | 'stage'
  | 'source'
  | 'status';

interface FormErrors {
  fullName?: string;
  email?: string;
  position?: string;
  applicationDate?: string;
  experienceYears?: string;
  expectedSalary?: string;
}

interface FeedbackBanner {
  type: 'success' | 'error';
  message: string;
}

const DEFAULT_FORM: CandidateFormInput = {
  fullName: '',
  email: '',
  phone: '',
  location: 'San Francisco, CA',
  position: '',
  department: 'IT',
  stage: 'Applied',
  source: 'LinkedIn',
  status: 'Active',
  experienceYears: 4,
  expectedSalary: 120000,
  recruiter: 'Jordan Ellis',
  notes: '',
  applicationDate: REFERENCE_DATE_STR,
};

function getAutoStatusForStage(stage: RecruitmentStage): CandidateStatus {
  switch (stage) {
    case 'Hired':
      return 'Hired';
    case 'Rejected':
      return 'Rejected';
    case 'Offer':
      return 'Offer Extended';
    case 'Interview':
      return 'Shortlisted';
    case 'Screening':
      return 'In Review';
    default:
      return 'Active';
  }
}

function validateCandidateForm(values: CandidateFormInput): FormErrors {
  const errors: FormErrors = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!values.fullName.trim()) {
    errors.fullName = 'Full name is required.';
  } else if (values.fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters.';
  }

  if (!values.email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!emailRegex.test(values.email.trim())) {
    errors.email = 'Enter a valid email address (e.g., name@domain.com).';
  }

  if (!values.position.trim()) {
    errors.position = 'Target position is required.';
  } else if (values.position.trim().length < 2) {
    errors.position = 'Position must be at least 2 characters.';
  }

  if (!values.applicationDate) {
    errors.applicationDate = 'Application date is required.';
  }

  if (
    Number.isNaN(values.experienceYears) ||
    values.experienceYears < 0 ||
    values.experienceYears > 50
  ) {
    errors.experienceYears = 'Experience must be between 0 and 50 years.';
  }

  if (
    Number.isNaN(values.expectedSalary) ||
    values.expectedSalary < 10000 ||
    values.expectedSalary > 1000000
  ) {
    errors.expectedSalary = 'Expected salary must be between $10,000 and $1,000,000.';
  }

  return errors;
}

export const CandidateManagementPage: React.FC = () => {
  const {
    candidates,
    settings,
    addCandidate,
    updateCandidate,
    updateCandidateStage,
    deleteCandidate,
  } = useHRData();

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<Department | 'All'>('All');
  const [stageFilter, setStageFilter] = useState<RecruitmentStage | 'All'>(
    'All'
  );
  const [statusFilter, setStatusFilter] = useState<CandidateStatus | 'All'>(
    'All'
  );
  const [sortKey, setSortKey] = useState<SortKey>('applicationDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(
    null
  );
  const [formModalState, setFormModalState] = useState<{
    open: boolean;
    mode: 'add' | 'edit';
    candidateId: string | null;
    initialValues: CandidateFormInput;
  }>({
    open: false,
    mode: 'add',
    candidateId: null,
    initialValues: DEFAULT_FORM,
  });

  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(
    null
  );
  const [feedback, setFeedback] = useState<FeedbackBanner | null>(null);

  const rowsPerPage = settings.rowsPerPage || 10;

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4500);
    return () => clearTimeout(timer);
  }, [feedback]);

  const selectedCandidate = useMemo(
    () => candidates.find((c) => c.id === selectedCandidateId) || null,
    [candidates, selectedCandidateId]
  );

  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = candidates.filter((c) => {
      const matchesSearch =
        !q ||
        c.id.toLowerCase().includes(q) ||
        c.fullName.toLowerCase().includes(q) ||
        c.position.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.recruiter.toLowerCase().includes(q);
      const matchesDept = deptFilter === 'All' || c.department === deptFilter;
      const matchesStage = stageFilter === 'All' || c.stage === stageFilter;
      const matchesStatus =
        statusFilter === 'All' || c.status === statusFilter;
      return matchesSearch && matchesDept && matchesStage && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      const valA = String(a[sortKey]).toLowerCase();
      const valB = String(b[sortKey]).toLowerCase();
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [
    candidates,
    search,
    deptFilter,
    stageFilter,
    statusFilter,
    sortKey,
    sortDir,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSorted.length / rowsPerPage)
  );
  const safePage = Math.min(page, totalPages);
  const paginatedRows = filteredAndSorted.slice(
    (safePage - 1) * rowsPerPage,
    safePage * rowsPerPage
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 text-blue-600" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
    );
  };

  const openAddModal = () => {
    setFormModalState({
      open: true,
      mode: 'add',
      candidateId: null,
      initialValues: { ...DEFAULT_FORM, applicationDate: REFERENCE_DATE_STR },
    });
  };

  const openEditModal = (candidate: Candidate) => {
    setFormModalState({
      open: true,
      mode: 'edit',
      candidateId: candidate.id,
      initialValues: {
        fullName: candidate.fullName,
        email: candidate.email,
        phone: candidate.phone,
        location: candidate.location,
        position: candidate.position,
        department: candidate.department,
        stage: candidate.stage,
        source: candidate.source,
        status: candidate.status,
        experienceYears: candidate.experienceYears,
        expectedSalary: candidate.expectedSalary,
        recruiter: candidate.recruiter,
        notes: candidate.notes,
        applicationDate: candidate.applicationDate,
      },
    });
  };

  const handleFormSubmit = (values: CandidateFormInput) => {
    if (formModalState.mode === 'add') {
      const created = addCandidate(values);
      setFeedback({
        type: 'success',
        message: `Candidate ${created.fullName} (${created.id}) was added to the pipeline.`,
      });
      setPage(1);
    } else if (formModalState.candidateId) {
      const updated = updateCandidate(formModalState.candidateId, values);
      if (updated) {
        setFeedback({
          type: 'success',
          message: `Updated ${updated.fullName} (${updated.id}).`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: 'Unable to update candidate record. Please try again.',
        });
      }
    }
    setFormModalState((prev) => ({ ...prev, open: false }));
  };

  const handleConfirmDelete = () => {
    if (!candidateToDelete) return;
    const { id, fullName } = candidateToDelete;
    deleteCandidate(id);
    if (selectedCandidateId === id) {
      setSelectedCandidateId(null);
    }
    setCandidateToDelete(null);
    setFeedback({
      type: 'success',
      message: `Deleted candidate ${fullName} (${id}).`,
    });
  };

  const clearFilters = () => {
    setSearch('');
    setDeptFilter('All');
    setStageFilter('All');
    setStatusFilter('All');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-balance font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-[26px]">
            Candidate Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Add, edit, filter, and manage candidate pipeline records.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white shadow-xs transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap shrink-0 sm:w-auto"
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Add Candidate</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="status"
          className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            aria-label="Dismiss notification"
            className="rounded p-1 hover:bg-black/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by candidate name or ID (e.g., CND-2001)..."
              aria-label="Search candidates by name or ID"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <select
            aria-label="Filter by department"
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value as Department | 'All');
              setPage(1);
            }}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          >
            <option value="All">All Departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by recruitment stage"
            value={stageFilter}
            onChange={(e) => {
              setStageFilter(e.target.value as RecruitmentStage | 'All');
              setPage(1);
            }}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          >
            <option value="All">All Stages</option>
            {RECRUITMENT_STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by candidate status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as CandidateStatus | 'All');
              setPage(1);
            }}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          >
            <option value="All">All Statuses</option>
            {CANDIDATE_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span className="tabular-nums">
            Showing{' '}
            <span className="font-semibold text-slate-700">
              {filteredAndSorted.length}
            </span>{' '}
            of {candidates.length} candidates
          </span>
          {(search ||
            deptFilter !== 'All' ||
            stageFilter !== 'All' ||
            statusFilter !== 'All') && (
            <button
              type="button"
              onClick={clearFilters}
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                {(
                  [
                    ['id', 'Candidate ID'],
                    ['fullName', 'Full Name'],
                    ['position', 'Position'],
                    ['department', 'Department'],
                    ['applicationDate', 'Application Date'],
                    ['stage', 'Recruitment Stage'],
                    ['source', 'Recruitment Source'],
                    ['status', 'Status'],
                  ] as Array<[SortKey, string]>
                ).map(([key, label]) => (
                  <th key={key} className="whitespace-nowrap px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleSort(key)}
                      className="inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-slate-900"
                    >
                      <span>{label}</span>
                      {renderSortIcon(key)}
                    </button>
                  </th>
                ))}
                <th className="whitespace-nowrap px-4 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                        <Search className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-slate-800">
                        No candidates match your current filters
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Try adjusting your search query, department, stage, or status filter.
                      </p>
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="mt-4 inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                      >
                        Reset all filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCandidateId(c.id)}
                    className="cursor-pointer transition-colors hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono-tabular text-xs font-medium text-slate-500">
                      {c.id}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {c.fullName}
                      </div>
                      <div className="text-xs text-slate-500">{c.email}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {c.position}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {c.department}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono-tabular text-xs text-slate-600">
                      {c.applicationDate}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusText value={c.stage} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {c.source}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusText value={c.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCandidateId(c.id);
                          }}
                          aria-label={`View profile for ${c.fullName}`}
                          title="View profile"
                          className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>View</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(c);
                          }}
                          aria-label={`Edit ${c.fullName}`}
                          title="Edit candidate"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-700"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCandidateToDelete(c);
                          }}
                          aria-label={`Delete ${c.fullName}`}
                          title="Delete candidate"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500 tabular-nums">
            Page {safePage} of {totalPages} · {filteredAndSorted.length} total
            records
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Candidate Profile Modal */}
      {selectedCandidate && (
        <CandidateProfileModal
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidateId(null)}
          onStageUpdate={(stage, status) => {
            updateCandidateStage(selectedCandidate.id, stage, status);
            setFeedback({
              type: 'success',
              message: `Updated ${selectedCandidate.fullName} (${selectedCandidate.id}) to ${stage} (${status}).`,
            });
          }}
          onEdit={() => {
            const target = selectedCandidate;
            setSelectedCandidateId(null);
            openEditModal(target);
          }}
          onDelete={() => setCandidateToDelete(selectedCandidate)}
        />
      )}

      {/* Add / Edit Candidate Modal */}
      {formModalState.open && (
        <CandidateFormModal
          mode={formModalState.mode}
          candidateId={formModalState.candidateId}
          initialValues={formModalState.initialValues}
          onClose={() =>
            setFormModalState((prev) => ({ ...prev, open: false }))
          }
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Delete Confirmation Modal */}
      {candidateToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-candidate-title"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <Trash2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2
                  id="delete-candidate-title"
                  className="font-display text-base font-bold text-slate-900"
                >
                  Delete Candidate Record
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Are you sure you want to permanently remove{' '}
                  <span className="font-semibold text-slate-900">
                    {candidateToDelete.fullName}
                  </span>{' '}
                  ({candidateToDelete.id} · {candidateToDelete.position})? This
                  action cannot be undone and will immediately recalculate
                  pipeline analytics.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCandidateToDelete(null)}
                className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="h-10 rounded-lg bg-rose-600 px-4 text-sm font-medium text-white hover:bg-rose-700"
              >
                Delete Candidate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface CandidateFormModalProps {
  mode: 'add' | 'edit';
  candidateId: string | null;
  initialValues: CandidateFormInput;
  onClose: () => void;
  onSubmit: (values: CandidateFormInput) => void;
}

const CandidateFormModal: React.FC<CandidateFormModalProps> = ({
  mode,
  candidateId,
  initialValues,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState<CandidateFormInput>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submittedOnce, setSubmittedOnce] = useState(false);

  const handleFieldChange = <K extends keyof CandidateFormInput>(
    field: K,
    value: CandidateFormInput[K]
  ) => {
    const next = { ...form, [field]: value };
    setForm(next);
    if (submittedOnce) {
      setErrors(validateCandidateForm(next));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedOnce(true);
    const nextErrors = validateCandidateForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    onSubmit(form);
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="candidate-form-title"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2
              id="candidate-form-title"
              className="font-display text-lg font-bold text-slate-900"
            >
              {mode === 'add'
                ? 'Add New Candidate'
                : `Edit Candidate (${candidateId})`}
            </h2>
            <p className="text-xs text-slate-500">
              {mode === 'add'
                ? 'Enter candidate details to add them to the hiring pipeline.'
                : 'Update candidate contact, position, or pipeline stage details.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
          {hasErrors && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-700"
            >
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Please correct the highlighted required fields below.</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Full Name *
              </label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => handleFieldChange('fullName', e.target.value)}
                placeholder="e.g., Jordan Taylor"
                className={`mt-1 h-10 w-full rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 ${
                  errors.fullName
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-200 focus:border-blue-600 focus:ring-blue-600/20'
                }`}
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-rose-600">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Email Address *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                placeholder="jordan.taylor@email.com"
                className={`mt-1 h-10 w-full rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 ${
                  errors.email
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-200 focus:border-blue-600 focus:ring-blue-600/20'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-rose-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Target Position *
              </label>
              <input
                type="text"
                value={form.position}
                onChange={(e) => handleFieldChange('position', e.target.value)}
                placeholder="e.g., Senior Frontend Engineer"
                className={`mt-1 h-10 w-full rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 ${
                  errors.position
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-200 focus:border-blue-600 focus:ring-blue-600/20'
                }`}
              />
              {errors.position && (
                <p className="mt-1 text-xs text-rose-600">{errors.position}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Department *
              </label>
              <select
                value={form.department}
                onChange={(e) =>
                  handleFieldChange('department', e.target.value as Department)
                }
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Recruitment Stage *
              </label>
              <select
                value={form.stage}
                onChange={(e) => {
                  const nextStage = e.target.value as RecruitmentStage;
                  const nextStatus = getAutoStatusForStage(nextStage);
                  const next = {
                    ...form,
                    stage: nextStage,
                    status: nextStatus,
                  };
                  setForm(next);
                }}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                {RECRUITMENT_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Status *
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  handleFieldChange('status', e.target.value as CandidateStatus)
                }
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                {CANDIDATE_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Recruitment Source *
              </label>
              <select
                value={form.source}
                onChange={(e) =>
                  handleFieldChange(
                    'source',
                    e.target.value as RecruitmentSource
                  )
                }
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                {RECRUITMENT_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Application Date *
              </label>
              <input
                type="date"
                value={form.applicationDate || REFERENCE_DATE_STR}
                onChange={(e) =>
                  handleFieldChange('applicationDate', e.target.value)
                }
                className={`mt-1 h-10 w-full rounded-lg border px-3 text-sm font-mono-tabular focus:outline-none focus:ring-2 ${
                  errors.applicationDate
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-200 focus:border-blue-600 focus:ring-blue-600/20'
                }`}
              />
              {errors.applicationDate && (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.applicationDate}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Experience (Years)
              </label>
              <input
                type="number"
                min={0}
                max={50}
                value={form.experienceYears}
                onChange={(e) =>
                  handleFieldChange('experienceYears', Number(e.target.value))
                }
                className={`mt-1 h-10 w-full rounded-lg border px-3 text-sm tabular-nums focus:outline-none focus:ring-2 ${
                  errors.experienceYears
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-200 focus:border-blue-600 focus:ring-blue-600/20'
                }`}
              />
              {errors.experienceYears && (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.experienceYears}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Expected Salary (USD)
              </label>
              <input
                type="number"
                min={10000}
                step={1000}
                value={form.expectedSalary}
                onChange={(e) =>
                  handleFieldChange('expectedSalary', Number(e.target.value))
                }
                className={`mt-1 h-10 w-full rounded-lg border px-3 text-sm tabular-nums focus:outline-none focus:ring-2 ${
                  errors.expectedSalary
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-200 focus:border-blue-600 focus:ring-blue-600/20'
                }`}
              />
              {errors.expectedSalary && (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.expectedSalary}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Phone
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                placeholder="+1 (415) 555-0192"
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Location
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => handleFieldChange('location', e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700">
                Assigned Recruiter
              </label>
              <input
                type="text"
                value={form.recruiter}
                onChange={(e) => handleFieldChange('recruiter', e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">
              Recruiter Notes
            </label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              placeholder="Key skills, interview impressions, or compensation expectations..."
              className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
            >
              {mode === 'add' ? 'Save Candidate' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface CandidateProfileModalProps {
  candidate: Candidate;
  onClose: () => void;
  onStageUpdate: (stage: RecruitmentStage, status: CandidateStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const CandidateProfileModal: React.FC<CandidateProfileModalProps> = ({
  candidate,
  onClose,
  onStageUpdate,
  onEdit,
  onDelete,
}) => {
  const [stage, setStage] = useState<RecruitmentStage>(candidate.stage);
  const [status, setStatus] = useState<CandidateStatus>(candidate.status);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setStage(candidate.stage);
    setStatus(candidate.status);
  }, [candidate.id, candidate.stage, candidate.status]);

  const handleSaveStage = () => {
    onStageUpdate(stage, status);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const initials = candidate.fullName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="candidate-profile-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 font-display text-sm font-bold text-white">
              {initials}
            </div>
            <div>
              <p className="font-mono-tabular text-xs font-medium text-slate-500">
                {candidate.id} · Applied {candidate.applicationDate}
              </p>
              <h2
                id="candidate-profile-title"
                className="mt-0.5 font-display text-lg font-bold text-slate-900"
              >
                {candidate.fullName}
              </h2>
              <p className="text-sm text-slate-600">
                {candidate.position} · {candidate.department}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm">
          <div className="grid grid-cols-1 gap-3 border-b border-slate-100 pb-4 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-slate-700">
              <Mail className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <span className="truncate">{candidate.email}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 tabular-nums">
              <Phone className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <span>{candidate.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <MapPin className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <span>{candidate.location}</span>
            </div>
            <div className="text-slate-700">
              Source: <span className="font-medium">{candidate.source}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 border-b border-slate-100 pb-4 tabular-nums">
            <div>
              <p className="text-xs text-slate-500">Experience</p>
              <p className="font-semibold text-slate-900">
                {candidate.experienceYears} yrs
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Expected Comp</p>
              <p className="font-semibold text-slate-900">
                ${candidate.expectedSalary.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Recruiter</p>
              <p className="font-semibold text-slate-900 truncate">
                {candidate.recruiter}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500">Recruiter Notes</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">
              {candidate.notes || 'No recruiter notes added yet.'}
            </p>
          </div>

          {/* Pipeline Quick Update */}
          <div className="border-t border-slate-200 pt-4">
            <p className="text-xs font-semibold text-slate-700">
              Quick Stage & Status Update
            </p>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <select
                aria-label="Update recruitment stage"
                value={stage}
                onChange={(e) => {
                  const nextStage = e.target.value as RecruitmentStage;
                  setStage(nextStage);
                  setStatus(getAutoStatusForStage(nextStage));
                }}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                {RECRUITMENT_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select
                aria-label="Update candidate status"
                value={status}
                onChange={(e) => setStatus(e.target.value as CandidateStatus)}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                {CANDIDATE_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Edit Profile</span>
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 text-xs font-medium text-rose-700 hover:bg-rose-50"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Delete</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {savedNotice && (
              <span className="text-xs font-medium text-emerald-700">
                Updated
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSaveStage}
              className="h-9 rounded-lg bg-blue-600 px-3.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              Update Stage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
