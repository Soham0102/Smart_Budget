import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, TrendingUp, TrendingDown, Target, FileBarChart,
  ArrowLeftRight, PiggyBank, Settings, X,
} from 'lucide-react';

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/income', icon: TrendingUp, label: 'Income' },
  { to: '/expenses', icon: TrendingDown, label: 'Expenses' },
  { to: '/budgets', icon: Target, label: 'Budget Targets' },
  { to: '/reports', icon: FileBarChart, label: 'Reports' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/goals', icon: PiggyBank, label: 'Goals & Savings' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed top-0 left-0 h-full w-64 z-50 glass-card border-r flex flex-col transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="SpendoraX" className="w-10 h-10 rounded-xl object-contain" />
            <div>
              <h1 className="font-bold text-lg gradient-text">SpendoraX</h1>
              <p className="text-xs opacity-50">Track. Plan. Grow.</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 opacity-60 hover:opacity-100">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/90 to-violet-600/90 text-white shadow-lg shadow-indigo-500/20'
                    : 'opacity-70 hover:opacity-100 hover:bg-white/5'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 m-3 rounded-xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/20">
          <p className="text-xs font-medium mb-1">Pro Tip</p>
          <p className="text-xs opacity-60">Track daily expenses to stay within budget!</p>
        </div>
        <p className="text-center text-xs opacity-40 pb-4">Developed by ST01AUR ❤️</p>
      </aside>
    </>
  );
}
