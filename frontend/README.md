# Find-Out — Frontend (to be built)

This folder is for the React frontend. It is empty on purpose — gms builds it in VS Code.

## Create it (Vite + React + Redux)

```bash
# from the repo root, in VS Code's terminal
cd frontend
npm create vite@latest . -- --template react
npm install
npm install @reduxjs/toolkit react-redux react-router-dom react-helmet-async
npm run dev   # http://localhost:5173
```

## API it must call

Backend runs on `http://localhost:5000` (see `../backend/README.md` for the full contract).

- List: `GET /api/hotels?search=&minPrice=&maxPrice=&limit=10&offset=0`
  → `{ data: [...], total, limit, offset }`
- One hotel: `GET /api/hotels/:id` → `{ data: hotel }`
- Create: `POST /api/hotels` — `multipart/form-data`, image field `image`
- Update: `PUT /api/hotels/:id` — same, image optional
- Delete: `DELETE /api/hotels/:id` → `{ message: "Hotel deleted successfully.", data }`

Hotel fields: `title`, `description`, `latitude`, `longitude`, `price` (INR),
`image_path` (`/uploads/...`), `image_url` (full URL, use directly in `<img src>`).

Form validation (mirror the backend): title 2–200 chars, description required,
price > 0, latitude -90..90, longitude -180..180, image JPG/PNG/WebP max 5 MB,
required on create, optional on edit.
