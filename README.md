# Find-Out — Hotel List Page (CRUD)

Interview task (Namlatech) — React + Redux frontend, Node.js + Express + PostgreSQL backend.

- `backend/` — **done.** Express API, native SQL, local image uploads. See `backend/README.md` for the full API contract.
- `frontend/` — **to be built by gms in VS Code** (Vite + React + Redux). See `frontend/README.md` for the setup steps and the API it must call.

## Run the backend
```bash
cd backend
npm install
cp .env.example .env
npm run db:setup
npm run seed
npm run dev   # http://localhost:5000
```
