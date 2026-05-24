# MauzoHub Frontend

Mobile-first owner dashboard plus public QR ordering experience.

## Main routes

- `/app/login`
- `/app/dashboard`
- `/app/dashboard/orders`
- `/app/dashboard/products`
- `/app/dashboard/inventory`
- `/app/dashboard/qr`
- `/order/:tableSlug`

## Local dev

```bash
cd /home/ibra/workspace/restaurant/frontend
cp .env.example .env
npm install
npm run dev
```

Default owner login:

- `owner@mauzohub.local`
- `Password123`

Backend is expected at:

- `https://restaurantbackend-w0jj.onrender.com`

WebSocket endpoint:

- `ws://restaurantbackend-w0jj.onrender.com/ws`
