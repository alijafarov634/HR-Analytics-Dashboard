import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  MapPin,
  Phone,
  Search,
  User,
  X,
} from 'lucide-react';
import { StatusText } from '../components/StatusText';
import { useHRData } from '../context/HRDataContext';
import {
  DEPARTMENTS,
  Department,
  Employee,
  EmploymentStatus,
  EmploymentType,
} from '../types/hr';
import { computeEmployeeTenureYears } from '../utils/analytics';

type SortKey =
  | 'id'
  | 'fullName'
  | 'jobTitle'
  | 'department'
  | 'hireDate'
  | 'employmentType'
  | 'employmentStatus';

const EMPLOYMENT_STATUSES: EmploymentStatus[] = [
  'Active',
  'On Leave',
  'Probation',
  'Inactive',
];
const EMPLOYMENT_TYPES: EmploymentType[] = [
  'Full-Time',
  'Part-Time',
  'Contract',
  'Intern',
];

export const EmployeeDirectoryPage: React.FC = () => {
  const { employees, settings, updateEmployeeStatus } = useHRData();

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<Department | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<EmploymentStatus | 'All'>(
    'All'
  );
  const [typeFilter, setTypeFilter] = useState<EmploymentType | 'All'>('All');
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const rowsPerPage = settings.rowsPerPage || 10;

  const selectedEmployee = useMemo(
    () => employees.find((e) => e.id === selectedEmpId) || null,
    [employees, selectedEmpId]
  );

  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = employees.filter((e) => {
      const matchesSearch =
        !q ||
        e.id.toLowerCase().includes(q) ||
        e.fullName.toLowerCase().includes(q) ||
        e.jobTitle.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q);
      const matchesDept = deptFilter === 'All' || e.department === deptFilter;
      const matchesStatus =
        statusFilter === 'All' || e.employmentStatus === statusFilter;
      const matchesType =
        typeFilter === 'All' || e.employmentType === typeFilter;
      return matchesSearch && matchesDept && matchesStatus && matchesType;
    });

    return [...filtered].sort((a, b) => {
      const valA = String(a[sortKey]).toLowerCase();
      const valB = String(b[sortKey]).toLowerCase();
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [
    employees,
    search,
    deptFilter,
    statusFilter,
    typeFilter,
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

  const clearFilters = () => {
    setSearch('');
    setDeptFilter('All');
    setStatusFilter('All');
    setTypeFilter('All');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-balance font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-[26px]">
          Employee Directory
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Search organization roster, review roles, and inspect employee profiles.
        </p>
      </div>

      {/* Filters */}
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
              placeholder="Search by employee ID, name, title, or location..."
              aria-label="Search employees"
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
            aria-label="Filter by employment type"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as EmploymentType | 'All');
              setPage(1);
            }}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          >
            <option value="All">All Employment Types</option>
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by employment status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as EmploymentStatus | 'All');
              setPage(1);
            }}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          >
            <option value="All">All Statuses</option>
            {EMPLOYMENT_STATUSES.map((st) => (
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
            of {employees.length} employees
          </span>
          {(search ||
            deptFilter !== 'All' ||
            typeFilter !== 'All' ||
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
                    ['id', 'Employee ID'],
                    ['fullName', 'Full Name'],
                    ['jobTitle', 'Job Title'],
                    ['department', 'Department'],
                    ['hireDate', 'Hire Date'],
                    ['employmentType', 'Employment Type'],
                    ['employmentStatus', 'Employment Status'],
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
                  Profile
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                        <User className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-slate-800">
                        No employees match your current filters
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Try clearing your search input or changing the department and status filters.
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
                paginatedRows.map((emp) => (
                  <tr
                    key={emp.id}
                    onClick={() => setSelectedEmpId(emp.id)}
                    className="cursor-pointer transition-colors hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono-tabular text-xs font-medium text-slate-500">
                      {emp.id}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {emp.fullName}
                      </div>
                      <div className="text-xs text-slate-500">{emp.email}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {emp.jobTitle}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {emp.department}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono-tabular text-xs text-slate-600">
                      {emp.hireDate}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {emp.employmentType}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusText value={emp.employmentStatus} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEmpId(emp.id);
                        }}
                        aria-label={`View profile for ${emp.fullName}`}
                        className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Profile</span>
                      </button>
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
            employees
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

      {selectedEmployee && (
        <EmployeeProfileModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmpId(null)}
          onUpdateStatus={(st) => updateEmployeeStatus(selectedEmployee.id, st)}
        />
      )}
    </div>
  );
};

interface EmployeeProfileModalProps {
  employee: Employee;
  onClose: () => void;
  onUpdateStatus: (status: EmploymentStatus) => void;
}

const EmployeeProfileModal: React.FC<EmployeeProfileModalProps> = ({
  employee,
  onClose,
  onUpdateStatus,
}) => {
  const [status, setStatus] = useState<EmploymentStatus>(
    employee.employmentStatus
  );
  const [savedNotice, setSavedNotice] = useState(false);
  const tenure = computeEmployeeTenureYears(employee);

  const initials = employee.fullName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleSave = () => {
    onUpdateStatus(status);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="employee-profile-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 font-display text-sm font-bold text-white">
              {initials}
            </div>
            <div>
              <p className="font-mono-tabular text-xs font-medium text-slate-500">
                {employee.id} · {employee.employmentType}
              </p>
              <h2
                id="employee-profile-title"
                className="font-display text-lg font-bold text-slate-900"
              >
                {employee.fullName}
              </h2>
              <p className="text-sm text-slate-600">
                {employee.jobTitle} · {employee.department}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile modal"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm">
          <div className="grid grid-cols-1 gap-3 border-b border-slate-100 pb-4 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-slate-700">
              <Mail className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <span className="truncate">{employee.email}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 tabular-nums">
              <Phone className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <span>{employee.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <MapPin className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <span>{employee.location}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <User className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <span>Reports to {employee.manager}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4 sm:grid-cols-4 tabular-nums">
            <div>
              <p className="text-xs text-slate-500">Hire Date</p>
              <p className="font-semibold text-slate-900">{employee.hireDate}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Tenure</p>
              <p className="font-semibold text-slate-900">{tenure} yrs</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Compensation</p>
              <p className="font-semibold text-slate-900">
                ${employee.annualSalary.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Rating</p>
              <p className="font-semibold text-slate-900">
                {employee.performanceScore.toFixed(1)} / 5.0
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Employment Status
            </label>
            <div className="mt-2 flex items-center gap-3">
              <select
                aria-label="Update employment status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as EmploymentStatus)
                }
                className="h-10 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                {EMPLOYMENT_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleSave}
                className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 whitespace-nowrap"
              >
                Update Status
              </button>
            </div>
            {savedNotice && (
              <p className="mt-2 text-xs font-medium text-emerald-700">
                Employee status updated.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
