import { Request, Response, NextFunction } from 'express';
import { routeRepository } from '../models/RouteModel';
import { AppError } from '../middleware/errorHandler';
import {
  validateCoordinates,
  validatePhone,
  validateDate,
  validatePositiveNumber,
  validateRequiredString,
  validateUUID,
} from '../utils/validation';
import { CreateRouteInput, UpdateRouteInput } from '../types';

export const createRoute = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      driver_id,
      driver_name,
      driver_phone,
      driver_vehicle,
      origin_lat,
      origin_lng,
      origin_address,
      destination_lat,
      destination_lng,
      destination_address,
      departure_time,
      available_seats,
      price_per_km,
      total_distance,
    } = req.body;

    // Validate required fields
    validateRequiredString(driver_id, 'driver_id');
    validateRequiredString(driver_name, 'driver_name');
    validatePhone(driver_phone);
    
    // Validate vehicle info
    if (!driver_vehicle || typeof driver_vehicle !== 'object') {
      throw new AppError(400, 'VALIDATION_ERROR', 'driver_vehicle is required');
    }
    validateRequiredString(driver_vehicle.make, 'vehicle make');
    validateRequiredString(driver_vehicle.model, 'vehicle model');
    validateRequiredString(driver_vehicle.color, 'vehicle color');
    validateRequiredString(driver_vehicle.licensePlate, 'vehicle license plate');

    // Validate coordinates
    validateCoordinates(origin_lat, origin_lng, 'origin');
    validateCoordinates(destination_lat, destination_lng, 'destination');

    // Validate departure time
    const parsedDepartureTime = validateDate(departure_time, 'departure_time');

    // Validate numbers
    const validatedSeats = validatePositiveNumber(available_seats, 'available_seats');
    const validatedPrice = validatePositiveNumber(price_per_km, 'price_per_km');

    const routeData: CreateRouteInput = {
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

    const route = await routeRepository.create(routeData);
    res.status(201).json(route);
  } catch (error) {
    next(error);
  }
};

export const getRoute = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    validateUUID(id, 'route id');

    const route = await routeRepository.findById(id);
    
    if (!route) {
      throw new AppError(404, 'NOT_FOUND', 'Route not found');
    }

    res.json(route);
  } catch (error) {
    next(error);
  }
};

export const updateRoute = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    validateUUID(id, 'route id');

    const updates: UpdateRouteInput = {};

    if (req.body.departure_time !== undefined) {
      updates.departure_time = validateDate(req.body.departure_time, 'departure_time');
    }
    if (req.body.available_seats !== undefined) {
      updates.available_seats = validatePositiveNumber(req.body.available_seats, 'available_seats');
    }
    if (req.body.price_per_km !== undefined) {
      updates.price_per_km = validatePositiveNumber(req.body.price_per_km, 'price_per_km');
    }
    if (req.body.status !== undefined) {
      const validStatuses = ['planned', 'active', 'completed', 'cancelled'];
      if (!validStatuses.includes(req.body.status)) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid status value');
      }
      updates.status = req.body.status;
    }

    const route = await routeRepository.update(id, updates);
    
    if (!route) {
      throw new AppError(404, 'NOT_FOUND', 'Route not found');
    }

    res.json(route);
  } catch (error) {
    next(error);
  }
};

export const deleteRoute = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    validateUUID(id, 'route id');

    const deleted = await routeRepository.delete(id);
    
    if (!deleted) {
      throw new AppError(404, 'NOT_FOUND', 'Route not found');
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const searchRoutes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { origin_lat, origin_lng, destination_lat, destination_lng, date, radius } = req.query;

    // Validate required query parameters
    if (!origin_lat || !origin_lng || !destination_lat || !destination_lng) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'origin_lat, origin_lng, destination_lat, and destination_lng are required'
      );
    }

    const originLat = Number(origin_lat);
    const originLng = Number(origin_lng);
    const destLat = Number(destination_lat);
    const destLng = Number(destination_lng);

    validateCoordinates(originLat, originLng, 'origin');
    validateCoordinates(destLat, destLng, 'destination');

    const searchParams: any = {
      origin_lat: originLat,
      origin_lng: originLng,
      destination_lat: destLat,
      destination_lng: destLng,
    };

    if (date) {
      searchParams.date = validateDate(date, 'date');
    }

    if (radius) {
      searchParams.radius = validatePositiveNumber(radius, 'radius');
    }

    const routes = await routeRepository.search(searchParams);
    res.json(routes);
  } catch (error) {
    next(error);
  }
};

export const getNearbyRoutes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng) {
      throw new AppError(400, 'VALIDATION_ERROR', 'lat and lng are required');
    }

    const latitude = Number(lat);
    const longitude = Number(lng);

    validateCoordinates(latitude, longitude, 'location');

    const params: any = {
      lat: latitude,
      lng: longitude,
    };

    if (radius) {
      params.radius = validatePositiveNumber(radius, 'radius');
    }

    const routes = await routeRepository.findNearby(params);
    res.json(routes);
  } catch (error) {
    next(error);
  }
};
