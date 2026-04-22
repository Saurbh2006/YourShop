const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    shopName: { type: String, required: true },
    ownerName: { type: String, required: true },
    userId: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // Billing Details
    shopEmail: { type: String, default: "" }, 
    shopPhone: { type: String, default: "" }, 
    gstin: { type: String, default: "" },
    address: { type: String, default: "" },
    role: { type: String, default: 'admin' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);