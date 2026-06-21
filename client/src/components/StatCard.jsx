import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const icons = { up: TrendingUp, down: TrendingDown, neutral: Minus };
const colors = {
  indigo: 'from-indigo-500/20 to-indigo-600/5 border-indigo-500/30 text-indigo-400',
  violet: 'from-violet-500/20 to-violet-600/5 border-violet-500/30 text-violet-400',
  emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30 text-emerald-400',
  rose: 'from-rose-500/20 to-rose-600/5 border-rose-500/30 text-rose-400',
  amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/30 text-amber-400',
};

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'indigo', trend, trendValue, delay = 0 }) {
  const TrendIcon = icons[trend] || icons.neutral;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`glass-card rounded-2xl p-5 bg-gradient-to-br ${colors[color]} border`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm opacity-70 mb-1">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {subtitle && <p className="text-xs opacity-60 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-white/5">
            <Icon size={22} />
          </div>
        )}
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-3 text-xs opacity-70">
          <TrendIcon size={14} />
          <span>{trendValue}</span>
        </div>
      )}
    </motion.div>
  );
}
