const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

//register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ status: 'notok', msg: 'Please enter all required data' });
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ status: 'notokmail', msg: 'Email already exists' });
    }

    const newUser = new User({ username, email, password });

    if (!password) {
      return res.status(400).json({ status: 'notokpassword', msg: 'Password is required' });
    }

    const salt = await bcrypt.genSalt(10);
    newUser.password = await bcrypt.hash(password, salt);

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET || config.get('jwtSecret'), {
      expiresIn: '1h',
    });

    res.status(200).json({ status: 'ok', msg: 'Successfully registered', token, user: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', msg: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'User does not exist.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials.' });

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ token, user: { id: user._id, username: user.username } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});


//token
const jwtMiddleware = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Get token from Autho

  if (!token) {
    return res.status(401).json({ status: 'notok', msg: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); 
    req.user = decoded;  // Attach user data to request
    next();
  } catch (err) {
    return res.status(401).json({ status: 'notok', msg: 'Unauthorized' });
  }
};


// Dashboard Route
router.get('/dashboard', (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'Unauthorized' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ msg: 'Unauthorized' });
    
    res.status(200).json({ username: decoded.username }); // Send username from decoded token
  });
});

//post budget with id/token JWT
router.use(jwtMiddleware);
router.post('/budgets', async (req, res) => {
  const { name, amount } = req.body;
  const userId = req.user?.id;

  if (!userId || !name || !amount) {
    return res.status(400).json({ msg: 'All fields are required, including userId.' });
  }

  try {
    const newBudget = new Budget({ userId, name, amount });
    const savedBudget = await newBudget.save();
    res.status(201).json(savedBudget);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

//get budget with id/token JWT
router.get('/budgets', jwtMiddleware, async (req, res) => {
  const userId = req.user?.id; // userId from JWT

  if (!userId) {
    return res.status(400).json({ msg: 'User ID is required.' });
  }

  try {
    const budgets = await Budget.find({ userId });
    res.status(200).json({ budgets });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// budget with id
router.get('/budgets/:id', jwtMiddleware, async (req, res) => {
  const budgetId = req.params.id; // Get budgetId from URL
  console.log('Received Budget ID:', budgetId);

  try {
    const budget = await Budget.findById(budgetId);
    if (!budget) {
      return res.status(404).json({ msg: 'Budget not found.' });
    }

    const expenses = await Expense.find({ budgetId });
    res.status(200).json({ budget, expenses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

//Manage Expenses
router.post('/expenses', jwtMiddleware, async (req, res) => {
  const { name, amount, budgetId, userId } = req.body;

  if (!name || !amount || !budgetId || !userId) {
    return res.status(400).json({ msg: 'All fields are required.' });
  }

  try {
    // Fetch the budget to validate the remaining amount
    const budget = await Budget.findById(budgetId);
    if (!budget) {
      return res.status(404).json({ msg: 'Budget not found.' });
    }

    const totalSpent = await Expense.aggregate([
      { $match: { budgetId: budget._id } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const remaining = budget.amount - (totalSpent[0]?.total || 0);
    if (amount > remaining) {
      return res.status(400).json({ msg: `Expense exceeds the budget! Remaining budget is $${remaining}` });
    }

    const newExpense = new Expense({ name, amount, budgetId, userId, date: new Date() });
    const savedExpense = await newExpense.save();
    res.status(201).json(savedExpense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

//delete expenses with id/Token
router.delete('/expenses/:id', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ status: 'error', msg: 'No token provided' });
  }

  try {
    // Verify the token
    const user = jwt.verify(token, process.env.JWT_SECRET);

    const expenseId = req.params.id;

    // MongoDB query to delete the expense
    const result = await Expense.findByIdAndDelete(expenseId);

    if (!result) {
      return res.status(404).json({ status: 'error', msg: 'Expense not found' });
    }

    res.status(200).json({ status: 'ok', msg: 'Expense deleted successfully' });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ status: 'error', msg: 'Invalid token' });
    }
    console.error('Error deleting expense:', error);
    res.status(500).json({ status: 'error', msg: 'Failed to delete expense' });
  }
});

//delt budget
router.delete('/budgets/:id', jwtMiddleware, async (req, res) => {
  const budgetId = req.params.id; // Get budget ID from URL
  console.log('Budget ID to delete:', budgetId);

  try {
    const deletedBudget = await Budget.findByIdAndDelete(budgetId);
    if (!deletedBudget) {
      return res.status(404).json({ msg: 'Budget not found.' });
    }

    // Optionally, delete associated expenses
    await Expense.deleteMany({ budgetId });

    res.status(200).json({ msg: 'Budget deleted successfully.' });
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).json({ msg: 'Server error.' });
  }
});

// edit budget name
router.put('/budgets/:id', jwtMiddleware, async (req, res) => {
  const budgetId = req.params.id;
  const { name, amount } = req.body;

  try {
    const updatedBudget = await Budget.findByIdAndUpdate(
      budgetId,
      { name, amount },
      { new: true, runValidators: true } // Return the updated document
    );

    if (!updatedBudget) {
      return res.status(404).json({ msg: 'Budget not found.' });
    }

    res.status(200).json(updatedBudget);
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({ msg: 'Server error.' });
  }
});

//get exps
router.get('/expenses', jwtMiddleware, async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 }); // Fetch all expenses sorted by date
    res.status(200).json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

const getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user.id })
      .populate('expenses') // Populate the associated expenses
      .exec();

    res.status(200).json({ budgets });
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
};

//get info user from token stored
router.get('/profile', jwtMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user); // Respond with user data
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

//update info
router.put('/update-profile', jwtMiddleware, async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.username = username || user.username;
    user.email = email || user.email;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    res.json({ msg: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});


//logout
router.post('/logout', (req, res) => {
  if (!req.session) {
    return res.status(400).send({ status: 'error', msg: 'No active session' });
  }
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send({ status: 'error', msg: 'Logout failed' });
    }
    res.clearCookie('connect.sid'); // Clear the session cookie
    res.status(200).send({ status: 'ok', msg: 'Logged out successfully' });
  });
});




module.exports = router;
