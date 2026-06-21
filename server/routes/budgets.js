import express from 'express';
import BudgetTarget from '../models/BudgetTarget.js';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';
import { startOfMonth, endOfMonth } from '../utils/helpers.js';

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const targets = await BudgetTarget.find({ userId: req.user._id });
    const start = startOfMonth();
    const end = endOfMonth();
    const expenses = await Transaction.find({
      userId: req.user._id,
      type: 'expense',
      date: { $gte: start, $lte: end },
    });

    const spentByCategory = {};
    expenses.forEach((e) => {
      spentByCategory[e.category] = (spentByCategory[e.category] || 0) + e.amount;
    });

    const result = await Promise.all(
      targets.map(async (t) => {
        const spent = spentByCategory[t.category] || 0;
        const utilization = t.monthlyLimit > 0 ? (spent / t.monthlyLimit) * 100 : 0;
        const alertLevel =
          utilization >= 100 ? 'exceeded' : utilization >= t.alertPercentage ? 'warning' : 'ok';

        if (utilization >= t.alertPercentage && req.user.preferences?.notifications) {
          const existing = await Notification.findOne({
            userId: req.user._id,
            type: 'budget',
            title: `Budget Alert: ${t.category}`,
            createdAt: { $gte: start },
          });
          if (!existing) {
            await Notification.create({
              userId: req.user._id,
              type: 'budget',
              title: `Budget Alert: ${t.category}`,
              message:
                utilization >= 100
                  ? `${t.category} budget exceeded! Spent ₹${spent.toFixed(0)} of ₹${t.monthlyLimit}.`
                  : `${t.category} budget at ${utilization.toFixed(0)}% (₹${spent.toFixed(0)} / ₹${t.monthlyLimit}).`,
            });
          }
        }

        return {
          ...t.toObject(),
          spent,
          utilization: Math.min(utilization, 100),
          rawUtilization: utilization,
          alertLevel,
          remaining: Math.max(t.monthlyLimit - spent, 0),
        };
      })
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const target = await BudgetTarget.create({ ...req.body, userId: req.user._id });
    res.status(201).json(target);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Budget for this category already exists' });
    }
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const target = await BudgetTarget.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!target) return res.status(404).json({ message: 'Budget target not found' });
    res.json(target);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const target = await BudgetTarget.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!target) return res.status(404).json({ message: 'Budget target not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
