import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Transaction from './models/Transaction.js';
import BudgetTarget from './models/BudgetTarget.js';
import SavingsGoal from './models/SavingsGoal.js';

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const email = 'demo@smartbudget.app';
  let user = await User.findOne({ email });

  if (user) {
    console.log('Demo user exists, clearing data and resetting password...');
    // Reset password so demo login always works
    user.password = 'demo123';
    await user.save();
    await Promise.all([
      Transaction.deleteMany({ userId: user._id }),
      BudgetTarget.deleteMany({ userId: user._id }),
      SavingsGoal.deleteMany({ userId: user._id }),
    ]);
  } else {
    user = await User.create({
      name: 'Demo User',
      email,
      password: 'demo123',
      currency: 'INR',
    });
    console.log('Created demo user: demo@smartbudget.app / demo123');
  }

  const now = new Date();

  const incomes = [
    { source: 'Salary', amount: 75000, daysAgo: 2 },
    { source: 'Freelancing', amount: 15000, daysAgo: 10 },
    { source: 'Investments', amount: 5000, daysAgo: 15 },
  ];

  for (const inc of incomes) {
    const date = new Date(now);
    date.setDate(date.getDate() - inc.daysAgo);
    await Transaction.create({
      userId: user._id,
      type: 'income',
      category: inc.source,
      source: inc.source,
      description: inc.source,
      amount: inc.amount,
      date,
    });
  }

  const expenses = [
    { category: 'Food', amount: 450, daysAgo: 1, paymentMethod: 'UPI' },
    { category: 'Transport', amount: 200, daysAgo: 1, paymentMethod: 'Cash' },
    { category: 'Rent', amount: 15000, daysAgo: 3, paymentMethod: 'Bank Transfer' },
    { category: 'Shopping', amount: 3200, daysAgo: 5, paymentMethod: 'Credit Card' },
    { category: 'Bills', amount: 1800, daysAgo: 7, paymentMethod: 'UPI' },
    { category: 'Entertainment', amount: 900, daysAgo: 8, paymentMethod: 'Debit Card' },
    { category: 'Food', amount: 680, daysAgo: 4, paymentMethod: 'UPI' },
    { category: 'Healthcare', amount: 1200, daysAgo: 12, paymentMethod: 'UPI' },
    { category: 'Education', amount: 2500, daysAgo: 14, paymentMethod: 'Bank Transfer' },
    { category: 'Transport', amount: 350, daysAgo: 2, paymentMethod: 'UPI' },
  ];

  for (const exp of expenses) {
    const date = new Date(now);
    date.setDate(date.getDate() - exp.daysAgo);
    await Transaction.create({
      userId: user._id,
      type: 'expense',
      category: exp.category,
      description: exp.category,
      amount: exp.amount,
      date,
      paymentMethod: exp.paymentMethod,
    });
  }

  const budgets = [
    { category: 'Food', monthlyLimit: 5000, alertPercentage: 80 },
    { category: 'Transport', monthlyLimit: 2000, alertPercentage: 80 },
    { category: 'Shopping', monthlyLimit: 5000, alertPercentage: 80 },
    { category: 'Entertainment', monthlyLimit: 3000, alertPercentage: 80 },
    { category: 'Bills', monthlyLimit: 3000, alertPercentage: 80 },
  ];

  for (const b of budgets) {
    await BudgetTarget.create({ userId: user._id, ...b });
  }

  const goals = [
    { name: 'Buy Laptop', targetAmount: 80000, currentSaved: 35000, deadline: new Date(now.getFullYear(), 11, 31) },
    { name: 'Vacation', targetAmount: 50000, currentSaved: 12000, deadline: new Date(now.getFullYear(), 8, 15) },
    { name: 'Emergency Fund', targetAmount: 100000, currentSaved: 45000, deadline: new Date(now.getFullYear() + 1, 5, 1) },
  ];

  for (const g of goals) {
    await SavingsGoal.create({ userId: user._id, ...g });
  }

  console.log('Seed data created successfully!');
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
