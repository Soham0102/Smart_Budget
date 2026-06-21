import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Modal, { FormField } from '../components/Forms/Modal';
import { goalAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, formatPercent } from '../utils/format';

const COLORS = ['#4F46E5', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'];
const emptyForm = { name: '', targetAmount: '', currentSaved: 0, deadline: '', color: '#4F46E5' };

function CircularProgress({ progress, color, size = 120 }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-700" />
    </svg>
  );
}

export default function Goals() {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const [goals, setGoals] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);

  const load = () => goalAPI.list().then(({ data }) => setGoals(data));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setModal(true); };
  const openEdit = (g) => {
    setForm({ name: g.name, targetAmount: g.targetAmount, currentSaved: g.currentSaved, deadline: g.deadline?.split('T')[0] || '', color: g.color });
    setEditId(g._id);
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, targetAmount: Number(form.targetAmount), currentSaved: Number(form.currentSaved) };
    if (editId) await goalAPI.update(editId, payload);
    else await goalAPI.create(payload);
    setModal(false);
    load();
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this goal?')) { await goalAPI.remove(id); load(); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Goals & Savings</h1>
          <p className="text-sm opacity-60">Track progress toward your financial goals</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={18} /> New Goal</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {goals.map((g) => (
          <div key={g._id} className="glass-card rounded-2xl p-6 border">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">{g.name}</h3>
                {g.deadline && <p className="text-xs opacity-50">Deadline: {formatDate(g.deadline)}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(g)} className="text-indigo-400"><Pencil size={14} /></button>
                <button onClick={() => handleDelete(g._id)} className="text-rose-400"><Trash2 size={14} /></button>
              </div>
            </div>

            <div className="flex items-center justify-center relative my-4">
              <CircularProgress progress={g.progress} color={g.color} />
              <div className="absolute text-center">
                <p className="text-2xl font-bold">{formatPercent(g.progress)}</p>
                <p className="text-xs opacity-50">complete</p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm opacity-60">{formatCurrency(g.currentSaved, currency)} of {formatCurrency(g.targetAmount, currency)}</p>
              <p className="text-xs opacity-40 mt-1">{formatCurrency(g.targetAmount - g.currentSaved, currency)} remaining</p>
            </div>
          </div>
        ))}
      </div>

      {goals.length === 0 && (
        <div className="glass-card rounded-2xl p-12 border text-center opacity-60">
          <p>No savings goals yet. Create your first goal!</p>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Goal' : 'Create Savings Goal'}>
        <form onSubmit={handleSubmit}>
          <FormField label="Goal Name">
            <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Buy Laptop" required />
          </FormField>
          <FormField label="Target Amount">
            <input type="number" className="input-field" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} required min="0" />
          </FormField>
          <FormField label="Current Saved Amount">
            <input type="number" className="input-field" value={form.currentSaved} onChange={(e) => setForm({ ...form, currentSaved: e.target.value })} min="0" />
          </FormField>
          <FormField label="Deadline">
            <input type="date" className="input-field" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </FormField>
          <FormField label="Color">
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setForm({ ...form, color: c })} className={`w-8 h-8 rounded-full border-2 ${form.color === c ? 'border-white' : 'border-transparent'}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </FormField>
          <button type="submit" className="btn-primary w-full mt-2">{editId ? 'Update' : 'Create'} Goal</button>
        </form>
      </Modal>
    </div>
  );
}
