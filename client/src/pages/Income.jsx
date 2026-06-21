import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Settings, X } from 'lucide-react';
import StatCard from '../components/StatCard';
import Modal, { FormField } from '../components/Forms/Modal';
import { DonutChart } from '../components/Charts/ChartComponents';
import { incomeAPI, categoryAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, CHART_COLORS } from '../utils/format';

const DEFAULT_SOURCES = ['Salary', 'Freelancing', 'Business', 'Investments', 'Rental', 'Other'];
const emptyForm = { source: '', amount: '', date: new Date().toISOString().split('T')[0], notes: '' };

export default function Income() {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const [incomes, setIncomes] = useState([]);
  const [stats, setStats] = useState(null);
  const [sources, setSources] = useState([]);
  const [customSources, setCustomSources] = useState([]);
  const [modal, setModal] = useState(false);
  const [manageModal, setManageModal] = useState(false);
  const [newSource, setNewSource] = useState('');
  const [sourceError, setSourceError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);

  const loadSources = async () => {
    const { data } = await categoryAPI.list('income');
    setSources(data);
    // custom = not in defaults
    const custom = await categoryAPI.listCustom('income');
    setCustomSources(custom.data);
  };

  const load = () => {
    incomeAPI.list().then(({ data }) => setIncomes(data));
    incomeAPI.stats().then(({ data }) => setStats(data));
    loadSources();
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setForm({ ...emptyForm, source: sources[0] || 'Salary' });
    setEditId(null);
    setModal(true);
  };

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

  const handleAddSource = async (e) => {
    e.preventDefault();
    const name = newSource.trim();
    if (!name) return;
    setSourceError('');
    try {
      await categoryAPI.create({ name, type: 'income' });
      setNewSource('');
      loadSources();
    } catch (err) {
      setSourceError(err.response?.data?.message || 'Failed to add source');
    }
  };

  const handleDeleteSource = async (id) => {
    await categoryAPI.remove(id);
    loadSources();
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
        <div className="flex gap-2">
          <button onClick={() => setManageModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-600 hover:border-indigo-500 text-sm transition-colors">
            <Settings size={16} /> Manage Sources
          </button>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={18} /> Add Income</button>
        </div>
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
                {incomes.length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center opacity-50 text-sm">No income records yet</td></tr>
                )}
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
          {pieData.length > 0
            ? <DonutChart data={pieData} centerLabel={formatCurrency(stats?.totalMonthlyIncome, currency)} />
            : <p className="text-sm opacity-50 text-center py-8">No data yet</p>}
        </div>
      </div>

      {/* Add/Edit Income Modal */}
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

      {/* Manage Sources Modal */}
      <Modal open={manageModal} onClose={() => setManageModal(false)} title="Manage Income Sources">
        <div className="space-y-4">
          {/* Add new source */}
          <form onSubmit={handleAddSource} className="flex gap-2">
            <input
              type="text"
              className="input-field flex-1"
              placeholder="New source name..."
              value={newSource}
              onChange={(e) => { setNewSource(e.target.value); setSourceError(''); }}
            />
            <button type="submit" className="btn-primary px-4 py-2 flex items-center gap-1 whitespace-nowrap">
              <Plus size={16} /> Add
            </button>
          </form>
          {sourceError && <p className="text-rose-400 text-sm">{sourceError}</p>}

          {/* Default sources */}
          <div>
            <p className="text-xs opacity-50 mb-2 uppercase tracking-wide">Default Sources</p>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_SOURCES.map((s) => (
                <span key={s} className="px-3 py-1 rounded-full text-sm bg-slate-700/50 opacity-60">{s}</span>
              ))}
            </div>
          </div>

          {/* Custom sources */}
          <div>
            <p className="text-xs opacity-50 mb-2 uppercase tracking-wide">Custom Sources</p>
            {customSources.length === 0
              ? <p className="text-sm opacity-40">No custom sources added yet</p>
              : (
                <div className="space-y-2">
                  {customSources.map((s) => (
                    <div key={s._id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-700/40">
                      <span className="text-sm">{s.name}</span>
                      <button onClick={() => handleDeleteSource(s._id)} className="text-rose-400 hover:text-rose-300">
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
