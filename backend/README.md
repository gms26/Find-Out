# Find-Out — Backend (Hotel List CRUD API)

Node.js + Express + PostgreSQL. Native SQL only — no ORM.
Images are stored on the local server in `uploads/` and the path is saved in the DB.

## Quick start

```bash
# 1. PostgreSQL must be running, then create the database
createdb findout_hotels
# or: psql -c "CREATE DATABASE findout_hotels;"

# 2. Install + configure
cd backend
npm install
cp .env.example .env
# edit .env if your Postgres user/password/database differ

# 3. Create the table + seed 12 hotels
npm run db:setup
npm run seed

# 4. Run
npm run dev    # watch mode, http://localhost:5000
# or: npm start
```

Health check: `GET http://localhost:5000/health`
List: `GET http://localhost:5000/api/hotels`

## API contract (agreed 2026-11-25)

Base: `http://localhost:5000` — CORS allows `http://localhost:5173` (Vite) and `http://localhost:3000` (CRA).

### Hotel object
```json
{
  "id": 1,
  "title": "The Grand Marina",
  "description": "...",
  "latitude": 13.0827,
  "longitude": 80.2707,
  "price": 4999,
  "image_path": "/uploads/seed-grand-marina.jpg",
  "image_url": "http://localhost:5000/uploads/seed-grand-marina.jpg",
  "created_at": "2026-11-25T...",
  "updated_at": "2026-11-25T..."
}
```
Price is in **INR**. `image_url` is ready to use directly in `<img src>`.

### Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/hotels` | List + filters + pagination |
| GET | `/api/hotels/:id` | One hotel (detail page) |
| POST | `/api/hotels` | Create (image required) |
| PUT | `/api/hotels/:id` | Update (image optional, keeps old if not sent) |
| DELETE | `/api/hotels/:id` | Delete record + its image file |

#### GET /api/hotels
Query params: `search` (title, case-insensitive), `minPrice`, `maxPrice`, `limit` (default 10, 1–100), `offset` (default 0).

```
GET /api/hotels?search=goa&minPrice=3000&maxPrice=8000&limit=10&offset=0
→ { "data": [...], "total": 1, "limit": 10, "offset": 0 }
```

#### POST / PUT — multipart/form-data
Field name for the image is **`image`**. Other fields are sent as text.

| Field | Rule |
| --- | --- |
| title | required, 2–200 chars |
| description | required, max 5000 chars |
| latitude | required, -90 to 90 |
| longitude | required, -180 to 180 |
| price | required, number > 0 (INR) |
| image | JPG/PNG/WebP, max 5 MB. Required on POST, optional on PUT. |

Success: POST → `201 { data: hotel }`, PUT → `200 { data: hotel }`.
Failure: `400 { error: "Validation failed.", details: [{ field, message }] }`
Not found: `404 { error: "Hotel not found." }`

Example with curl:
```bash
curl -X POST http://localhost:5000/api/hotels \
  -F "title=Test Hotel" -F "description=A nice stay." \
  -F "latitude=13.0827" -F "longitude=80.2707" -F "price=2999" \
  -F "image=@/path/to/photo.jpg"
```

#### DELETE /api/hotels/:id
```
→ 200 { "message": "Hotel deleted successfully.", "data": { ...deleted hotel } }
```
The image file is also deleted from `uploads/` (on PUT with a new image, the old file is deleted too).

## Files
- `src/index.js` — server, CORS, static `/uploads`, error handler
- `src/db.js` — pg Pool (`DATABASE_URL`)
- `src/routes/hotels.js` — all 5 endpoints, native parameterised SQL
- `src/validation.js` — field validation
- `src/upload.js` — multer storage, file filter, safe file deletion
- `schema.sql` — hotels table + indexes
- `seed.js` / `src/seed-data.js` — 12 seed hotels across India
- `scripts/setup-db.js` — runs `schema.sql` (`npm run db:setup`)

## Seed data
`npm run seed` inserts 12 hotels only if the table is empty.
`npm run seed:force` clears the table and reseeds. Seed images are committed
in `uploads/seed-*.jpg` — they are simple generated placeholders, replace them
with real hotel photos by uploading through the API.
