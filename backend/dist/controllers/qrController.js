"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRouteByQR = void 0;
const RouteModel_1 = require("../models/RouteModel");
const BookingModel_1 = require("../models/BookingModel");
const errorHandler_1 = require("../middleware/errorHandler");
const validation_1 = require("../utils/validation");
const getRouteByQR = async (req, res, next) => {
    try {
        const { routeId } = req.params;
        (0, validation_1.validateUUID)(routeId, 'route id');
        const route = await RouteModel_1.routeRepository.findById(routeId);
        if (!route) {
            throw new errorHandler_1.AppError(404, 'NOT_FOUND', 'Route not found');
        }
        // Get bookings to calculate remaining seats
        const bookings = await BookingModel_1.bookingRepository.findByRouteId(routeId);
        const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
        const remainingSeats = route.available_seats - confirmedBookings.length;
        // Return route data with additional info for QR scanning
        const response = {
            ...route,
            remaining_seats: remainingSeats,
            bookings_count: confirmedBookings.length,
            is_available: route.status === 'planned' || route.status === 'active',
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
};
exports.getRouteByQR = getRouteByQR;
