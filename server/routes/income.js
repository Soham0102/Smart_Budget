import express from 'express';
import Transaction from '../models/Transaction.js';
import { protect } from '../middleware/auth.js';
import { startOfMonth, endOfMonth } from '../utils/helpers.js';

const router = express.Router();

router.use(protect);

const incomeFilter = (userId, start, end) => ({
  userId,
  type: 'income',
  ...(start && end ? { date: { $gte: start, $lte: end } } : {}),
});

router.get('/', async (req, res) => {
  try {
    const start = req.query.startDate ? new Date(req.query.startDate) : startOfMonth();
    const end = req.query.endDate ? new Date(req.query.endDate) : endOfMonth();
    const incomes = await Transaction.find(incomeFilter(req.user._id, start, end)).sort({ date: -1 });
    res.json(incomes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const start = startOfMonth();
    const end = endOfMonth();
    const incomes = await Transaction.find(incomeFilter(req.user._id, start, end));
    const total = incomes.reduce((s, i) => s + i.amount, 0);
    const bySource = {};
    incomes.forEach((i) => {
      const src = i.source || i.category || 'Other';
      bySource[src] = (bySource[src] || 0) + i.amount;
    });
    res.json({ totalMonthlyIncome: total, bySource, count: incomes.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { source, amount, date, notes } = req.body;
    const income = await Transaction.create({
      userId: req.user._id,
      type: 'income',
      category: source,
      source,
      description: source,
      amount,
      date,
      notes,
    });
    res.status(201).json(income);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { source, amount, date, notes } = req.body;
    const income = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, type: 'income' },
      { source, category: source, description: source, amount, date, notes },
      { new: true }
    );
    if (!income) return res.status(404).json({ message: 'Income not found' });
    res.json(income);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const income = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
      type: 'income',
    });
    if (!income) return res.status(404).json({ message: 'Income not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
