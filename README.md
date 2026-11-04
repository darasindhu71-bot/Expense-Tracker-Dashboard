# Expense Tracker Dashboard

A full-stack expense tracker with a React + Vite frontend, Express API, and MongoDB (Mongoose).

## Features
- Dashboard cards: balance, income, expenses, savings rate
- Add, edit, and delete transactions
- Search and filter by type/category
- Monthly income vs expense chart and category breakdown
- Recent transactions table
- Responsive sidebar and mobile layout
- API health endpoint and MongoDB connection status

## Requirements
- Node.js 18+
- MongoDB running locally OR a MongoDB Atlas connection string

## 1. Configure MongoDB
Open `backend/.env` and set `MONGO_URI`.

For local MongoDB:
```env
MONGO_URI=mongodb://127.0.0.1:27017/expense_tracker
PORT=5000
```

For MongoDB Atlas, paste your Atlas connection string instead. Ensure your IP is allowed in Atlas Network Access.

## 2. Start backend
Open a terminal in this project:
```bash
cd backend
npm install
npm run dev
```
Expected message:
`MongoDB connected` and `API server running on http://localhost:5000`

Check in browser:
- http://localhost:5000/api/health

It should return JSON with `success: true`. `database: "connected"` confirms MongoDB is connected.

## 3. Start frontend
Open a SECOND terminal:
```bash
cd frontend
npm install
npm run dev
```
Open the URL Vite prints, usually:
http://localhost:5173

## Notes
- Keep both terminals running.
- The frontend calls the backend at `http://localhost:5000`.
- If you change the backend port, update `frontend/.env`.
- If MongoDB is not running locally, start the MongoDB service or use Atlas.
