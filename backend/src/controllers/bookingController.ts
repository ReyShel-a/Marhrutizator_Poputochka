import { Request, Response, NextFunction } from 'express';
import { bookingRepository } from '../models/BookingModel';
import { routeRepository } from '../models/RouteModel';
import { AppError } from '../middleware/errorHandler';
import {
  validateCoordinates,
  validatePhone,
  validatePositiveNumber,
  validateRequiredString,
  validateUUID,
} from '../utils/validation';
import { CreateBookingInput, UpdateBookingInput } from '../types';

export const createBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      route_id,
      passenger_id,
      passenger_name,
      passenger_phone,
      passenger_comments,
      pickup_lat,
      pickup_lng,
      pickup_address,
      dropoff_lat,
      dropoff_lng,
      dropoff_address,
      distance,
      price,
    } = req.body;

    // Validate required fields
    validateUUID(route_id, 'route_id');
    validateRequiredString(passenger_id, 'passenger_id');
    validateRequiredString(passenger_name, 'passenger_name');
    validatePhone(passenger_phone);

    // Validate coordinates
    validateCoordinates(pickup_lat, pickup_lng, 'pickup');
    validateCoordinates(dropoff_lat, dropoff_lng, 'dropoff');

    // Validate numbers
    const validatedDistance = validatePositiveNumber(distance, 'distance');
    const validatedPrice = validatePositiveNumber(price, 'price');

    // Check if route exists and has available seats
    const route = await routeRepository.findById(route_id);
    if (!route) {
      throw new AppError(404, 'NOT_FOUND', 'Route not found');
    }

    if (route.status !== 'planned' && route.status !== 'active') {
      throw new AppError(409, 'BOOKING_CONFLICT', 'Route is not available for booking');
    }

    // Check available seats
    const existingBookingsCount = await bookingRepository.countByRouteId(route_id);
    if (existingBookingsCount >= route.available_seats) {
      throw new AppError(409, 'BOOKING_CONFLICT', 'No available seats on this route');
    }

    const bookingData: CreateBookingInput = {
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

    const booking = await bookingRepository.create(bookingData);
    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
};

export const getBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    validateUUID(id, 'booking id');

    const booking = await bookingRepository.findById(id);
    
    if (!booking) {
      throw new AppError(404, 'NOT_FOUND', 'Booking not found');
    }

    res.json(booking);
  } catch (error) {
    next(error);
  }
};

export const updateBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    validateUUID(id, 'booking id');

    const updates: UpdateBookingInput = {};

    if (req.body.status !== undefined) {
      const validStatuses = ['pending', 'confirmed', 'cancelled'];
      if (!validStatuses.includes(req.body.status)) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid status value');
      }
      updates.status = req.body.status;
    }

    if (req.body.passenger_comments !== undefined) {
      updates.passenger_comments = req.body.passenger_comments;
    }

    const booking = await bookingRepository.update(id, updates);
    
    if (!booking) {
      throw new AppError(404, 'NOT_FOUND', 'Booking not found');
    }

    res.json(booking);
  } catch (error) {
    next(error);
  }
};

export const deleteBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    validateUUID(id, 'booking id');

    const deleted = await bookingRepository.delete(id);
    
    if (!deleted) {
      throw new AppError(404, 'NOT_FOUND', 'Booking not found');
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getBookingsByRoute = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { routeId } = req.params;
    validateUUID(routeId, 'route id');

    // Check if route exists
    const route = await routeRepository.findById(routeId);
    if (!route) {
      throw new AppError(404, 'NOT_FOUND', 'Route not found');
    }

    const bookings = await bookingRepository.findByRouteId(routeId);
    res.json(bookings);
  } catch (error) {
    next(error);
  }
};
