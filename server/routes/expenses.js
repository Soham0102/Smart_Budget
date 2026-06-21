import express from 'express';
import Transaction from '../models/Transaction.js';
import { protect } from '../middleware/auth.js';
import { startOfMonth, endOfMonth } from '../utils/helpers.js';

const router = express.Router();

router.use(protect);

const expenseFilter = (userId, start, end) => ({
  userId,
  type: 'expense',
  ...(start && end ? { date: { $gte: start, $lte: end } } : {}),
});

router.get('/', async (req, res) => {
  try {
    const start = req.query.startDate ? new Date(req.query.startDate) : startOfMonth();
    const end = req.query.endDate ? new Date(req.query.endDate) : endOfMonth();
    const expenses = await Transaction.find(expenseFilter(req.user._id, start, end)).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const start = startOfMonth();
    const end = endOfMonth();
    const expenses = await Transaction.find(expenseFilter(req.user._id, start, end));
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const byCategory = {};
    expenses.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });
    const daysInMonth = end.getDate();
    const mostExpensive = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
    res.json({
      totalExpenses: total,
      dailyAverage: total / daysInMonth,
      mostExpensiveCategory: mostExpensive ? { category: mostExpensive[0], amount: mostExpensive[1] } : null,
      byCategory,
      count: expenses.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { category, amount, date, paymentMethod, notes } = req.body;
    const expense = await Transaction.create({
      userId: req.user._id,
      type: 'expense',
      category,
      description: category,
      amount,
      date,
      paymentMethod,
      notes,
    });
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { category, amount, date, paymentMethod, notes } = req.body;
    const expense = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, type: 'expense' },
      { category, description: category, amount, date, paymentMethod, notes },
      { new: true }
    );
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const expense = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
      type: 'expense',
    });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
