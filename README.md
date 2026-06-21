# SmartBudget - Personal Finance & Expense Tracker

A modern full-stack budget tracking dashboard with React, Express, and MongoDB Atlas.

## Features

- JWT authentication (register/login)
- Dashboard with stats, charts, smart insights, drag-and-drop widgets
- Income & Expense CRUD with custom categories
- Budget targets with 80%/100% alerts
- Savings goals with circular progress
- Reports with PDF/Excel/CSV export
- Transactions page with filters and search
- Dark/Light mode, glassmorphism UI, Framer Motion animations
- Data export/import/backup

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Recharts, Framer Motion, Axios
- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT
- **Database:** MongoDB Atlas

## Quick Start

### 1. Backend

```bash
cd server
npm install
npm run seed    # optional: creates demo user with sample data
npm run dev
```

Server runs at `http://localhost:5000`

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

App runs at `http://localhost:5173`

### Demo Account

After running seed:
- **Email:** demo@smartbudget.app
- **Password:** demo123

## Environment Variables

Copy `server/.env.example` to `server/.env` and set:

```
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key
PORT=5000
CLIENT_URL=http://localhost:5173
```

> **Note:** If your MongoDB password contains special characters like `@`, URL-encode them (e.g. `@` → `%40`).

## Project Structure

```
├── client/          # React frontend
│   └── src/
│       ├── pages/   # Dashboard, Income, Expenses, etc.
│       ├── components/
│       ├── context/
│       ├── services/
│       └── utils/
└── server/          # Express API
    ├── models/
    ├── routes/
    └── middleware/
```

## API Endpoints

| Route | Description |
|-------|-------------|
| `/api/auth` | Register, login, profile |
| `/api/income` | Income CRUD |
| `/api/expenses` | Expense CRUD |
| `/api/budgets` | Budget targets |
| `/api/goals` | Savings goals |
| `/api/transactions` | All transactions |
| `/api/dashboard` | Summary, charts, insights |
| `/api/notifications` | Alerts |
| `/api/data` | Export/import |

## Security

- Never commit `.env` files with real credentials
- Rotate your MongoDB password if it was shared publicly
- Change `JWT_SECRET` before production deployment
