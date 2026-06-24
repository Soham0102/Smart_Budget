import mongoose from 'mongoose';

const udhariSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['gave', 'took'], required: true }, // gave = I gave (they owe me), took = I took (I owe them)
    personName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    description: { type: String, trim: true },
    date: { type: Date, default: Date.now },
    dueDate: { type: Date },
    settled: { type: Boolean, default: false },
    settledOn: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('Udhari', udhariSchema);
