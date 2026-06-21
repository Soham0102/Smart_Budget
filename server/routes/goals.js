import express from 'express';
import SavingsGoal from '../models/SavingsGoal.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const goals = await SavingsGoal.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const enriched = goals.map((g) => ({
      ...g.toObject(),
      progress: g.targetAmount > 0 ? (g.currentSaved / g.targetAmount) * 100 : 0,
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const goal = await SavingsGoal.create({ ...req.body, userId: req.user._id });
    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const goal = await SavingsGoal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    Object.assign(goal, req.body);
    await goal.save();

    if (goal.currentSaved >= goal.targetAmount && req.user.preferences?.notifications) {
      const existing = await Notification.findOne({
        userId: req.user._id,
        type: 'goal',
        title: `Goal Achieved: ${goal.name}`,
      });
      if (!existing) {
        await Notification.create({
          userId: req.user._id,
          type: 'goal',
          title: `Goal Achieved: ${goal.name}`,
          message: `Congratulations! You've reached your ${goal.name} savings goal of ₹${goal.targetAmount}.`,
        });
      }
    }

    res.json({
      ...goal.toObject(),
      progress: goal.targetAmount > 0 ? (goal.currentSaved / goal.targetAmount) * 100 : 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const goal = await SavingsGoal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
