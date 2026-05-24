# QRDine Restaurant OS

QRDine is a mobile-first QR-based restaurant management system built for dine-in service. Customers scan a table QR code, order without logging in, track status updates live, and pay with cash or M-Pesa. Staff work from role-based dashboards for kitchen, waiter, cashier, and admin operations.

## Stack

- Frontend: React, Vite, Tailwind CSS, React Router, Axios, Zustand, native WebSocket
- Backend: Go, Chi, SQLite, Goose, sqlc, JWT, Gorilla WebSocket

## Default staff accounts

- `admin@qrdine.local`
- `chef@qrdine.local`
- `waiter@qrdine.local`
- `cashier@qrdine.local`
- Password for all: `Password123`

## Local setup

1. Backend
   - `cd /home/ibra/workspace/backend`
   - `cp .env.example .env` if you want custom values
   - `go run ./cmd/api`
2. Frontend
   - `cd /home/ibra/workspace/restaurant/frontend`
   - `cp .env.example .env` if you want custom API endpoints
   - `npm install`
   - `npm run dev`
3. Open `http://localhost:5173`

## Production build checks

- Frontend: `npm run build`
- Backend: `go test ./...`

## QR flow

1. Admin creates a table in the dashboard.
2. Backend stores a stable table slug and QR metadata.
3. Frontend generates and persists the QR image back to `/api/tables/:id/qrcode`.
4. The QR opens `https://your-frontend/order/table-7`.
5. Backend resolves that table, creates or resumes a session, and returns context to the customer app.

## Role dashboards

- Admin: overview, menu, tables, staff, and full operational visibility
- Chef: active prep queue and status actions
- Waiter: ready-to-serve queue and table snapshot
- Cashier: open bills, payment confirmation, and receipt printing

## Payments

- Cash: customer can request cash settlement, cashier marks the order paid
- M-Pesa: backend creates a pending or auto-approved payment depending on `MPESA_AUTO_APPROVE`
- Receipts: once a payment settles, a receipt record is created and exposed to the dashboard

## Docker

From `/home/ibra/workspace/restaurant/frontend`:

- `docker compose up --build`

This starts:

- Backend on `http://localhost:8080`
- Frontend on `http://localhost:4173`

## Key routes

- Customer order page: `/order/:tableSlug`
- Staff login: `/app/login`
- Admin dashboard: `/app/admin`
- Chef dashboard: `/app/chef`
- Waiter dashboard: `/app/waiter`
- Cashier dashboard: `/app/cashier`

## API highlights

- `POST /api/auth/login`
- `GET /api/public/tables/:identifier`
- `POST /api/public/orders`
- `POST /api/public/orders/:id/payments/mpesa`
- `GET /api/orders`
- `PATCH /api/orders/:id/status`
- `POST /api/payments/cash`
- `GET /api/tables/:id/qrcode`

## Notes

- The backend runs Goose migrations automatically on startup.
- sqlc query definitions live in `/home/ibra/workspace/backend/db/queries`.
- In development, `MPESA_AUTO_APPROVE=true` makes the full customer payment flow testable without a live callback.
