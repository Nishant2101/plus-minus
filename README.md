# 🃏 Plus Minus — Real-time Multiplayer Card Game

A production-ready, server-authoritative multiplayer card game built with **React + TypeScript + Vite** on the frontend and **Node.js + Express + Socket.IO** on the backend.

---

## 🚀 Quick Start (Local Development)

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| MongoDB | ≥ 6 |
| Redis | ≥ 7 |

### 1. Clone and install

```bash
git clone <repo>
cd "card game"

# Install all workspace dependencies
npm install
cd shared && npm install && cd ..
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your values (defaults work for local dev)
```

### 3. Start MongoDB and Redis

```bash
# macOS with Homebrew:
brew services start mongodb-community
brew services start redis

# Or with Docker:
docker run -d -p 27017:27017 mongo:latest
docker run -d -p 6379:6379 redis:latest
```

### 4. Run the game

```bash
# From the project root — starts backend + frontend concurrently
cd backend && npm run dev &
cd frontend && npm run dev
```

Open:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api/health

---

## 📁 Project Structure

```
card game/
│
├── shared/                     # Shared TypeScript types & interfaces
│   └── src/
│       └── types.ts            # All game types, socket events, payloads
│
├── backend/
│   └── src/
│       ├── games/
│       │   ├── core/
│       │   │   ├── Deck.ts         # Deck building & shuffling
│       │   │   ├── CardRanking.ts  # Card strength & trick winner
│       │   │   ├── CardValidator.ts # getLegalCards() rules engine
│       │   │   ├── PowerColor.ts   # Power Color eligibility
│       │   │   └── ScoreCalculator.ts # Round scoring logic
│       │   └── plus-minus/
│       │       └── PlusMinusEngine.ts # Main game state machine
│       ├── socket/
│       │   └── gameHandlers.ts    # All Socket.IO event handlers
│       ├── services/
│       │   ├── AuthService.ts     # JWT + bcrypt auth
│       │   └── RoomService.ts     # Room management + serialization
│       ├── models/
│       │   ├── User.ts            # MongoDB User schema
│       │   └── GameHistory.ts     # MongoDB game history schema
│       ├── routes/
│       │   ├── auth.ts            # POST /api/auth/*
│       │   └── games.ts           # GET /api/games/*
│       ├── config/
│       │   ├── index.ts           # Environment config
│       │   ├── database.ts        # MongoDB connection
│       │   ├── redis.ts           # Redis connection
│       │   └── logger.ts          # Winston logger
│       └── __tests__/            # Jest test suite (50 tests)
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── HomePage.tsx       # Landing page
        │   ├── RoomPage.tsx       # Lobby (create/join)
        │   └── GamePage.tsx       # Game with all phases
        ├── components/
        │   ├── ui/
        │   │   ├── PlayingCard.tsx    # Card component
        │   │   ├── PlayerHand.tsx     # Fan card hand
        │   │   ├── Scoreboard.tsx     # Live scoreboard
        │   │   ├── GameLog.tsx        # Activity log
        │   │   └── NotificationToast.tsx
        │   ├── game/
        │   │   ├── GameTable.tsx       # 4-player table layout
        │   │   ├── PowerDeclaration.tsx # Power Color phase UI
        │   │   └── PointDeclaration.tsx # Bid phase UI
        │   ├── lobby/
        │   │   └── Lobby.tsx          # Room lobby
        │   └── auth/
        │       └── AuthForm.tsx       # Login/register/guest
        ├── hooks/
        │   └── useSocket.ts           # Socket.IO event wiring
        ├── services/
        │   └── socket.ts              # Socket service class
        ├── store/
        │   ├── gameStore.ts           # Zustand game state
        │   └── authStore.ts           # Zustand auth (persisted)
        └── utils/
            └── cardUtils.ts           # Card display utilities
```

---

## 🎮 How to Play Plus Minus

### Game Overview
Plus Minus is a 4-player trick-taking card game played with a standard 52-card deck.

### Phases

| Phase | Description |
|-------|-------------|
| **Waiting** | Players join the lobby, host configures settings |
| **Power Declaration** | After receiving 5 cards, players declare a Power Color (trump suit) |
| **Deal Remaining** | Each player receives 8 more cards (13 total) |
| **Point Declaration** | Players bid how many tricks they'll win |
| **Playing** | 13 tricks played one card at a time |
| **Round Complete** | Scores calculated; new round begins |
| **Game Complete** | First player to reach target score wins |

### Power Color Rules
- A player can declare a Power Color if they have **at least 1 card of that suit** AND the **total point value ≥ 4**
- **A=4pts, K=3pts, Q=2pts, J=1pt**, 10-2 = 0pts
- First valid declaration wins; server validates all declarations
- Default Power Color = **♠ SPADES** if nobody declares

### Card Play Rules
1. Player leading can play any card
2. Other players **must** follow the lead suit
3. If you have a lead-suit card that **beats** the current winner, you **must** play it
4. Power Color cards beat all non-Power Color cards

### Scoring
- **Success** (actual ≥ declared): +actual tricks won
- **Failure** (actual < declared): −declared amount

---

## 🔧 Running Tests

```bash
cd backend
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

**Test Coverage:**
- ✅ Deck: build, shuffle, validate (52 cards, no duplicates)
- ✅ Power Color: eligibility, point calculation, edge cases
- ✅ Card Validator: legal card rules, higher-card rule
- ✅ Game Engine: full round lifecycle, turns, scoring, reconnection
- ✅ Room management: 4 players, overflow, disconnect/reconnect

---

## 🔒 Security

- **Server authoritative**: all card play, turn, score, power declaration validated server-side
- **JWT authentication** with bcrypt password hashing
- **Rate limiting** on API routes
- **Input validation** with Zod on all socket events
- Players never receive other players' private hands
- Room authorization — can't join in-progress game or over-full room

---

## 🌐 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Backend port |
| `MONGODB_URI` | `mongodb://localhost:27017/plus-minus` | MongoDB connection |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection |
| `JWT_SECRET` | — | **Change in production!** |
| `CLIENT_URL` | `http://localhost:5173` | Frontend URL (CORS) |
| `POWER_DECLARATION_TIMEOUT_MS` | `30000` | Power declaration timer |
| `POINT_DECLARATION_TIMEOUT_MS` | `60000` | Bid declaration timer |

---

## 🚢 Production Deployment

```bash
# Build everything
npm --workspace=shared run build
npm --workspace=backend run build
npm --workspace=frontend run build

# Start backend
cd backend && node dist/index.js

# Serve frontend (nginx / Vercel / Netlify)
# The frontend dist/ folder contains static files
```

**Environment checklist:**
- [ ] Set `JWT_SECRET` to a strong random string
- [ ] Set `MONGODB_URI` to your production MongoDB
- [ ] Set `REDIS_URL` to your production Redis
- [ ] Set `CLIENT_URL` to your production frontend domain
- [ ] Set `NODE_ENV=production`

---

## ⚠️ Rules Pending Confirmation

The following rules are isolated with `// TODO: Confirm with game owner` markers:

| Rule | Current Behaviour | Location |
|------|------------------|----------|
| Card point values | A=4, K=3, Q=2, J=1, rest=0 | `CardRanking.ts` |
| Power Color eligibility | Need ≥1 card + ≥4 points | `PowerColor.ts` |
| Multiple declarations | First valid wins | `PlusMinusEngine.ts` |
| Higher-card requirement | Must play higher if able | `CardValidator.ts` |
| Trick winner | Power > lead > off-suit | `CardRanking.ts` |
| Scoring formula | Success=+actual, Fail=−declared | `ScoreCalculator.ts` |
| Starting card | 2 of Clubs | `PlusMinusEngine.ts` |
| Game-ending rule | Any player reaches target after full round | `ScoreCalculator.ts` |

---

## 🏗️ Adding New Games

The architecture supports adding more games:

```
backend/src/games/
├── core/          # Reusable: Deck, CardRanking, CardValidator, ScoreCalculator
├── plus-minus/    # PlusMinusEngine
├── rummy/         # Future: RummyEngine
└── call-break/    # Future: CallBreakEngine
```

Each game engine needs:
1. Implement the game state machine
2. Register socket handlers in `gameHandlers.ts`
3. Add routing on the frontend
