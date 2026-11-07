# 💰 Finora — Expense Tracker Dashboard

A full-stack, responsive expense tracking dashboard built with **React + Vite**, **Express.js**, and **MongoDB (Mongoose)** with support for both **MongoDB Atlas** and **MongoDB Compass (Local)**.

---

## ✨ Features
- 📊 **Dynamic Dashboard Summary**: Real-time Total Balance, Income, Expense, and Savings Rate.
- 📈 **Interactive Cash Flow & Trends**: Filter cash flow by 6 months or current year with interactive area charts (Recharts).
- 🥧 **Spending Breakdown**: Categorized expense donut chart.
- 💸 **Transaction Management**: Add, edit, delete, and search transactions with type and category filters.
- 📥 **Export to CSV**: Download transaction records directly to CSV.
- ⚡ **Health Check & Auto Reconnect**: `/api/health` reports API and database connection status with fallback DNS handling for MongoDB Atlas.
- 📱 **Fully Responsive**: Mobile-friendly sidebar and clean modern interface.

---

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, Lucide Icons, Recharts, Vanilla CSS
- **Backend**: Node.js, Express, Mongoose, CORS, Dotenv
- **Database**: MongoDB Atlas (Cloud) or MongoDB Compass (Local: `mongodb://127.0.0.1:27017`)
- **CI/CD Workflow**: GitHub Actions (.github/workflows/ci.yml)

---

## 📂 Project Structure
```text
expense-tracker-dashboard/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI workflow
├── backend/
│   ├── models/
│   │   └── Transaction.js       # Mongoose Schema
│   ├── .env.example             # Example environment variables
│   ├── package.json             # Express dependencies and scripts
│   ├── server.js                # Express REST API & MongoDB connection
│   └── test.js                  # In-memory test runner for health endpoint
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Main React dashboard component
│   │   ├── main.jsx             # React DOM entry
│   │   └── styles.css           # Styling
│   ├── index.html               # Vite HTML template
│   ├── package.json             # React dependencies and scripts
│   ├── vercel.json              # Vercel deployment configuration
│   └── vite.config.js           # Vite configuration with React plugin
├── .gitignore                   # Root gitignore (excludes node_modules & .env)
├── package.json                 # Root script runner
└── README.md                    # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB Atlas account OR MongoDB installed locally

### 1. Database Configuration

#### Option A: MongoDB Atlas (Recommended for Cloud / Production)
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. Under **Security → Database Access**, create or edit a database user (e.g. `darasindhu71_db_user`) and set a strong password. Ensure Built-in Role is set to `Read and write to any database`.
3. Under **Security → Network Access**, add IP address `0.0.0.0/0` (Allow Access from Anywhere).
4. Under **Database → Clusters**, click **Connect** → **Drivers** (Node.js) and copy the connection string.
5. Create or edit `backend/.env`:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://darasindhu71_db_user:<YOUR_PASSWORD>@expensetracker.rgrdfob.mongodb.net/expense_tracker?retryWrites=true&w=majority
   CLIENT_URL=http://localhost:5173
   ```
   *(Replace `<YOUR_PASSWORD>` with your actual database user password without `<>` angle brackets. If your password contains special characters, URL-encode them.)*

#### Option B: MongoDB Compass / Local MongoDB
In `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/expense_tracker
CLIENT_URL=http://localhost:5173
```

---

### 2. Frontend Configuration
In `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

---

### 3. Running the Application

You can run both or individual components using npm:

#### Run using root scripts:
```bash
# Install dependencies for both backend and frontend
npm run install:all

# Run backend development server
npm run backend:dev

# In a second terminal, run frontend development server
npm run frontend:dev
```

#### Run manually:
```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

Visit the frontend at [http://localhost:5173](http://localhost:5173).

---

## 🧪 Testing & CI/CD
- **Backend test**: `npm run backend:test` or `npm test`
- **Frontend build test**: `npm run frontend:build` or `npm run build`
- **GitHub Actions**: Automated CI runs on every push and pull request to test the backend API and build the Vite frontend.

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Health status of API and database |
| `GET` | `/api/transactions` | Retrieve all transactions (supports `?type=`, `?category=`, `?search=`) |
| `POST` | `/api/transactions` | Create a new transaction |
| `PUT` | `/api/transactions/:id` | Update an existing transaction |
| `DELETE` | `/api/transactions/:id` | Delete a transaction |

---

## 🚢 Deployment

### Frontend (Vercel)
1. Push your code to GitHub.
2. Import your repository into [Vercel](https://vercel.com/).
3. Set the Root Directory to `frontend`.
4. Add the Environment Variable:
   - `VITE_API_URL`: URL of your deployed backend (e.g. `https://your-backend.onrender.com/api`)
5. Deploy.

### Backend (Render / Railway)
1. Import repository into [Render](https://render.com/).
2. Set Root Directory to `backend`.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add Environment Variables:
   - `MONGO_URI`: Your MongoDB Atlas connection string
   - `PORT`: 5000
   - `CLIENT_URL`: Your Vercel frontend URL
