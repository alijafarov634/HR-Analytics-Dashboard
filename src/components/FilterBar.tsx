import React from 'react';
import { Calendar, Building2 } from 'lucide-react';
import { DateRangeOption, Department, DEPARTMENTS } from '../types/hr';

interface FilterBarProps {
  dateRange?: DateRangeOption;
  onDateRangeChange?: (range: DateRangeOption) => void;
  department: Department | 'All';
  onDepartmentChange: (dept: Department | 'All') => void;
  showDateRange?: boolean;
  actions?: React.ReactNode;
}

const DATE_RANGE_OPTIONS: Array<{ value: DateRangeOption; label: string }> = [
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: '6m', label: 'Last 6 Months' },
  { value: '12m', label: 'Last 12 Months' },
  { value: 'all', label: 'All Time' },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  dateRange,
  onDateRangeChange,
  department,
  onDepartmentChange,
  showDateRange = true,
  actions,
}) => {
  return (
    <div className="no-print flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
      {showDateRange && dateRange && onDateRangeChange && (
        <div className="relative flex w-full items-center sm:w-auto">
          <Calendar
            className="pointer-events-none absolute left-3 h-4 w-4 text-slate-500"
            aria-hidden="true"
          />
          <select
            aria-label="Filter by date range"
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value as DateRangeOption)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm font-medium text-slate-700 shadow-xs transition-colors hover:border-slate-300 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 sm:w-auto"
          >
            {DATE_RANGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="relative flex w-full items-center sm:w-auto">
        <Building2
          className="pointer-events-none absolute left-3 h-4 w-4 text-slate-500"
          aria-hidden="true"
        />
        <select
          aria-label="Filter by department"
          value={department}
          onChange={(e) =>
            onDepartmentChange(e.target.value as Department | 'All')
          }
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm font-medium text-slate-700 shadow-xs transition-colors hover:border-slate-300 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 sm:w-auto"
        >
          <option value="All">All Departments</option>
          {DEPARTMENTS.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      {actions && (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
};
