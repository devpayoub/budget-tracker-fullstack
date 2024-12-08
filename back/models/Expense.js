const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  budgetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Budget', required: true }, // Link to budget
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Expense', ExpenseSchema);
