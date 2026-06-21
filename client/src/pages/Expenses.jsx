import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import StatCard from '../components/StatCard';
import Modal, { FormField } from '../components/Forms/Modal';
import { CategoryTrendChart } from '../components/Charts/ChartComponents';
import { expenseAPI, categoryAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/format';

const PAYMENT_METHODS = ['Cash', 'UPI', 'Debit Card', 'Credit Card', 'Bank Transfer'];
const emptyForm = { category: 'Food', amount: '', date: new Date().toISOString().split('T')[0], paymentMethod: 'UPI', notes: '' };

export default function Expenses() {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [modal, setModal] = useState(false);
  const [catModal, setCatModal] = useState(false);
  const [newCat, setNewCat] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);

  const load = () => {
    expenseAPI.list().then(({ data }) => setExpenses(data));
    expenseAPI.stats().then(({ data }) => setStats(data));
    categoryAPI.list('expense').then(({ data }) => setCategories(data));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setModal(true); };
  const openEdit = (exp) => {
    setForm({ category: exp.category, amount: exp.amount, date: exp.date.split('T')[0], paymentMethod: exp.paymentMethod || 'UPI', notes: exp.notes || '' });
    setEditId(exp._id);
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, amount: Number(form.amount) };
    if (editId) await expenseAPI.update(editId, payload);
    else await expenseAPI.create(payload);
    setModal(false);
    load();
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this expense?')) { await expenseAPI.remove(id); load(); }
  };

  const addCategory = async () => {
    if (!newCat.trim()) return;
    await categoryAPI.create({ name: newCat.trim(), type: 'expense' });
    setNewCat('');
    setCatModal(false);
    load();
  };

  const chartData = stats?.byCategory
    ? Object.entries(stats.byCategory).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Expense Management</h1>
          <p className="text-sm opacity-60">Track spending across categories</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCatModal(true)} className="px-4 py-2 rounded-xl border border-white/10 text-sm hover:bg-white/5">+ Category</button>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={18} /> Add Expense</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Expenses" value={formatCurrency(stats?.totalExpenses, currency)} color="rose" />
        <StatCard title="Daily Average" value={formatCurrency(stats?.dailyAverage, currency)} subtitle="This month" color="amber" />
        <StatCard title="Most Expensive" value={stats?.mostExpensiveCategory?.category || '-'} subtitle={stats?.mostExpensiveCategory ? formatCurrency(stats.mostExpensiveCategory.amount, currency) : ''} color="violet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-5 border lg:col-span-2">
          <h3 className="font-semibold mb-4">Expense Records</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 opacity-60">Date</th>
                  <th className="text-left py-2 opacity-60">Category</th>
                  <th className="text-left py-2 opacity-60 hidden sm:table-cell">Payment</th>
                  <th className="text-right py-2 opacity-60">Amount</th>
                  <th className="text-right py-2 opacity-60">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp._id} className="border-b border-white/5">
                    <td className="py-3">{formatDate(exp.date)}</td>
                    <td className="py-3">{exp.category}</td>
                    <td className="py-3 hidden sm:table-cell opacity-70">{exp.paymentMethod}</td>
                    <td className="py-3 text-right text-rose-400 font-medium">{formatCurrency(exp.amount, currency)}</td>
                    <td className="py-3 text-right space-x-2">
                      <button onClick={() => openEdit(exp)} className="text-indigo-400"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(exp._id)} className="text-rose-400"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border">
          <h3 className="font-semibold mb-4">By Category</h3>
          {chartData.length > 0 ? <CategoryTrendChart data={chartData.slice(0, 6)} /> : <p className="text-sm opacity-50 text-center py-8">No data yet</p>}
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Expense' : 'Add Expense'}>
        <form onSubmit={handleSubmit}>
          <FormField label="Category">
            <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </FormField>
          <FormField label="Amount">
            <input type="number" className="input-field" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required min="0" />
          </FormField>
          <FormField label="Date">
            <input type="date" className="input-field" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </FormField>
          <FormField label="Payment Method">
            <select className="input-field" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </FormField>
          <FormField label="Notes">
            <textarea className="input-field" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </FormField>
          <button type="submit" className="btn-primary w-full mt-2">{editId ? 'Update' : 'Add'} Expense</button>
        </form>
      </Modal>

      <Modal open={catModal} onClose={() => setCatModal(false)} title="Add Custom Category">
        <FormField label="Category Name">
          <input className="input-field" value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="e.g. Subscriptions" />
        </FormField>
        <button onClick={addCategory} className="btn-primary w-full">Add Category</button>
      </Modal>
    </div>
  );
}
