const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expenses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Expense' }], // Array of expense IDs
});


module.exports = mongoose.model('Budget', BudgetSchema);
