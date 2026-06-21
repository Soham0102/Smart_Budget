import mongoose from 'mongoose';

const customCategorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['expense', 'income'], default: 'expense' },
  },
  { timestamps: true }
);

customCategorySchema.index({ userId: 1, name: 1, type: 1 }, { unique: true });

export default mongoose.model('CustomCategory', customCategorySchema);
