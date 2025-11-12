"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const errorHandler_1 = require("../middleware/errorHandler");
const bookingController_1 = require("../controllers/bookingController");
const security_1 = require("../middleware/security");
const router = (0, express_1.Router)();
// GET /api/bookings/route/:routeId - бронирования маршрута (must be before /:id)
router.get('/route/:routeId', (0, errorHandler_1.asyncHandler)(bookingController_1.getBookingsByRoute));
// POST /api/bookings - создание бронирования
router.post('/', security_1.createBookingLimiter, (0, errorHandler_1.asyncHandler)(bookingController_1.createBooking));
// GET /api/bookings/:id - получение бронирования
router.get('/:id', (0, errorHandler_1.asyncHandler)(bookingController_1.getBooking));
// PUT /api/bookings/:id - обновление статуса
router.put('/:id', (0, errorHandler_1.asyncHandler)(bookingController_1.updateBooking));
// DELETE /api/bookings/:id - отмена бронирования
router.delete('/:id', (0, errorHandler_1.asyncHandler)(bookingController_1.deleteBooking));
exports.default = router;
