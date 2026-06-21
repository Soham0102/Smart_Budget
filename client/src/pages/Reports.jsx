import { useState, useEffect } from 'react';
import { Download, FileText } from 'lucide-react';
import StatCard from '../components/StatCard';
import { ExpensePieChart, IncomeExpenseTrend } from '../components/Charts/ChartComponents';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, exportCSV, exportExcel, exportPDF } from '../utils/format';

const PERIODS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom' },
];

export default function Reports() {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const [period, setPeriod] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState(null);

  const load = (p = period, s = startDate, e = endDate) => {
    const params = { period: p };
    if (p === 'custom') {
      if (!s || !e) return; // don't fetch without both dates
      params.startDate = s;
      params.endDate = e;
    }
    dashboardAPI.analytics(params).then(({ data: d }) => setData(d));
  };

  useEffect(() => {
    if (period !== 'custom') load();
  }, [period]);

  const expensePie = data?.expenseByCategory
    ? Object.entries(data.expenseByCategory).map(([name, value]) => ({ name, value }))
    : [];

  const incomePie = data?.incomeBySource
    ? Object.entries(data.incomeBySource).map(([name, value]) => ({ name, value }))
    : [];

  const downloadReport = async (format) => {
    if (!data) return;
    const txRows = data.transactions.map((t) => ({
      Date: formatDate(t.date),
      Type: t.type,
      Category: t.category,
      Amount: formatCurrency(t.amount, currency),
    }));

    if (format === 'csv') {
      exportCSV([
        { Metric: 'Total Income', Value: data.totalIncome },
        { Metric: 'Total Expenses', Value: data.totalExpenses },
        { Metric: 'Savings', Value: data.savings },
        ...txRows,
      ], 'spendorax-report.csv');
    } else if (format === 'excel') {
      exportExcel(txRows, 'spendorax-report.xlsx');
    } else {
      await exportPDF('SpendoraX Financial Report', [
        { heading: 'Summary', columns: ['Metric', 'Value'], data: [
          { Metric: 'Total Income', Value: formatCurrency(data.totalIncome, currency) },
          { Metric: 'Total Expenses', Value: formatCurrency(data.totalExpenses, currency) },
          { Metric: 'Savings', Value: formatCurrency(data.savings, currency) },
        ]},
        { heading: 'Transactions', columns: ['Date', 'Type', 'Category', 'Amount'], data: txRows },
      ], 'spendorax-report.pdf');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-sm opacity-60">Financial insights and downloadable reports</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => downloadReport('pdf')} className="px-3 py-2 rounded-xl border border-white/10 text-sm flex items-center gap-1 hover:bg-white/5"><FileText size={14} /> PDF</button>
          <button onClick={() => downloadReport('excel')} className="px-3 py-2 rounded-xl border border-white/10 text-sm flex items-center gap-1 hover:bg-white/5"><Download size={14} /> Excel</button>
          <button onClick={() => downloadReport('csv')} className="px-3 py-2 rounded-xl border border-white/10 text-sm flex items-center gap-1 hover:bg-white/5"><Download size={14} /> CSV</button>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4 border mb-6 flex flex-wrap gap-3 items-center">
        {PERIODS.map((p) => (
          <button key={p.value} onClick={() => setPeriod(p.value)} className={`px-4 py-2 rounded-xl text-sm transition-all ${period === p.value ? 'bg-indigo-600 text-white' : 'border border-white/10 hover:bg-white/5'}`}>
            {p.label}
          </button>
        ))}
        {period === 'custom' && (
          <>
            <input type="date" className="input-field w-auto" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <input type="date" className="input-field w-auto" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <button onClick={() => load('custom', startDate, endDate)} className="btn-primary text-sm">Apply</button>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Income" value={formatCurrency(data?.totalIncome, currency)} color="emerald" />
        <StatCard title="Total Expenses" value={formatCurrency(data?.totalExpenses, currency)} color="rose" />
        <StatCard title="Net Savings" value={formatCurrency(data?.savings, currency)} color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="glass-card rounded-2xl p-5 border">
          <h3 className="font-semibold mb-4">Expense Analysis</h3>
          {expensePie.length > 0 ? <ExpensePieChart data={expensePie} /> : <p className="text-sm opacity-50 text-center py-8">No expense data</p>}
        </div>
        <div className="glass-card rounded-2xl p-5 border">
          <h3 className="font-semibold mb-4">Income Analysis</h3>
          {incomePie.length > 0 ? <ExpensePieChart data={incomePie} /> : <p className="text-sm opacity-50 text-center py-8">No income data</p>}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 border">
        <h3 className="font-semibold mb-4">Category Trends</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {expensePie.map((item) => (
            <div key={item.name} className="p-3 rounded-xl bg-white/5 border border-white/5">
              <p className="text-xs opacity-60">{item.name}</p>
              <p className="font-semibold">{formatCurrency(item.value, currency)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
