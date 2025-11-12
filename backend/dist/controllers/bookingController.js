"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBookingsByRoute = exports.deleteBooking = exports.updateBooking = exports.getBooking = exports.createBooking = void 0;
const BookingModel_1 = require("../models/BookingModel");
const RouteModel_1 = require("../models/RouteModel");
const errorHandler_1 = require("../middleware/errorHandler");
const validation_1 = require("../utils/validation");
const createBooking = async (req, res, next) => {
    try {
        const { route_id, passenger_id, passenger_name, passenger_phone, passenger_comments, pickup_lat, pickup_lng, pickup_address, dropoff_lat, dropoff_lng, dropoff_address, distance, price, } = req.body;
        // Validate required fields
        (0, validation_1.validateUUID)(route_id, 'route_id');
        (0, validation_1.validateRequiredString)(passenger_id, 'passenger_id');
        (0, validation_1.validateRequiredString)(passenger_name, 'passenger_name');
        (0, validation_1.validatePhone)(passenger_phone);
        // Validate coordinates
        (0, validation_1.validateCoordinates)(pickup_lat, pickup_lng, 'pickup');
        (0, validation_1.validateCoordinates)(dropoff_lat, dropoff_lng, 'dropoff');
        // Validate numbers
        const validatedDistance = (0, validation_1.validatePositiveNumber)(distance, 'distance');
        const validatedPrice = (0, validation_1.validatePositiveNumber)(price, 'price');
        // Check if route exists and has available seats
        const route = await RouteModel_1.routeRepository.findById(route_id);
        if (!route) {
            throw new errorHandler_1.AppError(404, 'NOT_FOUND', 'Route not found');
        }
        if (route.status !== 'planned' && route.status !== 'active') {
            throw new errorHandler_1.AppError(409, 'BOOKING_CONFLICT', 'Route is not available for booking');
        }
        // Check available seats
        const existingBookingsCount = await BookingModel_1.bookingRepository.countByRouteId(route_id);
        if (existingBookingsCount >= route.available_seats) {
            throw new errorHandler_1.AppError(409, 'BOOKING_CONFLICT', 'No available seats on this route');
        }
        const bookingData = {
            route_id,
            passenger_id,
            passenger_name,
            passenger_phone,
            passenger_comments,
            pickup_lat: Number(pickup_lat),
            pickup_lng: Number(pickup_lng),
            pickup_address,
            dropoff_lat: Number(dropoff_lat),
            dropoff_lng: Number(dropoff_lng),
            dropoff_address,
            distance: validatedDistance,
            price: validatedPrice,
        };
        const booking = await BookingModel_1.bookingRepository.create(bookingData);
        res.status(201).json(booking);
    }
    catch (error) {
        next(error);
    }
};
exports.createBooking = createBooking;
const getBooking = async (req, res, next) => {
    try {
        const { id } = req.params;
        (0, validation_1.validateUUID)(id, 'booking id');
        const booking = await BookingModel_1.bookingRepository.findById(id);
        if (!booking) {
            throw new errorHandler_1.AppError(404, 'NOT_FOUND', 'Booking not found');
        }
        res.json(booking);
    }
    catch (error) {
        next(error);
    }
};
exports.getBooking = getBooking;
const updateBooking = async (req, res, next) => {
    try {
        const { id } = req.params;
        (0, validation_1.validateUUID)(id, 'booking id');
        const updates = {};
        if (req.body.status !== undefined) {
            const validStatuses = ['pending', 'confirmed', 'cancelled'];
            if (!validStatuses.includes(req.body.status)) {
                throw new errorHandler_1.AppError(400, 'VALIDATION_ERROR', 'Invalid status value');
            }
            updates.status = req.body.status;
        }
        if (req.body.passenger_comments !== undefined) {
            updates.passenger_comments = req.body.passenger_comments;
        }
        const booking = await BookingModel_1.bookingRepository.update(id, updates);
        if (!booking) {
            throw new errorHandler_1.AppError(404, 'NOT_FOUND', 'Booking not found');
        }
        res.json(booking);
    }
    catch (error) {
        next(error);
    }
};
exports.updateBooking = updateBooking;
const deleteBooking = async (req, res, next) => {
    try {
        const { id } = req.params;
        (0, validation_1.validateUUID)(id, 'booking id');
        const deleted = await BookingModel_1.bookingRepository.delete(id);
        if (!deleted) {
            throw new errorHandler_1.AppError(404, 'NOT_FOUND', 'Booking not found');
        }
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
};
exports.deleteBooking = deleteBooking;
const getBookingsByRoute = async (req, res, next) => {
    try {
        const { routeId } = req.params;
        (0, validation_1.validateUUID)(routeId, 'route id');
        // Check if route exists
        const route = await RouteModel_1.routeRepository.findById(routeId);
        if (!route) {
            throw new errorHandler_1.AppError(404, 'NOT_FOUND', 'Route not found');
        }
        const bookings = await BookingModel_1.bookingRepository.findByRouteId(routeId);
        res.json(bookings);
    }
    catch (error) {
        next(error);
    }
};
exports.getBookingsByRoute = getBookingsByRoute;
