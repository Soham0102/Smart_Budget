import express from 'express';
import Udhari from '../models/Udhari.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/', async (req, res) => {
  try {
    const entries = await Udhari.find({ userId: req.user._id }).sort({ date: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { type, personName, amount, description, date, dueDate } = req.body;
    const entry = await Udhari.create({
      userId: req.user._id,
      type, personName, amount, description, date, dueDate,
    });
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const entry = await Udhari.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark as settled
router.put('/:id/settle', async (req, res) => {
  try {
    const entry = await Udhari.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { settled: true, settledOn: new Date() },
      { new: true }
    );
    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Udhari.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
