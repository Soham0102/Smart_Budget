import express from 'express';
import Transaction from '../models/Transaction.js';
import BudgetTarget from '../models/BudgetTarget.js';
import SavingsGoal from '../models/SavingsGoal.js';
import { protect } from '../middleware/auth.js';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  parseDateRange,
  monthLabels,
} from '../utils/helpers.js';

const router = express.Router();

router.use(protect);

router.get('/summary', async (req, res) => {
  try {
    const start = startOfMonth();
    const end = endOfMonth();
    const userId = req.user._id;

    const [incomes, expenses, budgets, goals] = await Promise.all([
      Transaction.find({ userId, type: 'income', date: { $gte: start, $lte: end } }),
      Transaction.find({ userId, type: 'expense', date: { $gte: start, $lte: end } }),
      BudgetTarget.find({ userId }),
      SavingsGoal.find({ userId }),
    ]);

    const totalIncome = incomes.reduce((s, t) => s + t.amount, 0);
    const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
    const remainingBalance = totalIncome - totalExpenses;
    const savingsThisMonth = Math.max(remainingBalance, 0);

    const totalBudget = budgets.reduce((s, b) => s + b.monthlyLimit, 0);
    const budgetUtilization = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;

    res.json({
      totalIncome,
      totalExpenses,
      remainingBalance,
      savingsThisMonth,
      budgetUtilization: Math.min(budgetUtilization, 100),
      goalsCount: goals.length,
      transactionCount: incomes.length + expenses.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/charts', async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const s = startOfMonth(d);
      const e = endOfMonth(d);
      const [inc, exp] = await Promise.all([
        Transaction.find({ userId, type: 'income', date: { $gte: s, $lte: e } }),
        Transaction.find({ userId, type: 'expense', date: { $gte: s, $lte: e } }),
      ]);
      monthlyTrend.push({
        month: d.toLocaleString('default', { month: 'short' }),
        income: inc.reduce((a, t) => a + t.amount, 0),
        expense: exp.reduce((a, t) => a + t.amount, 0),
      });
    }

    const start = startOfMonth();
    const end = endOfMonth();
    const monthExpenses = await Transaction.find({
      userId,
      type: 'expense',
      date: { $gte: start, $lte: end },
    });
    const categoryBreakdown = {};
    monthExpenses.forEach((e) => {
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.amount;
    });
    const expensePie = Object.entries(categoryBreakdown).map(([name, value]) => ({ name, value }));

    const weekStart = startOfWeek();
    const weekEnd = endOfWeek();
    const weekExpenses = await Transaction.find({
      userId,
      type: 'expense',
      date: { $gte: weekStart, $lte: weekEnd },
    });
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklySpending = days.map((day, i) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(dayDate.getDate() + i);
      const dayStart = new Date(dayDate.setHours(0, 0, 0, 0));
      const dayEnd = new Date(dayDate.setHours(23, 59, 59, 999));
      const amount = weekExpenses
        .filter((e) => e.date >= dayStart && e.date <= dayEnd)
        .reduce((s, e) => s + e.amount, 0);
      return { day, amount };
    });

    const savingsGrowth = monthlyTrend.map((m) => ({
      month: m.month,
      savings: Math.max(m.income - m.expense, 0),
    }));

    res.json({ monthlyTrend, expensePie, weeklySpending, savingsGrowth, monthLabels: monthLabels() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/recent', async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ date: -1 })
      .limit(10);
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/insights', async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const thisStart = startOfMonth(now);
    const thisEnd = endOfMonth(now);
    const lastStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const lastEnd = endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));

    const [thisExp, lastExp, goals] = await Promise.all([
      Transaction.find({ userId, type: 'expense', date: { $gte: thisStart, $lte: thisEnd } }),
      Transaction.find({ userId, type: 'expense', date: { $gte: lastStart, $lte: lastEnd } }),
      SavingsGoal.find({ userId }),
    ]);

    const sumByCat = (txs) => {
      const m = {};
      txs.forEach((t) => { m[t.category] = (m[t.category] || 0) + t.amount; });
      return m;
    };

    const thisCat = sumByCat(thisExp);
    const lastCat = sumByCat(lastExp);
    const insights = [];

    Object.keys(thisCat).forEach((cat) => {
      const curr = thisCat[cat];
      const prev = lastCat[cat] || 0;
      if (prev > 0) {
        const change = ((curr - prev) / prev) * 100;
        if (Math.abs(change) >= 10) {
          insights.push({
            type: change > 0 ? 'warning' : 'success',
            message: change > 0
              ? `You spent ${change.toFixed(0)}% more on ${cat} this month.`
              : `${cat} expenses decreased by ${Math.abs(change).toFixed(0)}%.`,
          });
        }
      }
    });

    goals.forEach((g) => {
      const progress = g.targetAmount > 0 ? (g.currentSaved / g.targetAmount) * 100 : 0;
      if (progress >= 50) {
        insights.push({
          type: 'info',
          message: `${g.name} savings target is ${progress >= 100 ? 'achieved!' : 'on track'} (${progress.toFixed(0)}% complete).`,
        });
      }
    });

    if (insights.length === 0) {
      insights.push({ type: 'info', message: 'Keep tracking your expenses to unlock personalized insights.' });
    }

    res.json(insights);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/analytics', async (req, res) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;
    const { start, end } = parseDateRange(period, startDate, endDate);
    const userId = req.user._id;

    const [incomes, expenses] = await Promise.all([
      Transaction.find({ userId, type: 'income', date: { $gte: start, $lte: end } }),
      Transaction.find({ userId, type: 'expense', date: { $gte: start, $lte: end } }).sort({ date: 1 }),
    ]);

    const totalIncome = incomes.reduce((s, t) => s + t.amount, 0);
    const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
    const savings = totalIncome - totalExpenses;

    const incomeBySource = {};
    incomes.forEach((i) => {
      const src = i.source || i.category;
      incomeBySource[src] = (incomeBySource[src] || 0) + i.amount;
    });

    const expenseByCategory = {};
    expenses.forEach((e) => {
      expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
    });

    const dailyTrend = {};
    expenses.forEach((e) => {
      const key = e.date.toISOString().split('T')[0];
      dailyTrend[key] = (dailyTrend[key] || 0) + e.amount;
    });

    res.json({
      period,
      start,
      end,
      totalIncome,
      totalExpenses,
      savings,
      incomeBySource,
      expenseByCategory,
      dailyTrend: Object.entries(dailyTrend).map(([date, amount]) => ({ date, amount })),
      transactions: [...incomes, ...expenses].sort((a, b) => b.date - a.date),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
