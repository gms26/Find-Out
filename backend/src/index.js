import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { pool } from './db.js';
import { uploadDir } from './upload.js';
import hotelsRouter from './routes/hotels.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 5000;

// CORS: Vite (5173) and CRA (3000) by default, override with CORS_ORIGINS.
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Uploaded images are served from here, e.g. http://localhost:5000/uploads/abc.jpg
app.use('/uploads', express.static(uploadDir));

app.get('/', (_req, res) => {
  res.json({ message: 'Find-Out Hotel API is running.', hotels: '/api/hotels', health: '/health' });
});
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/hotels', hotelsRouter);

// 404 for unknown API routes
app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found.' }));

// Central error handler — multer errors become clean 400s, the rest 500s.
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Image must be at most 5 MB.' });
    }
    return res.status(400).json({ error: `Upload failed: ${err.message}` });
  }
  if (err && err.message === 'Image must be a JPG, PNG or WebP file.') {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'Internal server error.' });
});

const server = app.listen(PORT, () => {
  console.log(`Hotel API listening on http://localhost:${PORT}`);
  console.log(`Uploads served at http://localhost:${PORT}/uploads`);
  console.log(`CORS origins: ${allowedOrigins.join(', ')}`);
});

async function shutdown(signal) {
  console.log(`\n${signal} received, closing server...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
