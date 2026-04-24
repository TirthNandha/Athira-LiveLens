# Athira — LiveLens: AI-Powered Collaborative Tutoring Platform

An EdTech platform that transforms standard video tutoring into an intelligent, collaborative learning workspace. Built for the Athira hackathon challenge — bridging the gap between a generic video call and a specialized learning environment.

> **Live the session, don't just watch it.** Athira LiveLens turns the live 60 minutes of tutoring into a high-signal, collaborative workspace where learning is amplified through real-time code collaboration, AI-driven concept extraction, and intelligent session recaps.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Demo Accounts](#demo-accounts)
- [API Reference](#api-reference)
- [WebSocket Event Schema](#websocket-event-schema)
- [Project Structure](#project-structure)
- [Synchronization Strategy](#synchronization-strategy)

---

## Features

### Phase 1 — The Foundation

- **JWT Authentication** — Secure email/password login with token-based auth and auto-logout on expiry.
- **Role-Based Dashboards** — Separate student and tutor portals with session management (pending, upcoming, past).
- **Session Scheduling** — Students browse available tutors, request sessions with subject, date/time, duration, and notes. Tutors accept or reject.
- **Protected Routes** — Role-aware route guards ensuring students and tutors only access their respective views.

### Phase 2 — The Innovation Workspace (Session Room)

The session room is a **three-pane collaborative workspace** designed to maximize the learning signal during a live session:

#### The Logic Mirror — Real-Time Collaborative Code Editor
- **Monaco Editor + Yjs CRDT** — Both tutor and student edit the same code buffer simultaneously with conflict-free real-time synchronization.
- **In-Browser Python Execution** — Code runs client-side via **Pyodide** (WebAssembly Python) in a Web Worker — no server-side sandbox needed.
- **Shared Output** — When either participant runs code, the output (stdout/stderr) is broadcast to both parties instantly.

#### AI-Powered Learning Features (The Cognitive Anchor)
- **Live Concept Extraction** — Speech-to-text captures the session transcript in real-time (via Web Speech API), and every 30-second chunk is sent to the AI to extract key concepts automatically.
- **Concept Cards** — Extracted concepts appear as interactive cards in the AI sidebar, each showing a title, plain-English explanation, and an importance rating (high/medium/low) with color-coded badges. Students can **pin** important concepts to keep them at the top for quick reference during the session.
- **"Wait, What?" Confusion Radar** — When a student is confused, one click sends the recent transcript context to the AI, which returns a simplified re-explanation, a real-world analogy, and a suggested follow-up question. The request is also broadcast to the tutor's chat as an AI Assistant message so the tutor is aware. Tutors see a dedicated alert area when their student triggers confusion.
- **Post-Session Recap** — A comprehensive AI-generated summary modal including a session overview, key concepts with explanations, areas of difficulty, and practice questions for self-study.

#### Transcript & Notes
- **Dual-Mode Transcript Panel** — Supports two input modes: **Mic mode** (live speech-to-text via Web Speech API with a recording indicator) and **Notes mode** (manual text input for typing what's being discussed). Both feed into the AI for concept extraction and recaps.
- **30-Second Chunking** — Transcript is automatically chunked every 30 seconds and sent to the AI for continuous concept extraction throughout the session.

#### Video & Chat
- **Peer-to-Peer Video/Audio** — WebRTC via PeerJS with deterministic peer IDs per session role. Auto-connects when both participants join, with a manual "Connect Video" fallback button.
- **Real-Time Chat** — WebSocket-powered text chat with system messages for join/leave events and AI Assistant messages from the confusion radar.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (Vite + React)            │
│                                                         │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐ │
│  │ Video    │  │ Code Editor  │  │   AI Sidebar      │ │
│  │ (PeerJS) │  │ (Monaco+Yjs) │  │ (Concepts/Recap)  │ │
│  ├──────────┤  ├──────────────┤  ├───────────────────┤ │
│  │ Chat     │  │ Output Panel │  │ Speech → Text     │ │
│  │ Panel    │  │ (Pyodide)    │  │ (Web Speech API)  │ │
│  └────┬─────┘  └──────┬───────┘  └────────┬──────────┘ │
│       │               │                    │            │
│       └───────────────┼────────────────────┘            │
│                       │ WebSocket + REST                │
└───────────────────────┼─────────────────────────────────┘
                        │
            ┌───────────┴───────────┐
            │  Backend (FastAPI)    │
            │                       │
            │  /auth   → JWT        │
            │  /sessions → CRUD     │
            │  /ws/session/:id      │
            │    → Room relay       │
            │  /ai/*   → LLM calls │
            └───────────┬───────────┘
                        │
          ┌─────────────┼─────────────┐
          │             │             │
    ┌─────┴─────┐ ┌────┴────┐ ┌─────┴──────┐
    │ Supabase  │ │PeerJS   │ │ OpenRouter │
    │ (Postgres)│ │ Cloud   │ │ (LLaMA 4)  │
    └───────────┘ └─────────┘ └────────────┘
```

**Synchronization Strategy:**
- **Code collaboration** uses **Yjs CRDT** (Conflict-free Replicated Data Type) synced over WebSocket. Each keystroke generates a Yjs update encoded as base64 and broadcast to peers. On join, the full Yjs document state is synced to ensure consistency. This approach is conflict-free by design — no operational transforms or server-side merge logic needed.
- **Video/Audio** uses **PeerJS (WebRTC)** for direct peer-to-peer media streaming, minimizing latency.
- **WebSocket relay** on the backend is intentionally thin — it broadcasts messages between room participants without parsing or storing them. This keeps the server stateless for collaboration while enabling real-time communication.

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| Vite 5 | Build tool and dev server |
| Tailwind CSS 3 | Utility-first styling |
| Monaco Editor | Code editor (VS Code engine) |
| Yjs + y-monaco | CRDT-based real-time collaboration |
| PeerJS | WebRTC video/audio |
| Pyodide | In-browser Python execution (WebAssembly) |
| Web Speech API | Live speech-to-text transcription |
| Axios | HTTP client with JWT interceptors |
| React Router DOM 7 | Client-side routing |

### Backend
| Technology | Purpose |
|------------|---------|
| FastAPI | Python async web framework |
| Uvicorn | ASGI server |
| Supabase (PostgreSQL) | Database and authentication storage |
| python-jose | JWT token creation and verification |
| bcrypt | Password hashing |
| httpx | Async HTTP client for AI API calls |
| pydantic-settings | Environment configuration |
| OpenRouter API | LLM access (LLaMA 4 Maverick) |

---

## Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **Supabase project** — Create one free at [supabase.com](https://supabase.com)
- **OpenRouter API key** (optional, for AI features) — Get one at [openrouter.ai](https://openrouter.ai)

### 1. Database Setup

1. Go to your Supabase dashboard → **SQL Editor** → **New Query**
2. Paste the contents of `backend/migration.sql` and run it
3. From **Project Settings → API**, copy your **URL** and **service_role** key

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
# Edit .env with your Supabase credentials, JWT secret, and OpenRouter API key
```

Your `.env` should contain:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret-change-me
OPENROUTER_API_KEY=your-openrouter-api-key
```

```bash
# Seed demo accounts
python seed.py

# Start the API server
uvicorn app.main:app --reload
```

The API runs at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The app runs at `http://localhost:5173`. The Vite dev server proxies `/api` requests to the backend automatically.

---

## Demo Accounts

| Role    | Email                      | Password   |
|---------|----------------------------|------------|
| Student | alice@student.athira.io    | student123 |
| Student | bob@student.athira.io      | student123 |
| Tutor   | dr.smith@tutor.athira.io   | tutor123   |
| Tutor   | prof.jones@tutor.athira.io | tutor123   |

**Quick test flow:**
1. Log in as a **student**, request a session with a tutor
2. Log in as the **tutor** (in another browser/incognito), accept the session
3. Both click **Join Session** to enter the collaborative session room
4. Try collaborative coding, run Python code, use the AI features, and video chat

---

## API Reference

### Authentication
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | No | Login with email/password, returns JWT + user |

### Users
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/me` | Bearer JWT | Get current user profile |
| GET | `/users/tutors` | Bearer JWT | List all tutors |

### Sessions
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/sessions` | Bearer JWT | Student creates a session request |
| GET | `/sessions` | Bearer JWT | List current user's sessions |
| PATCH | `/sessions/{id}` | Bearer JWT | Tutor accepts or rejects a pending session |

### AI Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/ai/concepts` | Bearer JWT | Extract key concepts from a transcript chunk |
| POST | `/ai/wait-what` | Bearer JWT | Get simplified re-explanation for confused student |
| POST | `/ai/recap` | Bearer JWT | Generate post-session recap with summary and practice questions |

### System
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Health check |

### WebSocket
| Protocol | Path | Auth | Description |
|----------|------|------|-------------|
| WS | `/ws/session/{session_id}?token=JWT` | Query param | Real-time session communication |

---

## WebSocket Event Schema

All WebSocket messages follow the format: `{ "type": "<event_type>", "data": { ... } }`

### Server-Generated Events

| Type | Direction | Data | Description |
|------|-----------|------|-------------|
| `user:joined` | Server → All | `{ user_id, role, email }` | Participant entered the session room |
| `user:left` | Server → All | `{ user_id, role }` | Participant left the session room |

### Client Events (relayed to other participants)

| Type | Direction | Data | Description |
|------|-----------|------|-------------|
| `yjs:sync` | Client → Peers | `{ update }` (base64 Yjs update) | Incremental code editor change |
| `yjs:full-state` | Client → Peers | `{ state }` (base64 Yjs state) | Full document state for late joiners |
| `yjs:request-sync` | Client → Peers | `{}` | Request full state from peers on join |
| `chat:message` | Client → Peers | `{ text, sender }` | Chat message |
| `code:output` | Client → Peers | `{ stdout, stderr, error }` | Python execution result |
| `confusion:alert` | Client → Peers | `{ ... }` | Student confusion signal for AI sidebar |

> The backend acts as a **transparent relay** — it broadcasts all client messages to other participants in the same session room without inspecting or storing them. Only `user:joined` and `user:left` are server-generated.

---

## Project Structure

```
athira/
├── README.md
├── .gitignore
│
├── backend/
│   ├── requirements.txt          # Python dependencies
│   ├── .env.example              # Environment template
│   ├── migration.sql             # Supabase database schema
│   ├── seed.py                   # Demo account seeder
│   └── app/
│       ├── main.py               # FastAPI app, CORS, router wiring
│       ├── config.py             # Pydantic settings (env loading)
│       ├── database.py           # Supabase client initialization
│       ├── auth.py               # JWT creation, verification, password hashing
│       ├── models.py             # Pydantic request/response schemas
│       └── routers/
│           ├── users.py          # Auth + user endpoints
│           ├── sessions.py       # Session CRUD
│           ├── websocket.py      # WebSocket room manager + relay
│           └── ai.py             # AI endpoints (concepts, wait-what, recap)
│
└── frontend/
    ├── package.json
    ├── vite.config.js            # Dev proxy to backend
    ├── tailwind.config.js
    ├── index.html
    ├── public/
    │   └── pyodide-worker.js     # Web Worker for Pyodide Python execution
    └── src/
        ├── main.jsx              # React entry point
        ├── App.jsx               # Router + AuthProvider
        ├── index.css             # Tailwind base styles
        ├── api/
        │   └── axios.js          # HTTP client with JWT interceptors
        ├── context/
        │   └── AuthContext.jsx    # Auth state management
        ├── hooks/
        │   ├── useWebSocket.js   # Session WebSocket connection
        │   ├── usePeer.js        # PeerJS WebRTC video/audio
        │   └── useSpeechRecognition.js  # Web Speech API + chunk timer
        ├── components/
        │   ├── Navbar.jsx        # Top navigation bar
        │   ├── ProtectedRoute.jsx # Role-based route guard
        │   ├── SessionCard.jsx   # Session list card with actions
        │   └── session/
        │       ├── CodeEditor.jsx     # Monaco + Yjs collaborative editor
        │       ├── OutputPanel.jsx    # Python execution output display
        │       ├── VideoPanel.jsx     # Local/remote video streams
        │       ├── ChatPanel.jsx      # Real-time text chat
        │       ├── AISidebar.jsx      # AI features tabbed panel
        │       ├── TranscriptPanel.jsx # Speech transcript + notes
        │       ├── ConceptCards.jsx   # AI-extracted concept cards
        │       ├── WaitWhatPanel.jsx  # Confusion helper UI
        │       └── SessionRecap.jsx   # Post-session recap modal
        └── pages/
            ├── Login.jsx              # Login page
            ├── StudentDashboard.jsx   # Student portal
            ├── TutorDashboard.jsx     # Tutor portal
            ├── SessionRequest.jsx     # Session booking form
            └── SessionRoom.jsx        # Main session workspace
```

---

## Synchronization Strategy

### Why Yjs (CRDT) for Code Collaboration?

Traditional operational transform (OT) requires a central server to resolve conflicts and order operations. Yjs uses **Conflict-free Replicated Data Types (CRDTs)**, which guarantee convergence without a central authority. This means:

- **No server-side merge logic** — The backend just relays binary updates between peers.
- **Offline-resilient** — If a participant briefly disconnects, their local edits are preserved and merged seamlessly on reconnect.
- **Low latency** — Edits are applied locally first and synced asynchronously.

### Pedagogical Reasoning

The session room is designed around the principle that **active participation beats passive observation**:

1. **The Logic Mirror** (collaborative editor) ensures both tutor and student are co-creating, not just screen-sharing. The student can modify, experiment, and break the tutor's code in real-time — turning passive watching into active learning.

2. **In-browser execution** (Pyodide) removes the friction of environment setup. Both participants see identical output instantly, keeping the focus on concepts rather than tooling.

3. **AI Concept Extraction** creates a persistent, visual record of what was discussed. Instead of relying on memory, students get structured concept cards they can review.

4. **"Wait, What?"** lowers the social barrier of admitting confusion. A single click gets an alternative explanation without interrupting the tutor's flow.

5. **Post-Session Recap** provides spaced-repetition material (key concepts + practice questions), extending the learning beyond the live session.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SUPABASE_URL` | Yes | — | Supabase project URL |
| `SUPABASE_KEY` | Yes | — | Supabase service role key |
| `JWT_SECRET` | Yes | `athira-dev-secret-key-change-in-production` | Secret for JWT signing |
| `JWT_ALGORITHM` | No | `HS256` | JWT algorithm |
| `JWT_EXPIRE_MINUTES` | No | `480` (8 hours) | Token expiry |
| `OPENROUTER_API_KEY` | For AI features | `""` | OpenRouter API key for LLM access |
