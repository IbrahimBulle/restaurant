# QRDine Workflow Guide

## 1. Start the system

Backend:

```bash
cd backend
go run ./cmd/api
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Open:

- Staff/Admin app: `http://localhost:5173`
- Customer QR demo page: `http://localhost:5173/order/table-1-demo`
- API health check: `http://localhost:8080/health`

## 2. How to log in

Use the seeded admin account:

```text
email: admin@qrdine.local
password: Password123
```

If login fails:

- Make sure the backend is running on `http://localhost:8080`
- Make sure the frontend is running on `http://localhost:5173` or `http://localhost:5174`
- Check `http://localhost:8080/health`
- If customers will scan from another phone, set `FRONTEND_BASE_URL` in `backend/.env`

Example:

```bash
FRONTEND_BASE_URL=http://192.168.1.50:5173
```

## 3. What the admin does

After login, open the `Admin` tab.

### Create table QR codes

1. In `QR Studio`, enter the table number and seat count.
2. Click `Add table`.
3. QRDine creates a unique table token and a QR destination URL.
4. Use `Print card` on a single table or `Print all cards` for the whole restaurant.

Each printed card contains:

- The table number
- A scannable QR code
- The direct customer order URL for that table

### Add menu categories

1. In `Categories`, enter a category name like `Breakfast`, `Main Course`, or `Drinks`.
2. Set the display order.
3. Click `Add category`.

### Add food pictures and customer menu cards

1. In `Menu Studio`, choose the category.
2. Enter the dish name, description, and price.
3. Add a food image in either of these ways:
   - Paste an image URL
   - Click `Upload food image` and choose a file from your computer
4. Leave `Publish this dish to customers immediately` checked if you want it live.
5. Click `Create menu item`.

The right side shows the customer-facing card preview and the published item library.

### Edit or hide an item

- Click `Edit` to change the name, description, price, or photo
- Click `Hide` to remove it from the customer menu without deleting it
- Click `Publish` to make a hidden item visible again

## 4. What the customer scans

The customer scans the QR code printed for the table.

That QR opens this kind of URL:

```text
http://your-frontend-host:5173/order/table-xxxxxxx
```

What the QR means:

- It opens the customer ordering page
- It is tied to one exact restaurant table
- Orders from that screen are automatically attached to that table

## 5. What the customer sees

After scanning, the customer gets:

- A table-specific ordering page
- Visual menu cards with food photos
- Category filters
- Search
- Quantity controls
- Kitchen notes per item
- Live order status after checkout

Customer flow:

1. Scan table QR
2. Browse categories and dishes
3. Add dishes to the cart
4. Add special notes if needed
5. Enter a name for the order
6. Click `Send to kitchen`
7. Watch live status updates

## 6. What the staff sees

### Kitchen tab

Kitchen staff see:

- New incoming orders
- Table number
- Ordered items
- Kitchen notes

Kitchen actions:

- `Accept`
- `Cook`
- `Ready`

### Floor tab

Floor and cashier staff see:

- Table QR cards and links
- Open bills
- Payment actions

Cashier/floor action:

- Click `Mark as paid` when payment is collected

## 7. Full order journey

1. Admin creates menu cards and table QR codes
2. Admin prints or places the QR card on each table
3. Customer scans the table QR
4. Customer places the order from the phone
5. Kitchen receives the order instantly
6. Staff update the order status live
7. Floor team sees the bill
8. Staff mark the order as paid
9. Reports update in the Admin dashboard

## 8. Important configuration for real phone scanning

If a guest scans using a phone, `localhost` will not work on that phone.

Set the backend variable below to the real frontend address:

```bash
FRONTEND_BASE_URL=http://192.168.1.50:5173
```

Then restart the backend so generated QR links use the correct public/LAN address.
