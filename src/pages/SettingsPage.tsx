import React, { useState } from 'react';
import { Check, RotateCcw, Save } from 'lucide-react';
import { DEFAULT_SETTINGS } from '../data/mockData';
import { useHRData } from '../context/HRDataContext';
import { DateRangeOption } from '../types/hr';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, setDateRange, resetDemoData } = useHRData();

  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
    setDateRange(form.defaultDateRange);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    resetDemoData();
    setForm(DEFAULT_SETTINGS);
    setConfirmReset(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-balance font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-[26px]">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure organization details, HR performance benchmarks, and table defaults.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {/* Organization Profile */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors duration-150 hover:border-slate-300/90">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Organization & HR Leadership
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Displayed across executive reports and sidebar profile.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700">
                Organization Name
              </label>
              <input
                type="text"
                value={form.organizationName}
                onChange={(e) =>
                  setForm({ ...form, organizationName: e.target.value })
                }
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                HR Lead Name
              </label>
              <input
                type="text"
                value={form.hrLeadName}
                onChange={(e) =>
                  setForm({ ...form, hrLeadName: e.target.value })
                }
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Title / Role
              </label>
              <input
                type="text"
                value={form.hrLeadTitle}
                onChange={(e) =>
                  setForm({ ...form, hrLeadTitle: e.target.value })
                }
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>
        </section>

        {/* HR Benchmarks */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors duration-150 hover:border-slate-300/90">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Recruitment & Retention Benchmarks
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Targets appear as reference lines and benchmark comparisons on charts and reports.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Target Time to Hire (Days)
              </label>
              <input
                type="number"
                min={5}
                max={120}
                value={form.targetTimeToHireDays}
                onChange={(e) =>
                  setForm({
                    ...form,
                    targetTimeToHireDays: Number(e.target.value),
                  })
                }
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm tabular-nums focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Target Offer Acceptance (%)
              </label>
              <input
                type="number"
                min={10}
                max={100}
                value={form.targetOfferAcceptanceRate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    targetOfferAcceptanceRate: Number(e.target.value),
                  })
                }
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm tabular-nums focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Target Retention Rate (%)
              </label>
              <input
                type="number"
                min={50}
                max={100}
                value={form.targetRetentionRate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    targetRetentionRate: Number(e.target.value),
                  })
                }
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm tabular-nums focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>
        </section>

        {/* Display Defaults */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors duration-150 hover:border-slate-300/90">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Dashboard Preferences
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Default Date Range
              </label>
              <select
                value={form.defaultDateRange}
                onChange={(e) =>
                  setForm({
                    ...form,
                    defaultDateRange: e.target.value as DateRangeOption,
                  })
                }
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="6m">Last 6 Months</option>
                <option value="12m">Last 12 Months</option>
                <option value="all">All Time</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Directory & Candidate Table Rows
              </label>
              <select
                value={form.rowsPerPage}
                onChange={(e) =>
                  setForm({ ...form, rowsPerPage: Number(e.target.value) })
                }
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm tabular-nums focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value={8}>8 rows per page</option>
                <option value={10}>10 rows per page</option>
                <option value={15}>15 rows per page</option>
                <option value={20}>20 rows per page</option>
              </select>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white shadow-xs hover:bg-blue-700"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              <span>Save Settings</span>
            </button>
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                <Check className="h-4 w-4" aria-hidden="true" />
                Saved
              </span>
            )}
          </div>

          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>Restore Default Dataset</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-rose-700">
                Reset all added candidates & edits?
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="h-9 rounded-lg bg-rose-600 px-3 text-xs font-medium text-white hover:bg-rose-700"
              >
                Confirm Reset
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
