const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Utility to get or create the default user
async function getUser() {
  let user = await User.findOne({ username: 'trader1' });
  if (!user) {
    user = new User({ username: 'trader1', balance: 100000, holdings: [] });
    await user.save();
  }
  return user;
}

// Get portfolio data
router.get('/', async (req, res) => {
  try {
    const user = await getUser();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching portfolio' });
  }
});

// Get transaction history
router.get('/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ timestamp: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching transactions' });
  }
});

// Execute a trade (Buy/Sell)
router.post('/trade', async (req, res) => {
  const { type, symbol, quantity, price } = req.body;
  if (!['BUY', 'SELL'].includes(type) || !symbol || !quantity || !price) {
    return res.status(400).json({ error: 'Invalid trade parameters' });
  }

  try {
    const user = await getUser();
    const cost = quantity * price;

    if (type === 'BUY') {
      if (user.balance < cost) {
        return res.status(400).json({ error: 'Insufficient funds' });
      }
      user.balance -= cost;
      
      const holdingIndex = user.holdings.findIndex(h => h.symbol === symbol);
      if (holdingIndex >= 0) {
        // Recalculate average price
        const holding = user.holdings[holdingIndex];
        const oldTotalCost = holding.quantity * holding.averagePrice;
        const newTotalCost = oldTotalCost + cost;
        holding.quantity += quantity;
        holding.averagePrice = newTotalCost / holding.quantity;
      } else {
        user.holdings.push({ symbol, quantity, averagePrice: price });
      }
    } else if (type === 'SELL') {
      const holdingIndex = user.holdings.findIndex(h => h.symbol === symbol);
      if (holdingIndex === -1 || user.holdings[holdingIndex].quantity < quantity) {
        return res.status(400).json({ error: 'Insufficient stocks to sell' });
      }
      
      user.balance += cost;
      const holding = user.holdings[holdingIndex];
      holding.quantity -= quantity;
      
      if (holding.quantity === 0) {
        user.holdings.splice(holdingIndex, 1);
      }
    }

    await user.save();

    // Log transaction
    const transaction = new Transaction({ type, symbol, quantity, price });
    await transaction.save();

    res.json({ message: 'Trade successful', user, transaction });
  } catch (error) {
    console.error('Trade error:', error);
    res.status(500).json({ error: 'Server error executing trade' });
  }
});

module.exports = router;
