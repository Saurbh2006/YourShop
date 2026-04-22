const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema({
    shopId: { type: String, required: true },
    staffName: { type: String, required: true },
    staffId: { type: String, required: true, unique: true },
    email: { type: String }, // Ye line add karein
    password: { type: String, required: true },
    role: { type: String, default: "Staff" },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Staff', StaffSchema);