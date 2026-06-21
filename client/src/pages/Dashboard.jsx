import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Target, Lightbulb, GripVertical, Eye, EyeOff } from 'lucide-react';
import StatCard from '../components/StatCard';
import TransactionTable from '../components/Tables/TransactionTable';
import {
  IncomeExpenseTrend, ExpensePieChart, WeeklySpendingChart, SavingsGrowthChart,
} from '../components/Charts/ChartComponents';
import { dashboardAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatPercent } from '../utils/format';

const DEFAULT_WIDGETS = [
  { id: 'stats', label: 'Statistics', visible: true },
  { id: 'trend', label: 'Income vs Expense', visible: true },
  { id: 'pie', label: 'Category Breakdown', visible: true },
  { id: 'weekly', label: 'Weekly Spending', visible: true },
  { id: 'savings', label: 'Savings Growth', visible: true },
  { id: 'insights', label: 'Smart Insights', visible: true },
  { id: 'recent', label: 'Recent Transactions', visible: true },
];

export default function Dashboard() {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [recent, setRecent] = useState([]);
  const [insights, setInsights] = useState([]);
  const [widgets, setWidgets] = useState(() => {
    const saved = localStorage.getItem('dashboardWidgets');
    return saved ? JSON.parse(saved) : DEFAULT_WIDGETS;
  });
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    Promise.all([
      dashboardAPI.summary(),
      dashboardAPI.charts(),
      dashboardAPI.recent(),
      dashboardAPI.insights(),
    ]).then(([s, c, r, i]) => {
      setSummary(s.data);
      setCharts(c.data);
      setRecent(r.data);
      setInsights(i.data);
    }).catch(console.error);
  }, []);

  const saveWidgets = (updated) => {
    setWidgets(updated);
    localStorage.setItem('dashboardWidgets', JSON.stringify(updated));
    authAPI.updateLayout(updated).catch(() => {});
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(widgets);
    const [removed] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, removed);
    saveWidgets(items);
  };

  const toggleWidget = (id) => {
    saveWidgets(widgets.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)));
  };

  const renderWidget = (id) => {
    switch (id) {
      case 'stats':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            <StatCard title="Total Income" value={formatCurrency(summary?.totalIncome, currency)} icon={TrendingUp} color="emerald" delay={0} />
            <StatCard title="Total Expenses" value={formatCurrency(summary?.totalExpenses, currency)} icon={TrendingDown} color="rose" delay={0.1} />
            <StatCard title="Remaining Balance" value={formatCurrency(summary?.remainingBalance, currency)} icon={Wallet} color="indigo" delay={0.2} />
            <StatCard title="Savings This Month" value={formatCurrency(summary?.savingsThisMonth, currency)} icon={PiggyBank} color="violet" delay={0.3} />
            <StatCard title="Budget Utilization" value={formatPercent(summary?.budgetUtilization)} icon={Target} color="amber" delay={0.4} />
          </div>
        );
      case 'trend':
        return charts?.monthlyTrend?.length ? (
          <div className="glass-card rounded-2xl p-5 border">
            <h3 className="font-semibold mb-4">Monthly Income vs Expense</h3>
            <IncomeExpenseTrend data={charts.monthlyTrend} />
          </div>
        ) : null;
      case 'pie':
        return charts?.expensePie?.length ? (
          <div className="glass-card rounded-2xl p-5 border">
            <h3 className="font-semibold mb-4">Expense Category Breakdown</h3>
            <ExpensePieChart data={charts.expensePie} />
          </div>
        ) : null;
      case 'weekly':
        return charts?.weeklySpending ? (
          <div className="glass-card rounded-2xl p-5 border">
            <h3 className="font-semibold mb-4">Weekly Spending</h3>
            <WeeklySpendingChart data={charts.weeklySpending} />
          </div>
        ) : null;
      case 'savings':
        return charts?.savingsGrowth ? (
          <div className="glass-card rounded-2xl p-5 border">
            <h3 className="font-semibold mb-4">Savings Growth</h3>
            <SavingsGrowthChart data={charts.savingsGrowth} />
          </div>
        ) : null;
      case 'insights':
        return (
          <div className="glass-card rounded-2xl p-5 border">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb size={18} className="text-amber-400" />
              <h3 className="font-semibold">Smart Insights</h3>
            </div>
            <div className="space-y-3">
              {insights.map((ins, i) => (
                <div key={i} className={`p-3 rounded-xl text-sm border ${
                  ins.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20' :
                  ins.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' :
                  'bg-indigo-500/10 border-indigo-500/20'
                }`}>
                  {ins.message}
                </div>
              ))}
            </div>
          </div>
        );
      case 'recent':
        return (
          <div className="glass-card rounded-2xl p-5 border">
            <h3 className="font-semibold mb-4">Recent Transactions</h3>
            <TransactionTable transactions={recent} currency={currency} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-2xl font-bold">
            Dashboard
          </motion.h1>
          <p className="text-sm opacity-60">Welcome back, {user?.name}</p>
        </div>
        <button onClick={() => setEditMode(!editMode)} className="btn-primary text-sm">
          {editMode ? 'Done' : 'Customize'}
        </button>
      </div>

      {editMode && (
        <div className="glass-card rounded-xl p-4 mb-4 border flex flex-wrap gap-2">
          {widgets.map((w) => (
            <button key={w.id} onClick={() => toggleWidget(w.id)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border ${w.visible ? 'bg-indigo-500/20 border-indigo-500/30' : 'opacity-50'}`}>
              {w.visible ? <Eye size={12} /> : <EyeOff size={12} />} {w.label}
            </button>
          ))}
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="dashboard">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6">
              {widgets.filter((w) => w.visible).map((widget, index) => (
                <Draggable key={widget.id} draggableId={widget.id} index={index} isDragDisabled={!editMode}>
                  {(prov, snapshot) => (
                    <div ref={prov.innerRef} {...prov.draggableProps} className={snapshot.isDragging ? 'opacity-80' : ''}>
                      {editMode && (
                        <div {...prov.dragHandleProps} className="flex items-center gap-1 text-xs opacity-40 mb-1 cursor-grab">
                          <GripVertical size={14} /> {widget.label}
                        </div>
                      )}
                      {renderWidget(widget.id)}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
