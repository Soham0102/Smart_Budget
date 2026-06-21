import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import Modal, { FormField } from '../components/Forms/Modal';
import { budgetAPI, categoryAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatPercent } from '../utils/format';

const emptyForm = { category: 'Food', monthlyLimit: '', alertPercentage: 80 };

export default function BudgetTargets() {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);

  const load = () => {
    budgetAPI.list().then(({ data }) => setBudgets(data));
    categoryAPI.list('expense').then(({ data }) => setCategories(data));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setModal(true); };
  const openEdit = (b) => {
    setForm({ category: b.category, monthlyLimit: b.monthlyLimit, alertPercentage: b.alertPercentage });
    setEditId(b._id);
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, monthlyLimit: Number(form.monthlyLimit), alertPercentage: Number(form.alertPercentage) };
    if (editId) await budgetAPI.update(editId, payload);
    else await budgetAPI.create(payload);
    setModal(false);
    load();
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this budget target?')) { await budgetAPI.remove(id); load(); }
  };

  const barColor = (level) =>
    level === 'exceeded' ? 'bg-rose-500' : level === 'warning' ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Budget Targets</h1>
          <p className="text-sm opacity-60">Set spending limits and track utilization</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={18} /> Add Budget</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgets.map((b) => (
          <div key={b._id} className="glass-card rounded-2xl p-5 border">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold">{b.category}</h3>
                <p className="text-xs opacity-60">{formatCurrency(b.spent, currency)} of {formatCurrency(b.monthlyLimit, currency)}</p>
              </div>
              <div className="flex gap-2">
                {b.alertLevel !== 'ok' && <AlertTriangle size={16} className={b.alertLevel === 'exceeded' ? 'text-rose-400' : 'text-amber-400'} />}
                <button onClick={() => openEdit(b)} className="text-indigo-400"><Pencil size={14} /></button>
                <button onClick={() => handleDelete(b._id)} className="text-rose-400"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="h-3 rounded-full bg-white/5 overflow-hidden mb-2">
              <div className={`h-full rounded-full transition-all ${barColor(b.alertLevel)}`} style={{ width: `${Math.min(b.rawUtilization || b.utilization, 100)}%` }} />
            </div>
            <div className="flex justify-between text-xs opacity-60">
              <span>{formatPercent(b.rawUtilization || b.utilization)} used</span>
              <span>{formatCurrency(b.remaining, currency)} left</span>
            </div>
            {b.alertLevel === 'warning' && (
              <p className="text-xs text-amber-400 mt-2">⚠ {b.alertPercentage}% budget threshold reached</p>
            )}
            {b.alertLevel === 'exceeded' && (
              <p className="text-xs text-rose-400 mt-2">🚨 Budget exceeded!</p>
            )}
          </div>
        ))}
      </div>

      {budgets.length === 0 && (
        <div className="glass-card rounded-2xl p-12 border text-center opacity-60">
          <p>No budget targets set. Add your first category budget!</p>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Budget' : 'Add Budget Target'}>
        <form onSubmit={handleSubmit}>
          <FormField label="Category">
            <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} disabled={!!editId}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </FormField>
          <FormField label="Monthly Budget Limit">
            <input type="number" className="input-field" value={form.monthlyLimit} onChange={(e) => setForm({ ...form, monthlyLimit: e.target.value })} required min="0" />
          </FormField>
          <FormField label="Alert Percentage">
            <input type="number" className="input-field" value={form.alertPercentage} onChange={(e) => setForm({ ...form, alertPercentage: e.target.value })} min="1" max="100" />
          </FormField>
          <button type="submit" className="btn-primary w-full mt-2">{editId ? 'Update' : 'Add'} Budget</button>
        </form>
      </Modal>
    </div>
  );
}
