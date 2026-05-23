# QRDine

QRDine is a restaurant management system with table QR ordering, image-rich menu cards, kitchen live tracking, staff operations, payments, inventory alerts, reports, and JWT authentication.

## Stack

- Frontend: React JS, Vite, Tailwind CSS, shadcn-style reusable primitives
- Backend: Go, Chi router, JWT, WebSockets
- Database: SQLite, goose migrations, sqlc query definitions
- Architecture: modular layout with repository and service layers

## Quick Start

Backend:

```bash
cd backend
go mod tidy
go run ./cmd/api
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Open:

- Staff dashboard: `http://localhost:5173`
- QR customer order demo: `http://localhost:5173/order/table-1-demo`
- API health: `http://localhost:8080/health`

If Vite says `Port 5173 is in use` and starts on `5174`, open the `5174` URL it prints. QRDine's development CORS defaults already allow both ports.

Default staff login:

```text
email: admin@qrdine.local
password: Password123
```

Workflow guide:

- See `WORKFLOW.md` for login steps, admin setup, what the customer scans, and the full scan-to-payment flow.

Docker:

```bash
docker compose up --build
```

## Structure

```text
backend/
  cmd/api/                  API entrypoint
  db/migrations/            goose migrations
  db/queries/                sqlc query files
  internal/auth/             JWT and password hashing
  internal/config/           env configuration
  internal/database/         SQLite connection
  internal/domain/           domain models
  internal/realtime/         WebSocket hub
  internal/repository/       SQLite repository
  internal/service/          business rules
  internal/transport/http/   Chi routes and middleware
  docs/openapi.yaml          Swagger/OpenAPI starter
frontend/
  src/main.jsx               React app
  src/styles.css             Tailwind entry
```

## API Highlights

- `POST /api/auth/login`
- `GET /api/public/menu`
- `GET /api/public/tables/{token}`
- `POST /api/public/orders`
- `GET /api/menu`
- `POST /api/menu/categories`
- `POST /api/menu/items`
- `PATCH /api/menu/items/{id}`
- `GET /api/orders`
- `PATCH /api/orders/{id}/status`
- `POST /api/payments`
- `GET /api/tables`
- `GET /api/reports/summary`
- `GET /ws`

Swagger/OpenAPI starter lives at `backend/docs/openapi.yaml`.

## sqlc and goose

Migrations are under `backend/db/migrations`.

Run migrations automatically by starting the API, or manually:

```bash
cd backend
goose -dir db/migrations sqlite3 restaurant.db up
```

Generate sqlc code after installing sqlc:

```bash
cd backend
sqlc generate
```

The runtime repository is included so the app works before generated code is committed.

## M-Pesa

The M-Pesa path is intentionally a placeholder service boundary. Add Daraja credentials in `.env` and replace the pending payment branch in `internal/service/service.go` with STK push initiation and callback verification.

## QR Links On Phones

If customers will scan QR codes using another device on the same network, set `FRONTEND_BASE_URL` in the backend environment to your LAN URL, for example:

```bash
FRONTEND_BASE_URL=http://192.168.1.50:5173
```

That makes every generated table QR point to a phone-reachable customer ordering page instead of `localhost`.
