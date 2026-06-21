import mongoose from 'mongoose';

const budgetTargetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, required: true, trim: true },
    monthlyLimit: { type: Number, required: true, min: 0 },
    alertPercentage: { type: Number, default: 80, min: 1, max: 100 },
  },
  { timestamps: true }
);

budgetTargetSchema.index({ userId: 1, category: 1 }, { unique: true });

export default mongoose.model('BudgetTarget', budgetTargetSchema);
