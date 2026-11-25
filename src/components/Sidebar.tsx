import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  FileSpreadsheet,
  LayoutDashboard,
  Settings,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useHRData } from '../context/HRDataContext';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  {
    to: '/recruitment',
    label: 'Recruitment Analytics',
    icon: BarChart3,
    end: false,
  },
  {
    to: '/candidates',
    label: 'Candidate Management',
    icon: UserCheck,
    end: false,
  },
  { to: '/employees', label: 'Employee Directory', icon: Users, end: false },
  { to: '/performance', label: 'HR Performance', icon: TrendingUp, end: false },
  {
    to: '/reports',
    label: 'Reports & Insights',
    icon: FileSpreadsheet,
    end: false,
  },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
];

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen,
  onCloseMobile,
}) => {
  const { settings } = useHRData();

  useEffect(() => {
    if (!mobileOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseMobile();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileOpen, onCloseMobile]);

  const initials = settings.hrLeadName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const navContent = (
    <div className="flex h-full flex-col bg-[#0B162C] text-slate-200 select-none">
      {/* Brand */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-5">
        <NavLink
          to="/"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 text-white whitespace-nowrap shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 3v18h18" />
              <path d="M7 15l4-4 3 3 5-6" />
            </svg>
          </span>
          <span className="font-display text-base font-bold tracking-tight">
            Meridian HR
          </span>
        </NavLink>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav
        aria-label="Primary Navigation"
        className="flex-1 space-y-1 overflow-y-auto px-3 py-5"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`
              }
            >
              <Icon
                className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-105"
                aria-hidden="true"
              />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Organization / Lead Profile Footer */}
      <div className="border-t border-slate-800/80 p-4">
        <NavLink
          to="/settings"
          onClick={onCloseMobile}
          className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-slate-800/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-xs font-semibold text-blue-300">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {settings.hrLeadName}
            </p>
            <p className="truncate text-xs text-slate-400">
              {settings.hrLeadTitle}
            </p>
          </div>
        </NavLink>
      </div>
    </div>
  );

  return (
    <>
      {/* Fixed desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-800 lg:block">
        {navContent}
      </aside>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[1px] transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 h-full w-64 max-w-[82vw] shadow-2xl">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
