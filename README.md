# PantryPal AI – Smart Pantry & Food Waste Manager

An AI-powered smart grocery management, expiration tracking, and zero-waste recipe platform designed for modern households.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, React Router v7, Lucide Icons, Recharts
- **Backend:** Node.js, Express.js
- **Database & Auth:** Supabase PostgreSQL with Row Level Security (RLS)
- **AI Integrations:** Groq Llama 3.2 Vision (Grocery Scanner) & Groq Llama 3.3 70B (Smart Chef)
- **Email Dispatch:** Resend Transactional Email API

---

## 📁 Project Architecture & Folder Structure

```
PantryPalAi/
├── client/                     # Frontend (React 18 + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/         # Reusable UI Elements, Navbar, Sidebar
│   │   ├── context/            # AuthContext (Supabase Session Provider)
│   │   ├── pages/              # LandingPage, Dashboard, Pantry, Scanner, Recipes, Analytics, Settings
│   │   └── services/           # Supabase Client & Backend API Connector
│   ├── .env.example            # Client Environment Template
│   └── vite.config.js          # Vite configuration with /api proxy to port 5000
│
├── server/                     # Backend API Gateway (Node.js + Express)
│   ├── server.js               # Express Server & Health Check
│   ├── .env.example            # Server Environment Template (Groq & Resend keys)
│   └── package.json
│
├── run-dev.js                  # Cross-platform runner for Client + Server
├── package.json                # Root scripts
└── README.md
```

---

## 🚀 How to Run the Project Locally

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** (v9 or higher)

### 2. Quick Start (Run Both Client and Server)
From the project root directory (`PantryPalAi`):

```bash
npm run dev
```

This starts:
- 💻 **Frontend Web App:** [http://localhost:5173](http://localhost:5173)
- 🌿 **Backend API Server:** [http://localhost:5000](http://localhost:5000)
- 🔍 **Backend Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

### 3. Running Separately (Alternative)
You can also launch them in separate terminal windows:

**Frontend only:**
```bash
cd client
npm run dev
```

**Backend only:**
```bash
cd server
npm run dev
```
