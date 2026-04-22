const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    shopId: { type: String, required: true },
    customerName: { type: String, default: "Walk-in Customer" },
    customerPhone: { type: String },
    items: [{
        productId: { type: String }, // Strictly String rakhein
        name: String,
        quantity: Number,
        price: Number,
        subtotal: Number
    }],
    totalAmount: { type: Number, required: true },
    paymentMode: { type: String, default: 'Cash' },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', TransactionSchema);