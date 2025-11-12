import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import {
  createBooking,
  getBooking,
  updateBooking,
  deleteBooking,
  getBookingsByRoute,
} from '../controllers/bookingController';
import { createBookingLimiter } from '../middleware/security';

const router = Router();

// GET /api/bookings/route/:routeId - бронирования маршрута (must be before /:id)
router.get('/route/:routeId', asyncHandler(getBookingsByRoute));

// POST /api/bookings - создание бронирования
router.post('/', createBookingLimiter, asyncHandler(createBooking));

// GET /api/bookings/:id - получение бронирования
router.get('/:id', asyncHandler(getBooking));

// PUT /api/bookings/:id - обновление статуса
router.put('/:id', asyncHandler(updateBooking));

// DELETE /api/bookings/:id - отмена бронирования
router.delete('/:id', asyncHandler(deleteBooking));

export default router;
