🛒 YourShop - Web-Based Inventory Management System
YourShop is a modern, responsive, and user-friendly Inventory & Billing management system specifically designed for retail businesses. It features separate, dedicated dashboards for Admins and Staff to streamline daily business operations.

🚀 Key Features
🔐 Multi-User Authentication
Admin Access: Complete control over the system, including profile settings, inventory management, staff management, and financial reports.

Staff Access: Limited access focused on billing sessions and checking real-time inventory levels.

Secure Security: Implements JWT (JSON Web Tokens) for session management and bcrypt for secure password hashing.

📦 Inventory & Product Management
Real-time Tracking: Monitor stock levels as sales happen.

Low Stock Alerts: Automatic visual indicators when a product falls below its minimum stock limit.

Full CRUD: Add, update, and delete products with ease.

🧾 Billing & Transactions
Professional Billing UI: Quick product search and automated total calculations.

Payment Methods: Supports Cash, GPay/UPI, and Card payments.

Auto-Stock Sync: Inventory levels are automatically deducted upon successful billing.

Invoice Summaries: Instant generation of transaction records for customers.

📊 Dashboard & Analytics
Live Earnings: Track total sales for the current day.

Business Summary: View total products, low-stock items, and total assets at a glance.

🛠️ Tech Stack
Frontend: HTML5, CSS3 (Custom UI), JavaScript (ES6+).

Backend: Node.js, Express.js.

Database: MongoDB (via Mongoose).

Icons: Font-Awesome.

Authentication: JWT & Bcrypt.

📸 Project Preview
(Tip: Upload a screenshot of your dashboard to your GitHub repo and link it here)

⚙️ Installation & Setup
Clone the repository:

Bash
git clone https://github.com/Saurbh2006/YourShop.git
Install dependencies:

Bash
cd YourShop/inventory-backend
npm install
Set up .env file:
Create a .env file in the backend folder and add your credentials:

Code snippet
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000
Run the server:

Bash
npm run dev
🤝 Contributing
Contributions are welcome! Feel free to fork this repository and submit a pull request for any new features or bug fixes.
