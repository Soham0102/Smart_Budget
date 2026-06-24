import { useState, useEffect } from 'react';
import { Plus, Check, Trash2, Pencil, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import Modal, { FormField } from '../components/Forms/Modal';
import { udhariAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/format';

const emptyForm = {
  type: 'gave',
  personName: '',
  amount: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  dueDate: '',
};

export default function Udhari() {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const [entries, setEntries] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState('all'); // all | gave | took | pending | settled

  const load = () => udhariAPI.list().then(({ data }) => setEntries(data));
  useEffect(() => { load(); }, []);

  const openAdd = (type = 'gave') => {
    setForm({ ...emptyForm, type });
    setEditId(null);
    setModal(true);
  };

  const openEdit = (e) => {
    setForm({
      type: e.type,
      personName: e.personName,
      amount: e.amount,
      description: e.description || '',
      date: e.date.split('T')[0],
      dueDate: e.dueDate ? e.dueDate.split('T')[0] : '',
    });
    setEditId(e._id);
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, amount: Number(form.amount) };
    if (!payload.dueDate) delete payload.dueDate;
    if (editId) await udhariAPI.update(editId, payload);
    else await udhariAPI.create(payload);
    setModal(false);
    load();
  };

  const handleSettle = async (id) => {
    await udhariAPI.settle(id);
    load();
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this entry?')) { await udhariAPI.remove(id); load(); }
  };

  const filtered = entries.filter((e) => {
    if (filter === 'gave') return e.type === 'gave';
    if (filter === 'took') return e.type === 'took';
    if (filter === 'pending') return !e.settled;
    if (filter === 'settled') return e.settled;
    return true;
  });

  const totalGave = entries.filter(e => e.type === 'gave' && !e.settled).reduce((s, e) => s + e.amount, 0);
  const totalTook = entries.filter(e => e.type === 'took' && !e.settled).reduce((s, e) => s + e.amount, 0);
  const net = totalGave - totalTook;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Udhari Tracker</h1>
          <p className="text-sm opacity-60">Track money you gave or borrowed from friends</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openAdd('gave')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors">
            <ArrowUpRight size={16} /> I Gave
          </button>
          <button onClick={() => openAdd('took')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium transition-colors">
            <ArrowDownLeft size={16} /> I Took
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="glass-card rounded-2xl p-5 border">
          <p className="text-xs opacity-50 mb-1">They Owe Me</p>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalGave, currency)}</p>
          <p className="text-xs opacity-50 mt-1">Pending recovery</p>
        </div>
        <div className="glass-card rounded-2xl p-5 border">
          <p className="text-xs opacity-50 mb-1">I Owe Them</p>
          <p className="text-2xl font-bold text-rose-400">{formatCurrency(totalTook, currency)}</p>
          <p className="text-xs opacity-50 mt-1">Pending payment</p>
        </div>
        <div className="glass-card rounded-2xl p-5 border">
          <p className="text-xs opacity-50 mb-1">Net Balance</p>
          <p className={`text-2xl font-bold ${net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {net >= 0 ? '+' : ''}{formatCurrency(net, currency)}
          </p>
          <p className="text-xs opacity-50 mt-1">{net >= 0 ? 'In your favor' : 'You owe more'}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="glass-card rounded-2xl p-4 border mb-4 flex flex-wrap gap-2">
        {['all', 'gave', 'took', 'pending', 'settled'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-xl text-sm capitalize transition-all ${filter === f ? 'bg-indigo-600 text-white' : 'border border-white/10 hover:bg-white/5'}`}
          >
            {f === 'gave' ? 'I Gave' : f === 'took' ? 'I Took' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Entries list */}
      <div className="glass-card rounded-2xl border overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-center text-sm opacity-50 py-12">No entries found</p>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((e) => (
              <div key={e._id} className={`flex items-center gap-4 p-4 ${e.settled ? 'opacity-50' : ''}`}>
                <div className={`p-2 rounded-xl ${e.type === 'gave' ? 'bg-emerald-500/15' : 'bg-rose-500/15'}`}>
                  {e.type === 'gave'
                    ? <ArrowUpRight size={18} className="text-emerald-400" />
                    : <ArrowDownLeft size={18} className="text-rose-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{e.personName}</p>
                    {e.settled && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-500/30 text-slate-400">Settled</span>}
                    {!e.settled && e.dueDate && new Date(e.dueDate) < new Date() && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400">Overdue</span>
                    )}
                  </div>
                  <p className="text-xs opacity-50 mt-0.5">
                    {e.type === 'gave' ? 'They owe you' : 'You owe them'} · {formatDate(e.date)}
                    {e.dueDate && ` · Due: ${formatDate(e.dueDate)}`}
                  </p>
                  {e.description && <p className="text-xs opacity-40 mt-0.5">{e.description}</p>}
                </div>
                <p className={`font-semibold text-sm ${e.type === 'gave' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {e.type === 'gave' ? '+' : '-'}{formatCurrency(e.amount, currency)}
                </p>
                <div className="flex items-center gap-1">
                  {!e.settled && (
                    <button onClick={() => handleSettle(e._id)} title="Mark settled" className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10">
                      <Check size={15} />
                    </button>
                  )}
                  <button onClick={() => openEdit(e)} className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-500/10">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(e._id)} className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Entry' : form.type === 'gave' ? 'I Gave Money' : 'I Took Money'}>
        <form onSubmit={handleSubmit}>
          <FormField label="Type">
            <div className="flex gap-2">
              <button type="button" onClick={() => setForm({ ...form, type: 'gave' })}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${form.type === 'gave' ? 'bg-emerald-600 text-white border-emerald-600' : 'border-white/10 hover:bg-white/5'}`}>
                I Gave (They owe me)
              </button>
              <button type="button" onClick={() => setForm({ ...form, type: 'took' })}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${form.type === 'took' ? 'bg-rose-600 text-white border-rose-600' : 'border-white/10 hover:bg-white/5'}`}>
                I Took (I owe them)
              </button>
            </div>
          </FormField>
          <FormField label="Person Name">
            <input type="text" className="input-field" placeholder="Friend's name" value={form.personName} onChange={(e) => setForm({ ...form, personName: e.target.value })} required />
          </FormField>
          <FormField label="Amount">
            <input type="number" className="input-field" placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required min="1" />
          </FormField>
          <FormField label="Description (optional)">
            <input type="text" className="input-field" placeholder="e.g. Lunch, Trip, etc." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </FormField>
          <FormField label="Date">
            <input type="date" className="input-field" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </FormField>
          <FormField label="Due Date (optional)">
            <input type="date" className="input-field" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </FormField>
          <button type="submit" className="btn-primary w-full mt-2">{editId ? 'Update' : 'Save'}</button>
        </form>
      </Modal>
    </div>
  );
}
