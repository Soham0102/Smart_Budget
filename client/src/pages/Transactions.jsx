import { useState, useEffect } from 'react';
import { Download, Search } from 'lucide-react';
import TransactionTable from '../components/Tables/TransactionTable';
import { transactionAPI, categoryAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, exportCSV, exportExcel } from '../utils/format';

export default function Transactions() {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ type: '', category: '', search: '', startDate: '', endDate: '' });

  const load = () => {
    const params = {};
    if (filters.type) params.type = filters.type;
    if (filters.category) params.category = filters.category;
    if (filters.search) params.search = filters.search;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    transactionAPI.list(params).then(({ data }) => setTransactions(data));
  };

  useEffect(() => {
    categoryAPI.list('expense').then(({ data }) => setCategories(data));
    const params = new URLSearchParams(window.location.search);
    if (params.get('search')) setFilters((f) => ({ ...f, search: params.get('search') }));
  }, []);

  useEffect(() => { load(); }, [filters.type, filters.category, filters.startDate, filters.endDate]);

  const handleSearch = (e) => {
    e.preventDefault();
    load();
  };

  const exportData = (format) => {
    const rows = transactions.map((t) => ({
      Date: formatDate(t.date),
      Type: t.type,
      Category: t.category,
      Description: t.description || t.notes || '',
      Amount: t.amount,
    }));
    if (format === 'csv') exportCSV(rows, 'transactions.csv');
    else exportExcel(rows, 'transactions.xlsx');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-sm opacity-60">All income and expense records</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportData('csv')} className="px-3 py-2 rounded-xl border border-white/10 text-sm flex items-center gap-1 hover:bg-white/5">
            <Download size={14} /> CSV
          </button>
          <button onClick={() => exportData('excel')} className="px-3 py-2 rounded-xl border border-white/10 text-sm flex items-center gap-1 hover:bg-white/5">
            <Download size={14} /> Excel
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4 border mb-6">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <select className="input-field" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select className="input-field" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="date" className="input-field" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
          <input type="date" className="input-field" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
          <div className="relative lg:col-span-2">
            <Search size={14} className="absolute left-3 top-3 opacity-40" />
            <input className="input-field pl-9" placeholder="Search name or notes..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          </div>
        </form>
      </div>

      <div className="glass-card rounded-2xl p-5 border">
        <TransactionTable transactions={transactions} currency={currency} />
        <p className="text-xs opacity-40 mt-3 text-right">{transactions.length} transactions</p>
      </div>
    </div>
  );
}
