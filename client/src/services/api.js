import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config.url?.includes('/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
  updateLayout: (layout) => api.put('/auth/dashboard-layout', { layout }),
  toggle2FA: (enabled) => api.put('/auth/two-factor', { enabled }),
};

export const dashboardAPI = {
  summary: () => api.get('/dashboard/summary'),
  charts: () => api.get('/dashboard/charts'),
  recent: () => api.get('/dashboard/recent'),
  insights: () => api.get('/dashboard/insights'),
  analytics: (params) => api.get('/dashboard/analytics', { params }),
};

export const incomeAPI = {
  list: (params) => api.get('/income', { params }),
  stats: () => api.get('/income/stats'),
  create: (data) => api.post('/income', data),
  update: (id, data) => api.put(`/income/${id}`, data),
  remove: (id) => api.delete(`/income/${id}`),
};

export const expenseAPI = {
  list: (params) => api.get('/expenses', { params }),
  stats: () => api.get('/expenses/stats'),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  remove: (id) => api.delete(`/expenses/${id}`),
};

export const budgetAPI = {
  list: () => api.get('/budgets'),
  create: (data) => api.post('/budgets', data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  remove: (id) => api.delete(`/budgets/${id}`),
};

export const goalAPI = {
  list: () => api.get('/goals'),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  remove: (id) => api.delete(`/goals/${id}`),
};

export const transactionAPI = {
  list: (params) => api.get('/transactions', { params }),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  remove: (id) => api.delete(`/transactions/${id}`),
};

export const notificationAPI = {
  list: () => api.get('/notifications'),
  readAll: () => api.put('/notifications/read-all'),
  read: (id) => api.put(`/notifications/${id}/read`),
  remove: (id) => api.delete(`/notifications/${id}`),
};

export const categoryAPI = {
  list: (type) => api.get('/categories', { params: { type } }),
  create: (data) => api.post('/categories', data),
  remove: (id) => api.delete(`/categories/${id}`),
};

export const dataAPI = {
  export: () => api.get('/data/export'),
  import: (data) => api.post('/data/import', data),
};

export default api;
