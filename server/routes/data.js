import express from 'express';
import Transaction from '../models/Transaction.js';
import BudgetTarget from '../models/BudgetTarget.js';
import SavingsGoal from '../models/SavingsGoal.js';
import CustomCategory from '../models/CustomCategory.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/export', async (req, res) => {
  try {
    const userId = req.user._id;
    const [transactions, budgets, goals, categories] = await Promise.all([
      Transaction.find({ userId }),
      BudgetTarget.find({ userId }),
      SavingsGoal.find({ userId }),
      CustomCategory.find({ userId }),
    ]);

    const data = {
      exportedAt: new Date().toISOString(),
      user: { name: req.user.name, email: req.user.email, currency: req.user.currency },
      transactions,
      budgets,
      goals,
      categories,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=smartbudget-backup.json');
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/import', async (req, res) => {
  try {
    const userId = req.user._id;
    const { transactions, budgets, goals, categories } = req.body;

    if (transactions?.length) {
      await Transaction.deleteMany({ userId });
      await Transaction.insertMany(transactions.map((t) => ({ ...t, _id: undefined, userId })));
    }
    if (budgets?.length) {
      await BudgetTarget.deleteMany({ userId });
      await BudgetTarget.insertMany(budgets.map((b) => ({ ...b, _id: undefined, userId })));
    }
    if (goals?.length) {
      await SavingsGoal.deleteMany({ userId });
      await SavingsGoal.insertMany(goals.map((g) => ({ ...g, _id: undefined, userId })));
    }
    if (categories?.length) {
      await CustomCategory.deleteMany({ userId });
      await CustomCategory.insertMany(categories.map((c) => ({ ...c, _id: undefined, userId })));
    }

    res.json({ message: 'Data imported successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
