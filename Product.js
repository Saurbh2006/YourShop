const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    shopId: { type: String, required: true }, // Kis shop ka maal hai
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    minStock: { type: Number, default: 10 }, // Alert ke liye
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', ProductSchema);