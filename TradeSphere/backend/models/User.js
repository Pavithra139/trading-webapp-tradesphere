const mongoose = require('mongoose');

const holdingSchema = new mongoose.Schema({
  symbol: { type: String, required: true },
  quantity: { type: Number, required: true },
  averagePrice: { type: Number, required: true }
});

const userSchema = new mongoose.Schema({
  username: { type: String, default: 'trader1' },
  balance: { type: Number, default: 100000 }, // USD 100,000 for starting balance
  holdings: [holdingSchema]
});

module.exports = mongoose.model('User', userSchema);
