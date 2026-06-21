import express from 'express';
import CustomCategory from '../models/CustomCategory.js';
import { protect } from '../middleware/auth.js';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_SOURCES } from '../utils/helpers.js';

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { type = 'expense' } = req.query;
    const custom = await CustomCategory.find({ userId: req.user._id, type });
    const defaults = type === 'income' ? DEFAULT_INCOME_SOURCES : DEFAULT_EXPENSE_CATEGORIES;
    const names = [...new Set([...defaults, ...custom.map((c) => c.name)])];
    res.json(names);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, type = 'expense' } = req.body;
    const cat = await CustomCategory.create({ userId: req.user._id, name, type });
    res.status(201).json(cat);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await CustomCategory.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
