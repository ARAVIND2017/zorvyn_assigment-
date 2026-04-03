# Finance Backend

A role-based finance dashboard API built with **Node.js + TypeScript + Express + SQLite**.

---

## Tech Stack

| Layer        | Choice              | Reason                                         |
|--------------|---------------------|------------------------------------------------|
| Runtime      | Node.js 18+         | Wide ecosystem, async I/O fits REST APIs well  |
| Language     | TypeScript          | Type safety catches schema/role bugs at compile time |
| Framework    | Express             | Minimal, composable, easy to reason about      |
| Database     | SQLite (better-sqlite3) | Zero-setup, synchronous driver, sufficient for this scope |
| Validation   | Zod                 | Single schema for runtime validation + TS types |
| Auth         | JWT (jsonwebtoken)  | Stateless, easy to test with curl              |
| Passwords    | bcryptjs            | Industry-standard password hashing            |

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Start development server (auto-restarts on file changes)
npm run dev

# 3. In a second terminal — seed the database with test users and records
npm run seed
```

The server starts on **http://localhost:3000**.  
The SQLite database file is created at `finance.db` in the project root on first run.

---

## Environment Variables

| Variable     | Default                          | Description                  |
|--------------|----------------------------------|------------------------------|
| `PORT`       | `3000`                           | HTTP port                    |
| `JWT_SECRET` | `dev-secret-change-in-production`| JWT signing secret (change in prod) |

---

## Role Permission Matrix

| Action                   | Viewer | Analyst | Admin |
|--------------------------|:------:|:-------:|:-----:|
| Login / register         | ✓      | ✓       | ✓     |
| View records             | ✓      | ✓       | ✓     |
| View dashboard summaries | ✓      | ✓       | ✓     |
| Create records           | ✗      | ✓       | ✓     |
| Update records           | ✗      | ✓       | ✓     |
| Delete records           | ✗      | ✗       | ✓     |
| Manage users             | ✗      | ✗       | ✓     |

---

## API Reference

### Auth

```
POST /auth/register
Body: { email, password, role? }
→ 201 { message, user: { id, email, role } }

POST /auth/login
Body: { email, password }
→ 200 { token, user: { id, email, role } }
```

All other endpoints require:
```
Authorization: Bearer <token>
```

---

### Records

```
GET    /records                  Get all records (all roles)
GET    /records/:id              Get one record (all roles)
POST   /records                  Create record (analyst, admin)
PATCH  /records/:id              Update record (analyst, admin)
DELETE /records/:id              Soft delete (admin only)
```

**Query params for GET /records:**
```
type      income | expense
category  string
from      YYYY-MM-DD
to        YYYY-MM-DD
page      integer (default 1)
limit     integer 1–100 (default 20)
```

**POST/PATCH body:**
```json
{
  "amount": 1500.00,
  "type": "income",
  "category": "Salary",
  "date": "2024-03-15",
  "notes": "Optional description"
}
```

---

### Dashboard

```
GET /dashboard/summary     → { total_income, total_expenses, net_balance, total_records }
GET /dashboard/categories  → [{ category, type, total, count }]
GET /dashboard/trends      → [{ month, income, expenses, net }]  (last 12 months)
GET /dashboard/activity    → [{ id, amount, type, category, date, created_by }]
```

---

### Users (admin only)

```
GET    /users         List all users
GET    /users/:id     Get user by ID
PATCH  /users/:id     Update role or active status
DELETE /users/:id     Delete user
```

**PATCH body:**
```json
{ "role": "analyst", "is_active": false }
```

---

## Quick Test with curl

```bash
# 1. Login as admin
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# 2. Get dashboard summary
curl http://localhost:3000/dashboard/summary \
  -H "Authorization: Bearer $TOKEN"

# 3. Create a record
curl -X POST http://localhost:3000/records \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":2500,"type":"income","category":"Freelance","date":"2024-04-01"}'

# 4. Test viewer is blocked from creating records
VIEWER=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"viewer@example.com","password":"viewer123"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

curl -X POST http://localhost:3000/records \
  -H "Authorization: Bearer $VIEWER" \
  -H "Content-Type: application/json" \
  -d '{"amount":100,"type":"expense","category":"Test","date":"2024-04-01"}'
# → 403 Forbidden
```

---

## Project Structure

```
src/
  index.ts              Entry point, Express setup, route mounting
  models/
    db.ts               SQLite connection, schema creation
  middleware/
    auth.ts             JWT verification + role guard
    errorHandler.ts     Central error handler (Zod, AppError, unknown)
  services/
    authService.ts      Register, login, token generation
    userService.ts      User CRUD
    recordService.ts    Financial record CRUD + filtering
    dashboardService.ts Aggregation queries
  routes/
    auth.ts             POST /auth/*
    users.ts            /users (admin only)
    records.ts          /records (role-restricted)
    dashboard.ts        /dashboard (read-only, all roles)
  validations/
    index.ts            Zod schemas for all inputs
  types/
    index.ts            Shared TypeScript types + Express augmentation
  seed.ts               Test data seeder
```

---

## Design Decisions & Tradeoffs

**SQLite over PostgreSQL** — sufficient for local dev and assessment purposes. Swapping to PostgreSQL would only require changing the `db.ts` driver; all queries use standard SQL.

**Soft delete on records** — `deleted_at` timestamp instead of a hard `DELETE`. This means historical dashboard aggregates remain accurate and data can be recovered. Hard deletes would distort totals.

**Synchronous SQLite driver** — `better-sqlite3` is synchronous by design. This avoids async/await on every DB call and makes the code easier to follow; it is well-suited to SQLite's single-writer model.

**Role stored in JWT** — avoids a DB lookup on every request. The tradeoff is that a role change requires the user to log in again for a fresh token. Acceptable for this scope.

**Centralised error handling** — all routes call `next(err)` and a single handler classifies errors into Zod (422), AppError (known status), or unknown (500). This keeps route handlers thin and avoids scattered `try/catch` response logic.

**No refresh tokens** — tokens expire in 24h. A production system would add a refresh token rotation mechanism; omitted here to keep scope focused.
