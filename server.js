const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config(); 

// Models
const User = require('./models/User');
const Product = require('./models/Product');
const Transaction = require('./models/Transaction');
const Staff = require('./models/Staff');

const app = express();
app.use(express.json());
app.use(cors());

// --- DATABASE CONNECTION ---
// --- DATABASE CONNECTION ---
// Ab ye sirf .env file se URI uthayega
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected!"))
    .catch(err => {
        console.log("❌ DB Error: Please check your .env file!");
        process.exit(1); // Server ko stop kar do agar DB connect na ho
    });

// --- AUTH MIDDLEWARE ---
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 
    if (!token) return res.status(403).json({ message: "Token missing!" });

    jwt.verify(token, process.env.JWT_SECRET || 'secret_key', (err, decoded) => {
        if (err) return res.status(401).json({ message: "Session Expired" });
        req.user = decoded; 
        next();
    });
};


// --- SECURE RESET PASSWORD ROUTE (WITHOUT OTP) ---
app.put('/api/auth/reset-password', async (req, res) => {
    try {
        const { userId, shopEmail, newPassword } = req.body;

        // Validation: Check karein ki saari fields bheji gayi hain
        if (!userId || !shopEmail || !newPassword) {
            return res.status(400).json({ success: false, message: "Saari fields bharna zaroori hai!" });
        }

        // 1. Pehle Admin (User) Table mein ID aur Email match karo
        let user = await User.findOne({ userId, shopEmail });
        let modelType = 'admin';

        // 2. Agar Admin nahi mila, toh Staff Table mein check karo
        if (!user) {
            user = await Staff.findOne({ staffId: userId, shopEmail });
            modelType = 'staff';
        }

        // 3. Agar User ID aur Email ka combination galat hai (Security Check)
        if (!user) {
            return res.status(403).json({ 
                success: false, 
                message: "Security Fail: User ID ya Shop Email galat hai!" 
            });
        }

        // 4. Naya Password Hash karo
        const bcrypt = require('bcrypt'); // Agar upar require nahi kiya hai toh
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // 5. Database mein Update karo
        if (modelType === 'admin') {
            await User.findOneAndUpdate({ userId }, { password: hashedPassword });
        } else {
            await Staff.findOneAndUpdate({ staffId: userId }, { password: hashedPassword });
        }

        // 6. Final Response
        res.json({ success: true, message: "Password Successfully Updated!" });

    } catch (err) {
        console.error("Reset Error:", err);
        res.status(500).json({ success: false, message: "Server par koi error hai!" });
    }
});


// --- SHOP REGISTRATION ROUTE ---
app.post('/api/register', async (req, res) => {
    try {
        const { shopName, ownerName, userId, email, password } = req.body;
        const existingUser = await User.findOne({ userId });
        if (existingUser) return res.status(400).json({ message: "Admin ID pehle se majood hai!" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            shopName, 
            ownerName, 
            userId, 
            shopEmail: email, // Registration email saved as Shop Email
            password: hashedPassword
        });

        await newUser.save();
        res.status(201).json({ success: true, message: "Shop Registered Successfully!" });
    } catch (err) {
        res.status(500).json({ message: "Registration fail ho gaya." });
    }
});

// --- LOGIN ROUTE ---

// --- LOGIN ROUTE (UPDATED) ---
// --- LOGIN ROUTE (FIXED FOR STAFF SHOP NAME) ---
app.post('/api/login', async (req, res) => {
    try {
        const { userId, password, role } = req.body;
        let user = null;
        let actualShopName = ""; // Shop name store karne ke liye variable

        if (role === 'admin') {
            user = await User.findOne({ userId });
            if (user) actualShopName = user.shopName; // Admin ke paas apna shopName hota hai
        } else if (role === 'staff') {
            user = await Staff.findOne({ staffId: userId });
            if (user) {
                // STAFF CASE: Hume Admin (User) table se shop ka naam nikalna padega
                const shopOwner = await User.findOne({ userId: user.shopId });
                actualShopName = shopOwner ? shopOwner.shopName : "My Shop";
            }
        }

        if (!user) return res.status(404).json({ success: false, message: `${role} account not found!` });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: "Invalid Password" });

        const sId = user.userId || user.shopId;
        const finalRole = user.userId ? 'Admin' : 'Staff';
        const ownerName = user.ownerName || user.staffName;

        const token = jwt.sign(
            { id: user._id, shopId: sId, role: finalRole }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );

        // AB RESPONSE MEIN SAHI SHOP NAME JAYEGA
        res.json({ 
            success: true, 
            token, 
            shopId: sId, 
            owner: ownerName, 
            role: finalRole,
            shopName: actualShopName // <--- Ab staff ko bhi Admin wala shop name milega
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ success: false, message: "Login Error" });
    }
});

// --- 1. GET PROFILE ---
// Isse data load hoke aapke form mein dikhega
app.get('/api/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.user.shopId });
        if (!user) return res.status(404).json({ message: "Shop details nahi mili!" });
        res.json(user);
    } catch (err) { 
        res.status(500).json({ message: "Error fetching profile" }); 
    }
});

// --- 2. UPDATE PROFILE (PUT) ---
// Jab aap "Update All Settings" click karoge toh ye chalega
app.put('/api/profile/update', verifyToken, async (req, res) => {
    try {
        const { shopName, ownerName, shopEmail, shopPhone, gstin, address } = req.body;
        
        const updatedUser = await User.findOneAndUpdate(
            { userId: req.user.shopId }, 
            { 
                // In fields ko update karo
                $set: { 
                    shopName, 
                    ownerName, 
                    shopEmail, 
                    shopPhone, 
                    gstin, 
                    address 
                },
                // Is field ko database se poori tarah hata do
                $unset: { email: "" } 
            },
            { new: true }
        );

        res.json({ success: true, message: "Profile Updated & Old Email Field Removed!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});


// --- DASHBOARD STATS ---
app.get('/api/dashboard/stats', verifyToken, async (req, res) => {
    try {
        const shopId = req.user.shopId;
        const products = await Product.find({ shopId });
        const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
        const todayTxns = await Transaction.find({ shopId, date: { $gte: startOfDay } });
        
        res.json({ 
            success: true, 
            todayEarnings: todayTxns.reduce((sum, t) => sum + t.totalAmount, 0),
            totalAssets: products.reduce((sum, p) => sum + (p.price * p.stock), 0),
            lowStockItems: products.filter(p => p.stock <= (p.minStock || 5)).length,
            totalProducts: products.length 
        });
    } catch (err) { res.status(500).json({ success: false }); }
});

// --- TRANSACTIONS ROUTES ---
app.get('/api/transactions', verifyToken, async (req, res) => {
    try {
        const txns = await Transaction.find({ shopId: req.user.shopId }).sort({ date: -1 });
        res.json(txns);
    } catch (err) { res.status(500).send(err); }
});

app.post('/api/transactions/create', verifyToken, async (req, res) => {
    try {
        const newTxn = new Transaction({ ...req.body, shopId: req.user.shopId, date: new Date() });
        await newTxn.save();
        for (let item of req.body.items) {
            await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
        }
        res.status(201).json({ success: true });
    } catch (err) { res.status(500).json({ message: "Checkout failed" }); }
});

app.delete('/api/transactions/:id', verifyToken, async (req, res) => {
    try {
        await Transaction.findOneAndDelete({ _id: req.params.id, shopId: req.user.shopId });
        res.json({ success: true, message: "Deleted" });
    } catch (err) { res.status(500).json({ message: "Delete failed" }); }
});

// --- PRODUCTS ROUTES ---
app.get('/api/products', verifyToken, async (req, res) => { 
    try { res.json(await Product.find({ shopId: req.user.shopId })); } catch (err) { res.status(500).send(err); }
});

app.post('/api/products/add', verifyToken, async (req, res) => { 
    try {
        const n = new Product({...req.body, shopId: req.user.shopId}); 
        await n.save(); res.json({success:true}); 
    } catch (err) { res.status(500).json({message: "Add failed"}); }
});

app.put('/api/products/:id', verifyToken, async (req, res) => { 
    try {
        await Product.findOneAndUpdate({_id:req.params.id, shopId:req.user.shopId}, req.body); 
        res.json({success:true}); 
    } catch (err) { res.status(500).json({message: "Update failed"}); }
});

app.delete('/api/products/:id', verifyToken, async (req, res) => { 
    try {
        await Product.findOneAndDelete({_id:req.params.id, shopId:req.user.shopId}); 
        res.json({success:true}); 
    } catch (err) { res.status(500).json({message: "Delete failed"}); }
});

// --- STAFF ROUTES ---
app.get('/api/staff', verifyToken, async (req, res) => { 
    try { res.json(await Staff.find({ shopId: req.user.shopId }).select('-password')); } catch (err) { res.status(500).send(err); }
});

app.post('/api/staff/add', verifyToken, async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const newStaff = new Staff({ ...req.body, password: hashedPassword, shopId: req.user.shopId });
        await newStaff.save();
        res.status(201).json({ success: true });
    } catch (err) { res.status(500).json({ message: "Error" }); }
});

app.delete('/api/staff/:id', verifyToken, async (req, res) => {
    try {
        await Staff.findOneAndDelete({ _id: req.params.id, shopId: req.user.shopId });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ message: "Error" }); }
});


// --- RESET STAFF PASSWORD (ADMIN ONLY) ---
app.put('/api/staff/reset-password', verifyToken, async (req, res) => {
    try {
        const { staffId, newPassword } = req.body;

        // Security Check 1: Check karein ki saari fields hain ya nahi
        if (!staffId || !newPassword) {
            return res.status(400).json({ success: false, message: "Staff ID aur Password zaroori hai!" });
        }

        // Security Check 2: Check karein ki request karne wala Admin hai ya nahi
        // (Humne verifyToken middleware mein req.user set kiya tha)
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ success: false, message: "Security Alert: Sirf Admin hi staff ka password badal sakta hai!" });
        }

        // 1. Naya Password Hash karo
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 2. Staff table mein update karo
        // Hum 'shopId' bhi check karte hain taaki ek shop ka admin dusri shop ke staff ka pass na badal sake
const updatedStaff = await Staff.findOneAndUpdate(
    { staffId: staffId, shopId: req.user.shopId }, 
    { password: hashedPassword },
    { returnDocument: 'after' } // <--- Ise aise badal do
);
        if (!updatedStaff) {
            return res.status(404).json({ success: false, message: "Staff member nahi mila!" });
        }

        res.json({ success: true, message: "Staff password successfully updated by Admin!" });

    } catch (err) {
        console.error("Staff Reset Error:", err);
        res.status(500).json({ success: false, message: "Server par koi error hai!" });
    }
});



// --- FRONTEND SERVING ---
app.use(express.static(path.join(__dirname, '../inventory-frontend')));

app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../inventory-frontend', 'index.html'));
    } else {
        res.status(404).json({ message: "API Route not found" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server: http://localhost:${PORT}`));

