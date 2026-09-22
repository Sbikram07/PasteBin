# inkbin — a Pastebin clone (MERN)

A minimal, fast pastebin app: React + Vite on the frontend, Node.js/Express +
MongoDB on the backend. Implements the full MVP feature set:

- Create a paste (with or without an account)
- Unique short URL per paste (`/p/:id`)
- View a paste with syntax highlighting (via `react-syntax-highlighter`)
- Copy/share URL button
- Delete a paste (owner, or anonymous creator via a one-time delete token)
- Optional expiration (10m / 1h / 1d / 7d / 30d / never) via a MongoDB TTL index
- Optional password protection (bcrypt-hashed, checked server-side)
- Optional "burn after reading" (deletes on first view)
- Raw text endpoint (`/api/pastes/:id/raw`)
- Paste statistics (views, size, created/expiry dates)
- User accounts (JWT auth, register/login)
- Dashboard listing a logged-in user's pastes, with delete

## Project structure

```
pastebin/
├── client/     React + Vite frontend (Tailwind CSS)
└── server/     Node.js/Express + MongoDB backend
```

See `client/src` and `server/src` for the component/route breakdown — it
matches the layout you sketched, with a couple of small additions
(`utils/generateId.js` for short IDs, `pages/Register.jsx`, `pages/NotFound.jsx`,
`components/ProtectedRoute.jsx`).

## Prerequisites

- Node.js 18+
- A MongoDB instance (local `mongod`, or a free Atlas cluster)

## 1. Backend setup

```bash
cd server
cp .env.example .env
# edit .env: set MONGO_URI and a real JWT_SECRET
npm install
npm run dev        # nodemon, http://localhost:5000
```

Health check: `GET http://localhost:5000/api/health` → `{ "status": "ok" }`

### API overview

| Method | Route                     | Auth      | Description                          |
|--------|---------------------------|-----------|---------------------------------------|
| POST   | `/api/auth/register`      | —         | Create an account                     |
| POST   | `/api/auth/login`         | —         | Log in, returns a JWT                 |
| GET    | `/api/auth/me`            | required  | Current user profile                  |
| POST   | `/api/pastes`             | optional  | Create a paste                        |
| GET    | `/api/pastes/:id`         | —         | Get paste metadata + content          |
| GET    | `/api/pastes/:id/raw`     | —         | Plain-text content                    |
| GET    | `/api/pastes/:id/stats`   | —         | Views, size, dates, flags             |
| DELETE | `/api/pastes/:id`         | see below | Delete a paste                        |
| GET    | `/api/pastes/mine`        | required  | Logged-in user's pastes (paginated)   |

Password-protected pastes: pass `?password=...` on GET/raw requests. If
omitted or wrong, the API returns `401 { protected: true }` instead of the
content, so the UI can prompt for a password without leaking the paste.

Anonymous paste deletion: `POST /api/pastes` returns a one-time `deleteToken`
for anonymous pastes. Send it back as the `x-delete-token` header on
`DELETE /api/pastes/:id`. The frontend stores this in `localStorage` for you.

## 2. Frontend setup

```bash
cd client
cp .env.example .env   # VITE_API_URL, defaults to /api via the Vite proxy
npm install
npm run dev             # http://localhost:5173
```

In dev, Vite proxies `/api/*` to `http://localhost:5000` (see
`vite.config.js`), so you generally don't need to change `.env` locally.

## 3. Production build

```bash
cd client && npm run build     # outputs client/dist
cd ../server && npm start      # serve the API (put dist behind your own
                                # static host / nginx / the Express app itself)
```

## Notes on design choices

- **Expiration** is implemented with a MongoDB TTL index (`expiresAt`,
  `expireAfterSeconds: 0`), so expired pastes are cleaned up automatically
  by MongoDB itself — no cron job needed.
- **Passwords** (both user accounts and paste passwords) are hashed with
  bcrypt; plaintext is never stored.
- **Rate limiting** is applied globally and more strictly on paste creation
  and auth routes to deter abuse.
- The UI ships a small **"amber terminal"** visual identity (dark ink
  background, amber accent, monospace type) to match the code-sharing
  subject matter — feel free to restyle via `client/tailwind.config.js` and
  `client/src/index.css`.

## Possible next steps

- Folder/collections for organizing pastes on the dashboard
- Public/unlisted/private visibility toggle
- Diff view between paste revisions
- Full-text search across a user's own pastes
- OAuth login (GitHub/Google)
