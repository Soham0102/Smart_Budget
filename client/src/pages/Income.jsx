import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import StatCard from '../components/StatCard';
import Modal, { FormField } from '../components/Forms/Modal';
import { DonutChart } from '../components/Charts/ChartComponents';
import { incomeAPI, categoryAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, CHART_COLORS } from '../utils/format';

const emptyForm = { source: 'Salary', amount: '', date: new Date().toISOString().split('T')[0], notes: '' };

export default function Income() {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const [incomes, setIncomes] = useState([]);
  const [stats, setStats] = useState(null);
  const [sources, setSources] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);

  const load = () => {
    incomeAPI.list().then(({ data }) => setIncomes(data));
    incomeAPI.stats().then(({ data }) => setStats(data));
    categoryAPI.list('income').then(({ data }) => setSources(data));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setModal(true); };
  const openEdit = (inc) => {
    setForm({ source: inc.source, amount: inc.amount, date: inc.date.split('T')[0], notes: inc.notes || '' });
    setEditId(inc._id);
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, amount: Number(form.amount) };
    if (editId) await incomeAPI.update(editId, payload);
    else await incomeAPI.create(payload);
    setModal(false);
    load();
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this income entry?')) {
      await incomeAPI.remove(id);
      load();
    }
  };

  const pieData = stats?.bySource
    ? Object.entries(stats.bySource).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Income Management</h1>
          <p className="text-sm opacity-60">Track and manage your income sources</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={18} /> Add Income</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Monthly Income" value={formatCurrency(stats?.totalMonthlyIncome, currency)} color="emerald" />
        <StatCard title="Income Sources" value={stats?.count || 0} subtitle="This month" color="indigo" />
        <StatCard title="Top Source" value={pieData[0]?.name || '-'} subtitle={pieData[0] ? formatCurrency(pieData[0].value, currency) : ''} color="violet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-5 border lg:col-span-2">
          <h3 className="font-semibold mb-4">Income Records</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 opacity-60">Date</th>
                  <th className="text-left py-2 opacity-60">Source</th>
                  <th className="text-right py-2 opacity-60">Amount</th>
                  <th className="text-right py-2 opacity-60">Actions</th>
                </tr>
              </thead>
              <tbody>
                {incomes.map((inc) => (
                  <tr key={inc._id} className="border-b border-white/5">
                    <td className="py-3">{formatDate(inc.date)}</td>
                    <td className="py-3">{inc.source}</td>
                    <td className="py-3 text-right text-emerald-400 font-medium">{formatCurrency(inc.amount, currency)}</td>
                    <td className="py-3 text-right space-x-2">
                      <button onClick={() => openEdit(inc)} className="text-indigo-400"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(inc._id)} className="text-rose-400"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border">
          <h3 className="font-semibold mb-4">Income Source Analysis</h3>
          {pieData.length > 0 ? <DonutChart data={pieData} centerLabel={formatCurrency(stats?.totalMonthlyIncome, currency)} /> : <p className="text-sm opacity-50 text-center py-8">No data yet</p>}
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Income' : 'Add Income'}>
        <form onSubmit={handleSubmit}>
          <FormField label="Income Source">
            <select className="input-field" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
              {sources.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>
          <FormField label="Amount">
            <input type="number" className="input-field" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required min="0" />
          </FormField>
          <FormField label="Date">
            <input type="date" className="input-field" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </FormField>
          <FormField label="Notes">
            <textarea className="input-field" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </FormField>
          <button type="submit" className="btn-primary w-full mt-2">{editId ? 'Update' : 'Add'} Income</button>
        </form>
      </Modal>
    </div>
  );
}
