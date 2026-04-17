# Athira — Personalized Tutoring Platform

EdTech marketplace connecting students with world-class mentors for real-time, one-on-one learning.

## Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **Supabase project** — Create one at [supabase.com](https://supabase.com)

## Quick Start

### 1. Database Setup (Supabase)

1. Go to your Supabase dashboard → **SQL Editor** → **New Query**
2. Paste the contents of `backend/migration.sql` and run it
3. From **Project Settings** → **API**, copy your `URL` and `service_role` key

### 2. Backend

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your Supabase URL, service-role key, and a JWT secret

# Seed demo accounts
python seed.py

# Start the API server
uvicorn app.main:app --reload
```

The API runs at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The app runs at `http://localhost:5173`. It proxies `/api` requests to the backend.

## Demo Accounts

| Role    | Email                        | Password   |
|---------|------------------------------|------------|
| Student | alice@student.athira.io      | student123 |
| Student | bob@student.athira.io        | student123 |
| Tutor   | dr.smith@tutor.athira.io     | tutor123   |
| Tutor   | prof.jones@tutor.athira.io   | tutor123   |

## API Endpoints

| Method | Path               | Description                     | Auth |
|--------|--------------------|---------------------------------|------|
| POST   | /auth/login        | Login, returns JWT              | No   |
| GET    | /users/me          | Current user profile            | Yes  |
| GET    | /users/tutors      | List all tutors                 | Yes  |
| POST   | /sessions          | Student creates session request | Yes  |
| GET    | /sessions          | List user's sessions            | Yes  |
| PATCH  | /sessions/{id}     | Tutor accepts/rejects session   | Yes  |
| GET    | /health            | Health check                    | No   |
