"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNearbyRoutes = exports.searchRoutes = exports.deleteRoute = exports.updateRoute = exports.getRoute = exports.createRoute = void 0;
const RouteModel_1 = require("../models/RouteModel");
const errorHandler_1 = require("../middleware/errorHandler");
const validation_1 = require("../utils/validation");
const createRoute = async (req, res, next) => {
    try {
        const { driver_id, driver_name, driver_phone, driver_vehicle, origin_lat, origin_lng, origin_address, destination_lat, destination_lng, destination_address, departure_time, available_seats, price_per_km, total_distance, } = req.body;
        // Validate required fields
        (0, validation_1.validateRequiredString)(driver_id, 'driver_id');
        (0, validation_1.validateRequiredString)(driver_name, 'driver_name');
        (0, validation_1.validatePhone)(driver_phone);
        // Validate vehicle info
        if (!driver_vehicle || typeof driver_vehicle !== 'object') {
            throw new errorHandler_1.AppError(400, 'VALIDATION_ERROR', 'driver_vehicle is required');
        }
        (0, validation_1.validateRequiredString)(driver_vehicle.make, 'vehicle make');
        (0, validation_1.validateRequiredString)(driver_vehicle.model, 'vehicle model');
        (0, validation_1.validateRequiredString)(driver_vehicle.color, 'vehicle color');
        (0, validation_1.validateRequiredString)(driver_vehicle.licensePlate, 'vehicle license plate');
        // Validate coordinates
        (0, validation_1.validateCoordinates)(origin_lat, origin_lng, 'origin');
        (0, validation_1.validateCoordinates)(destination_lat, destination_lng, 'destination');
        // Validate departure time
        const parsedDepartureTime = (0, validation_1.validateDate)(departure_time, 'departure_time');
        // Validate numbers
        const validatedSeats = (0, validation_1.validatePositiveNumber)(available_seats, 'available_seats');
        const validatedPrice = (0, validation_1.validatePositiveNumber)(price_per_km, 'price_per_km');
        const routeData = {
            driver_id,
            driver_name,
            driver_phone,
            driver_vehicle,
            origin_lat: Number(origin_lat),
            origin_lng: Number(origin_lng),
            origin_address,
            destination_lat: Number(destination_lat),
            destination_lng: Number(destination_lng),
            destination_address,
            departure_time: parsedDepartureTime,
            available_seats: validatedSeats,
            price_per_km: validatedPrice,
            total_distance: total_distance ? Number(total_distance) : undefined,
        };
        const route = await RouteModel_1.routeRepository.create(routeData);
        res.status(201).json(route);
    }
    catch (error) {
        next(error);
    }
};
exports.createRoute = createRoute;
const getRoute = async (req, res, next) => {
    try {
        const { id } = req.params;
        (0, validation_1.validateUUID)(id, 'route id');
        const route = await RouteModel_1.routeRepository.findById(id);
        if (!route) {
            throw new errorHandler_1.AppError(404, 'NOT_FOUND', 'Route not found');
        }
        res.json(route);
    }
    catch (error) {
        next(error);
    }
};
exports.getRoute = getRoute;
const updateRoute = async (req, res, next) => {
    try {
        const { id } = req.params;
        (0, validation_1.validateUUID)(id, 'route id');
        const updates = {};
        if (req.body.departure_time !== undefined) {
            updates.departure_time = (0, validation_1.validateDate)(req.body.departure_time, 'departure_time');
        }
        if (req.body.available_seats !== undefined) {
            updates.available_seats = (0, validation_1.validatePositiveNumber)(req.body.available_seats, 'available_seats');
        }
        if (req.body.price_per_km !== undefined) {
            updates.price_per_km = (0, validation_1.validatePositiveNumber)(req.body.price_per_km, 'price_per_km');
        }
        if (req.body.status !== undefined) {
            const validStatuses = ['planned', 'active', 'completed', 'cancelled'];
            if (!validStatuses.includes(req.body.status)) {
                throw new errorHandler_1.AppError(400, 'VALIDATION_ERROR', 'Invalid status value');
            }
            updates.status = req.body.status;
        }
        const route = await RouteModel_1.routeRepository.update(id, updates);
        if (!route) {
            throw new errorHandler_1.AppError(404, 'NOT_FOUND', 'Route not found');
        }
        res.json(route);
    }
    catch (error) {
        next(error);
    }
};
exports.updateRoute = updateRoute;
const deleteRoute = async (req, res, next) => {
    try {
        const { id } = req.params;
        (0, validation_1.validateUUID)(id, 'route id');
        const deleted = await RouteModel_1.routeRepository.delete(id);
        if (!deleted) {
            throw new errorHandler_1.AppError(404, 'NOT_FOUND', 'Route not found');
        }
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
};
exports.deleteRoute = deleteRoute;
const searchRoutes = async (req, res, next) => {
    try {
        const { origin_lat, origin_lng, destination_lat, destination_lng, date, radius } = req.query;
        // Validate required query parameters
        if (!origin_lat || !origin_lng || !destination_lat || !destination_lng) {
            throw new errorHandler_1.AppError(400, 'VALIDATION_ERROR', 'origin_lat, origin_lng, destination_lat, and destination_lng are required');
        }
        const originLat = Number(origin_lat);
        const originLng = Number(origin_lng);
        const destLat = Number(destination_lat);
        const destLng = Number(destination_lng);
        (0, validation_1.validateCoordinates)(originLat, originLng, 'origin');
        (0, validation_1.validateCoordinates)(destLat, destLng, 'destination');
        const searchParams = {
            origin_lat: originLat,
            origin_lng: originLng,
            destination_lat: destLat,
            destination_lng: destLng,
        };
        if (date) {
            searchParams.date = (0, validation_1.validateDate)(date, 'date');
        }
        if (radius) {
            searchParams.radius = (0, validation_1.validatePositiveNumber)(radius, 'radius');
        }
        const routes = await RouteModel_1.routeRepository.search(searchParams);
        res.json(routes);
    }
    catch (error) {
        next(error);
    }
};
exports.searchRoutes = searchRoutes;
const getNearbyRoutes = async (req, res, next) => {
    try {
        const { lat, lng, radius } = req.query;
        if (!lat || !lng) {
            throw new errorHandler_1.AppError(400, 'VALIDATION_ERROR', 'lat and lng are required');
        }
        const latitude = Number(lat);
        const longitude = Number(lng);
        (0, validation_1.validateCoordinates)(latitude, longitude, 'location');
        const params = {
            lat: latitude,
            lng: longitude,
        };
        if (radius) {
            params.radius = (0, validation_1.validatePositiveNumber)(radius, 'radius');
        }
        const routes = await RouteModel_1.routeRepository.findNearby(params);
        res.json(routes);
    }
    catch (error) {
        next(error);
    }
};
exports.getNearbyRoutes = getNearbyRoutes;
