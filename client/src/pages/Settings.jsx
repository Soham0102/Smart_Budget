import { useState } from 'react';
import { User, Shield, Database, Bell, Palette, Download, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authAPI, dataAPI } from '../services/api';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '', currency: user?.currency || 'INR' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [prefs, setPrefs] = useState({
    notifications: user?.preferences?.notifications ?? true,
    budgetStartDay: user?.preferences?.budgetStartDay ?? 1,
  });
  const [twoFA, setTwoFA] = useState(user?.twoFactorEnabled || false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const showMsg = (msg) => { setMessage(msg); setError(''); setTimeout(() => setMessage(''), 3000); };

  const saveProfile = async () => {
    try {
      const { data } = await authAPI.updateProfile({ ...profile, preferences: { ...user.preferences, ...prefs } });
      updateUser(data);
      showMsg('Profile updated!');
    } catch (err) { setError(err.response?.data?.message || 'Update failed'); }
  };

  const changePassword = async () => {
    if (passwords.newPassword !== passwords.confirm) { setError('Passwords do not match'); return; }
    try {
      await authAPI.changePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
      showMsg('Password changed!');
    } catch (err) { setError(err.response?.data?.message || 'Password change failed'); }
  };

  const toggle2FA = async () => {
    const enabled = !twoFA;
    await authAPI.toggle2FA(enabled);
    setTwoFA(enabled);
    showMsg(enabled ? '2FA enabled (placeholder)' : '2FA disabled');
  };

  const exportData = async () => {
    const { data } = await dataAPI.export();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spendorax-backup.json';
    a.click();
    showMsg('Data exported!');
  };

  const importData = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    const data = JSON.parse(text);
    await dataAPI.import(data);
    showMsg('Data imported successfully!');
  };

  const Section = ({ icon: Icon, title, children }) => (
    <div className="glass-card rounded-2xl p-6 border">
      <div className="flex items-center gap-2 mb-5">
        <Icon size={18} className="text-indigo-400" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm opacity-60">Manage your account and preferences</p>
      </div>

      {message && <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">{message}</div>}
      {error && <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section icon={User} title="Profile">
          <div className="space-y-4">
            <div>
              <label className="text-sm opacity-60">Name</label>
              <input className="input-field mt-1" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm opacity-60">Email</label>
              <input className="input-field mt-1" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
            </div>
            <div>
              <label className="text-sm opacity-60">Currency</label>
              <select className="input-field mt-1" value={profile.currency} onChange={(e) => setProfile({ ...profile, currency: e.target.value })}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button onClick={saveProfile} className="btn-primary">Save Profile</button>
          </div>
        </Section>

        <Section icon={Palette} title="Preferences">
          <div className="space-y-4">
            <div>
              <label className="text-sm opacity-60">Theme</label>
              <div className="flex gap-2 mt-2">
                <button onClick={() => setTheme('dark')} className={`px-4 py-2 rounded-xl text-sm ${theme === 'dark' ? 'bg-indigo-600 text-white' : 'border border-white/10'}`}>Dark Mode</button>
                <button onClick={() => setTheme('light')} className={`px-4 py-2 rounded-xl text-sm ${theme === 'light' ? 'bg-indigo-600 text-white' : 'border border-white/10'}`}>Light Mode</button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Bell size={16} /><span className="text-sm">Notifications</span></div>
              <button onClick={() => setPrefs({ ...prefs, notifications: !prefs.notifications })} className={`w-12 h-6 rounded-full transition-colors ${prefs.notifications ? 'bg-indigo-600' : 'bg-white/10'}`}>
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${prefs.notifications ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div>
              <label className="text-sm opacity-60">Monthly Budget Start Date</label>
              <input type="number" className="input-field mt-1" min="1" max="28" value={prefs.budgetStartDay} onChange={(e) => setPrefs({ ...prefs, budgetStartDay: Number(e.target.value) })} />
            </div>
            <button onClick={saveProfile} className="btn-primary">Save Preferences</button>
          </div>
        </Section>

        <Section icon={Shield} title="Security">
          <div className="space-y-4">
            <input className="input-field" type="password" placeholder="Current Password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} />
            <input className="input-field" type="password" placeholder="New Password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />
            <input className="input-field" type="password" placeholder="Confirm New Password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} />
            <button onClick={changePassword} className="btn-primary">Change Password</button>
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <span className="text-sm">Two Factor Authentication</span>
              <button onClick={toggle2FA} className={`px-3 py-1.5 rounded-lg text-xs ${twoFA ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5'}`}>
                {twoFA ? 'Enabled' : 'Enable'}
              </button>
            </div>
          </div>
        </Section>

        <Section icon={Database} title="Data Management">
          <div className="space-y-4">
            <button onClick={exportData} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5">
              <Download size={16} /> Export Data
            </button>
            <label className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 cursor-pointer">
              <Upload size={16} /> Import Data
              <input type="file" accept=".json" className="hidden" onChange={importData} />
            </label>
            <button onClick={exportData} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5">
              <Database size={16} /> Backup Data
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
}
