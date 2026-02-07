# Run2Rank - Fitness Tracking & Territory Competition Platform

Track your runs, claim your territory, and compete on local leaderboards.

## Project Structure

```
run2rank/
├── client/          # Frontend React application
├── server/          # Backend Node.js API (optional local development)
└── database/        # Supabase configuration and migrations
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- VS Code 
- A Supabase account (for database)

### 1. Frontend Setup

```bash
cd client
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
npm run dev
```

Frontend will be available at http://localhost:8080

### 2. Database Setup

1. Create a new project at https://supabase.com
2. Go to **SQL Editor** in your Supabase dashboard
3. Run all migration files from `database/supabase/migrations/` in order
4. Update `client/.env` with your Supabase credentials:
   - `VITE_SUPABASE_URL`
   - `VITE_SUP ABASE_PUBLISHABLE_KEY`

### 3. Server Setup (Optional - Local Development Only)

The Node.js backend in `/server` is optional and was created for local development. With Supabase, you don't need it.

If you want to run it locally:

```bash
cd server
npm install
cp .env.example .env
# Edit .env
npm start
```

## Features

- 🏃 **GPS Run Tracking** - Record your runs with real-time GPS tracking
- 🗺️ **Territory System** - Claim territories based on your runs
- 🏆 **Leaderboards** - Compete with runners in your pincode area
- 📊 **Health Tracking** - Monitor your fitness metrics (BMI, BMR, goals)
- 👥 **User Presence** - See nearby runners in real-time
- 📱 **Responsive Design** - Works on mobile, tablet, and desktop

## Tech Stack

### Frontend (`/client`)

- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Router for navigation
- Supabase JS Client for database
- React Query for data fetching

### Backend (`/server` - Optional)

- Node.js with Express.js
- SQLite database
- JWT authentication
- RESTful API

### Database (`/database`)

- Supabase (PostgreSQL)
- Row Level Security (RLS) enabled
- Real-time subscriptions
- Auto-triggers for calculations

## Environment Variables

### Client (.env)

```env
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### Server (.env) - If using local backend

```env
PORT=3001
DATABASE_PATH=./db/run2rank.db
JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d
FRONTEND_URL=http://localhost:8080
```

## Development

### Running the Frontend

```bash
cd client
npm run dev
```

### Building for Production

```bash
cd client
npm run build
npm run preview  # Preview production build
```

### Database Migrations

Migrations are located in `database/supabase/migrations/`. Apply them in order through the Supabase SQL Editor.

## License

MIT

## Support

For issues or questions, please open an issue on the repository.

---

**Run2Rank** - Claim your territory. Run to the top.
