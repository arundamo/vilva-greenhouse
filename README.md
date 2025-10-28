# Vilva Greenhouse Management

A simple monorepo with a Node/Express API and a Vite + React client.

## Prerequisites
- Node.js 18+ (includes npm)
- Windows: ensure Node and npm are on your PATH. Verify with `node -v` and `npm -v`.

## Install
```powershell
# from repo root
npm run install-all
```

## Run (dev)
```powershell
# runs API (port 5000) and Vite client (port 5173)
npm run dev
```
- API: http://localhost:5000/api/health
- Client: http://localhost:5173

### Database migrations (existing DB only)
If you already have a `server/vilva-farm.db` from earlier runs, run migrations once to enable multi-item orders:

```powershell
npm run migrate
```
This creates `order_items` and converts `sales_orders` to an order header table.

## Environment
Copy `.env.example` to `.env` and adjust as needed.

```
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
```

## Notes
- File uploads will be served from `/uploads` path; directory `server/uploads` is created but empty.
- Tailwind is configured. Use `className` utilities in components.

## Version 1 (2025-10-28)
Core features:
- Greenhouses G1–G3 with 20 raised beds each (L1–L10, R1–R10)
- Spinach-only varieties with variety manager
- Crops lifecycle: sow → multiple harvests → sold
- Multi-harvest tracking with units (bunches, grams, kg, pieces)
- Sales orders with multiple items per order and payment tracking
- Customers: add/edit inline in order flow
- Dashboard with crop performance and customer purchase reports (with grand totals)
- Activities log with filtering
- Crops page search by variety name

