import express from 'express';
import { query } from '../db.js';
import { validateHotelFields, parseIdParam } from '../validation.js';
import { uploadImage, deleteUploadedFile, imagePathFor } from '../upload.js';

const router = express.Router();

// One shape for every hotel returned by the API.
// image_path is the stored path ("/uploads/xxx.jpg");
// image_url is the absolute URL the frontend can use directly in <img src>.
function toHotel(row, req) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    price: Number(row.price),
    image_path: row.image_path,
    image_url: row.image_path
      ? `${req.protocol}://${req.get('host')}${row.image_path}`
      : null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * GET /api/hotels
 * Query: search (title, case-insensitive), minPrice, maxPrice,
 *        limit (default 10, 1–100), offset (default 0).
 * Response: { data: [...], total, limit, offset }
 */
router.get('/', async (req, res, next) => {
  try {
    const { search, minPrice, maxPrice } = req.query;

    let limit = req.query.limit === undefined ? 10 : Number(req.query.limit);
    let offset = req.query.offset === undefined ? 0 : Number(req.query.offset);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({ error: 'limit must be an integer between 1 and 100.' });
    }
    if (!Number.isInteger(offset) || offset < 0) {
      return res.status(400).json({ error: 'offset must be an integer >= 0.' });
    }

    const conditions = [];
    const params = [];

    if (search) {
      params.push(`%${String(search).trim()}%`);
      conditions.push(`title ILIKE $${params.length}`);
    }
    if (minPrice !== undefined && minPrice !== '') {
      const min = Number(minPrice);
      if (Number.isNaN(min)) return res.status(400).json({ error: 'minPrice must be a number.' });
      params.push(min);
      conditions.push(`price >= $${params.length}`);
    }
    if (maxPrice !== undefined && maxPrice !== '') {
      const max = Number(maxPrice);
      if (Number.isNaN(max)) return res.status(400).json({ error: 'maxPrice must be a number.' });
      params.push(max);
      conditions.push(`price <= $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Native SQL, parameterised — no ORM.
    const totalResult = await query(`SELECT COUNT(*)::int AS total FROM hotels ${where}`, params);
    const total = totalResult.rows[0].total;

    const listParams = [...params, limit, offset];
    const result = await query(
      `SELECT id, title, description, latitude, longitude, price, image_path, created_at, updated_at
       FROM hotels ${where}
       ORDER BY created_at DESC, id DESC
       LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
      listParams,
    );

    return res.json({ data: result.rows.map((r) => toHotel(r, req)), total, limit, offset });
  } catch (err) {
    return next(err);
  }
});

/** GET /api/hotels/:id — single hotel for the detail page. */
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseIdParam(req);
    if (!id) return res.status(400).json({ error: 'Invalid hotel id.' });
    const result = await query(
      'SELECT id, title, description, latitude, longitude, price, image_path, created_at, updated_at FROM hotels WHERE id = $1',
      [id],
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Hotel not found.' });
    return res.json({ data: toHotel(result.rows[0], req) });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/hotels — multipart/form-data, image field "image" (required).
 * Other fields are sent as text: title, description, latitude, longitude, price.
 */
router.post('/', (req, res, next) => {
  uploadImage(req, res, async (uploadErr) => {
    if (uploadErr) return next(uploadErr);
    try {
      const { errors, values } = validateHotelFields(req.body, { imageRequired: true });
      if (!req.file) errors.push({ field: 'image', message: 'Image is required.' });
      if (errors.length > 0) {
        if (req.file) await deleteUploadedFile(imagePathFor(req.file));
        return res.status(400).json({ error: 'Validation failed.', details: errors });
      }

      const imagePath = imagePathFor(req.file);
      const result = await query(
        `INSERT INTO hotels (title, description, latitude, longitude, price, image_path)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, title, description, latitude, longitude, price, image_path, created_at, updated_at`,
        [values.title, values.description, values.latitude, values.longitude, values.price, imagePath],
      );
      return res.status(201).json({ data: toHotel(result.rows[0], req) });
    } catch (err) {
      if (req.file) await deleteUploadedFile(imagePathFor(req.file));
      return next(err);
    }
  });
});

/**
 * PUT /api/hotels/:id — multipart/form-data, image field "image" (optional).
 * If a new image is uploaded, the old file is deleted from the server.
 * If no new image is sent, the existing image is kept.
 */
router.put('/:id', (req, res, next) => {
  uploadImage(req, res, async (uploadErr) => {
    if (uploadErr) return next(uploadErr);
    try {
      const id = parseIdParam(req);
      if (!id) {
        if (req.file) await deleteUploadedFile(imagePathFor(req.file));
        return res.status(400).json({ error: 'Invalid hotel id.' });
      }

      const existing = await query(
        'SELECT id, title, description, latitude, longitude, price, image_path, created_at, updated_at FROM hotels WHERE id = $1',
        [id],
      );
      if (existing.rows.length === 0) {
        if (req.file) await deleteUploadedFile(imagePathFor(req.file));
        return res.status(404).json({ error: 'Hotel not found.' });
      }

      const { errors, values } = validateHotelFields(req.body, { imageRequired: false });
      if (errors.length > 0) {
        if (req.file) await deleteUploadedFile(imagePathFor(req.file));
        return res.status(400).json({ error: 'Validation failed.', details: errors });
      }

      const oldImagePath = existing.rows[0].image_path;
      const newImagePath = req.file ? imagePathFor(req.file) : oldImagePath;

      const result = await query(
        `UPDATE hotels
         SET title = $1, description = $2, latitude = $3, longitude = $4, price = $5,
             image_path = $6, updated_at = NOW()
         WHERE id = $7
         RETURNING id, title, description, latitude, longitude, price, image_path, created_at, updated_at`,
        [values.title, values.description, values.latitude, values.longitude, values.price, newImagePath, id],
      );

      if (req.file && oldImagePath && oldImagePath !== newImagePath) {
        await deleteUploadedFile(oldImagePath);
      }
      return res.json({ data: toHotel(result.rows[0], req) });
    } catch (err) {
      if (req.file) await deleteUploadedFile(imagePathFor(req.file));
      return next(err);
    }
  });
});

/**
 * DELETE /api/hotels/:id — deletes the record and its image file.
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseIdParam(req);
    if (!id) return res.status(400).json({ error: 'Invalid hotel id.' });
    const result = await query(
      'DELETE FROM hotels WHERE id = $1 RETURNING id, title, description, latitude, longitude, price, image_path, created_at, updated_at',
      [id],
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Hotel not found.' });
    await deleteUploadedFile(result.rows[0].image_path);
    return res.json({ message: 'Hotel deleted successfully.', data: toHotel(result.rows[0], req) });
  } catch (err) {
    return next(err);
  }
});

export default router;
