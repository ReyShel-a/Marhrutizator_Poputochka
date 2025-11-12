import { Request, Response, NextFunction } from 'express';
import { routeRepository } from '../models/RouteModel';
import { bookingRepository } from '../models/BookingModel';
import { AppError } from '../middleware/errorHandler';
import { validateUUID } from '../utils/validation';

export const getRouteByQR = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { routeId } = req.params;
    validateUUID(routeId, 'route id');

    const route = await routeRepository.findById(routeId);
    
    if (!route) {
      throw new AppError(404, 'NOT_FOUND', 'Route not found');
    }

    // Get bookings to calculate remaining seats
    const bookings = await bookingRepository.findByRouteId(routeId);
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
  } catch (error) {
    next(error);
  }
};
