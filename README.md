# ProjectTrack — Dhatri Constructions Dashboard

Enterprise-grade Construction Project Management & Finance Dashboard for **Dhatri Constructions, Hyderabad**.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS 3, Recharts, Lucide Icons |
| **Backend** | Python, Flask, SQLite |
| **Deployment** | Vercel Serverless |

## 📂 Project Structure

```
ProjectTrack/
├── src/                          # React SPA Frontend Source
│   ├── components/               # UI View Components
│   │   ├── AnalyticsView.jsx     # P&L Tables, Charts, PDF compiler
│   │   ├── DashboardView.jsx     # KPI Widgets, Filters, Project Grid
│   │   ├── HomeView.jsx          # Welcome Landing Page
│   │   └── ProjectWorkspaceView.jsx  # Deep-Dive Timeline, Invoices, Expenses
│   ├── App.jsx                   # Root SPA: Routing, State, Sidebar
│   ├── index.css                 # Tailwind imports & glassmorphic styles
│   └── main.jsx                  # React DOM mount
├── app.py                        # Flask Backend API + SQLite Database
├── package.json                  # Node dependencies
├── requirements.txt              # Python dependencies
├── vite.config.js                # Vite bundler config (dev proxy)
├── tailwind.config.js            # Tailwind custom theme
├── postcss.config.js             # PostCSS setup
├── vercel.json                   # Vercel deployment routing
└── index.html                    # HTML entry point
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)
- **pip** (Python package manager)

### 1. Install Frontend Dependencies
```bash
npm install
```

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. Start the Backend (Flask API)
```bash
python app.py
```
This starts the Flask server on **http://localhost:5050** and auto-creates the SQLite database with Hyderabad construction seed data.

### 4. Start the Frontend (Vite Dev Server)
In a separate terminal:
```bash
npm run dev
```
This starts the Vite dev server on **http://localhost:5173** with API proxy to Flask.

### 5. Production Build
```bash
npm run build
```
Then run `python app.py` — Flask will serve the compiled `dist/` folder.

## 🌐 Deploy to Vercel
```bash
npx vercel deploy --prod --yes
```

## 🔑 Features
- **Role Switcher**: Toggle between Admin (full access) and Site Manager (limited view)
- **4 Views**: Home, Dashboard, Project Workspace, Financial Analytics
- **CRUD**: Create, Edit, Delete projects
- **Milestones**: Add/toggle/delete chronological milestones
- **Progress Notes**: Timestamped timeline feed with add/delete
- **Payments**: Record and track invoice payments
- **Expenses**: Log operational expenditures with pie chart breakdown
- **P&L Engine**: Profit & Loss matrix with revenue/expense analytics
- **Charts**: Monthly revenue area chart, outstanding dues bar chart
- **PDF/CSV Export**: Mock PDF compilation and real CSV export
- **Profile Editor**: Upload avatar, edit name/location (localStorage)
- **Mobile Responsive**: Collapsible sidebar, 375px+ viewport support

## 💰 Currency
All financial displays use **Indian Rupee (₹)** formatting with lakh/crore grouping.
