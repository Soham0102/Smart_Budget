import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Bell, Sun, Moon, Search, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { notificationAPI } from '../services/api';

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    notificationAPI.list().then(({ data }) => setNotifications(data)).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 glass-card border-b px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <button onClick={onMenuClick} className="lg:hidden p-2 rounded-xl hover:bg-white/5">
            <Menu size={20} />
          </button>
          <div className="hidden sm:flex items-center gap-2 flex-1 max-w-md">
            <Search size={16} className="opacity-40" />
            <input
              placeholder="Search transactions..."
              className="bg-transparent border-none outline-none text-sm flex-1 opacity-70 placeholder:opacity-40"
              onKeyDown={(e) => {
                if (e.key === 'Enter') window.location.href = `/transactions?search=${e.target.value}`;
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl hover:bg-white/5 transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="p-2.5 rounded-xl hover:bg-white/5 transition-colors relative"
            >
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full text-[10px] flex items-center justify-center font-bold">
                  {unread}
                </span>
              )}
            </button>
            <AnimatePresence>
              {showNotifs && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-80 glass-card rounded-2xl border shadow-2xl overflow-hidden"
                >
                  <div className="p-3 border-b border-white/10 flex justify-between items-center">
                    <span className="font-medium text-sm">Notifications</span>
                    <button
                      className="text-xs text-indigo-400"
                      onClick={() => notificationAPI.readAll().then(() =>
                        setNotifications((n) => n.map((x) => ({ ...x, read: true })))
                      )}
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-sm opacity-50 text-center">No notifications</p>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div key={n._id} className={`p-3 border-b border-white/5 text-sm ${!n.read ? 'bg-indigo-500/5' : ''}`}>
                          <p className="font-medium">{n.title}</p>
                          <p className="text-xs opacity-60 mt-0.5">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-white/5"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-sm font-bold">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="hidden md:block text-sm font-medium">{user?.name}</span>
            </button>
            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-48 glass-card rounded-xl border shadow-2xl overflow-hidden"
                >
                  <div className="p-3 border-b border-white/10">
                    <p className="font-medium text-sm">{user?.name}</p>
                    <p className="text-xs opacity-50">{user?.email}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-rose-400 hover:bg-white/5"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
