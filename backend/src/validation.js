/**
 * Shared validation for POST / PUT /api/hotels.
 * Agreed contract (2026-11-25): title required, description required,
 * price in INR and > 0, latitude -90..90, longitude -180..180,
 * image jpg/png/webp, max 5 MB, required on create, optional on edit.
 * Returns { errors, values } — values are the cleaned, typed fields.
 */
export function validateHotelFields(body = {}, { imageRequired = false } = {}) {
  const errors = [];
  const values = {};

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) errors.push({ field: 'title', message: 'Title is required.' });
  else if (title.length < 2) errors.push({ field: 'title', message: 'Title must be at least 2 characters.' });
  else if (title.length > 200) errors.push({ field: 'title', message: 'Title must be at most 200 characters.' });
  values.title = title;

  const description = typeof body.description === 'string' ? body.description.trim() : '';
  if (!description) errors.push({ field: 'description', message: 'Description is required.' });
  else if (description.length > 5000) errors.push({ field: 'description', message: 'Description must be at most 5000 characters.' });
  values.description = description;

  const price = Number(body.price);
  if (body.price === undefined || body.price === '' || Number.isNaN(price)) {
    errors.push({ field: 'price', message: 'Price is required and must be a number (INR).' });
  } else if (price <= 0) {
    errors.push({ field: 'price', message: 'Price must be greater than 0.' });
  } else if (price > 10000000) {
    errors.push({ field: 'price', message: 'Price must be at most 10000000.' });
  }
  values.price = price;

  const latitude = Number(body.latitude);
  if (body.latitude === undefined || body.latitude === '' || Number.isNaN(latitude)) {
    errors.push({ field: 'latitude', message: 'Latitude is required and must be a number.' });
  } else if (latitude < -90 || latitude > 90) {
    errors.push({ field: 'latitude', message: 'Latitude must be between -90 and 90.' });
  }
  values.latitude = latitude;

  const longitude = Number(body.longitude);
  if (body.longitude === undefined || body.longitude === '' || Number.isNaN(longitude)) {
    errors.push({ field: 'longitude', message: 'Longitude is required and must be a number.' });
  } else if (longitude < -180 || longitude > 180) {
    errors.push({ field: 'longitude', message: 'Longitude must be between -180 and 180.' });
  }
  values.longitude = longitude;

  return { errors, values, imageRequired };
}

export function parseIdParam(req) {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}
