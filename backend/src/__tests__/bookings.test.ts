import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import cors from 'cors';
import routesRouter from '../routes/routes';
import bookingsRouter from '../routes/bookings';
import { errorHandler } from '../middleware/errorHandler';
import { pool } from '../config/database';

let app: Express;

beforeAll(async () => {
  // Setup test app
  app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/routes', routesRouter);
  app.use('/api/bookings', bookingsRouter);
  app.use(errorHandler);

  // Clean up test data
  await pool.query('DELETE FROM bookings WHERE passenger_phone LIKE \'+1234567890%\'');
  await pool.query('DELETE FROM routes WHERE driver_phone LIKE \'+1234567890%\'');
});

afterAll(async () => {
  // Clean up test data
  await pool.query('DELETE FROM bookings WHERE passenger_phone LIKE \'+1234567890%\'');
  await pool.query('DELETE FROM routes WHERE driver_phone LIKE \'+1234567890%\'');
  await pool.end();
});

describe('Bookings API Integration Tests', () => {
  let testRouteId: string;
  let createdBookingId: string;

  beforeAll(async () => {
    // Create a test route for bookings
    const routeData = {
      driver_id: 'test-driver-booking',
      driver_name: 'Booking Test Driver',
      driver_phone: '+12345678904',
      driver_vehicle: {
        make: 'Honda',
        model: 'Accord',
        color: 'Red',
        licensePlate: 'XYZ789'
      },
      origin_lat: 55.7558,
      origin_lng: 37.6173,
      origin_address: 'Moscow, Russia',
      destination_lat: 59.9343,
      destination_lng: 30.3351,
      destination_address: 'Saint Petersburg, Russia',
      departure_time: new Date(Date.now() + 86400000).toISOString(),
      available_seats: 3,
      price_per_km: 6.0,
      total_distance: 700
    };

    const response = await request(app)
      .post('/api/routes')
      .send(routeData);

    testRouteId = response.body.id;
  });

  describe('POST /api/bookings - Create Booking', () => {
    it('should create a new booking with valid data', async () => {
      const bookingData = {
        route_id: testRouteId,
        passenger_id: 'test-passenger-1',
        passenger_name: 'Test Passenger',
        passenger_phone: '+12345678905',
        passenger_comments: 'Will be waiting at the bus stop',
        pickup_lat: 55.7558,
        pickup_lng: 37.6173,
        pickup_address: 'Moscow, Russia',
        dropoff_lat: 59.9343,
        dropoff_lng: 30.3351,
        dropoff_address: 'Saint Petersburg, Russia',
        distance: 700,
        price: 4200
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.passenger_name).toBe('Test Passenger');
      expect(response.body.price).toBe(4200);
      expect(response.body.status).toBe('confirmed');
      
      createdBookingId = response.body.id;
    });

    it('should reject booking with invalid phone number', async () => {
      const bookingData = {
        route_id: testRouteId,
        passenger_id: 'test-passenger-2',
        passenger_name: 'Test Passenger',
        passenger_phone: 'invalid',
        pickup_lat: 55.7558,
        pickup_lng: 37.6173,
        pickup_address: 'Moscow, Russia',
        dropoff_lat: 59.9343,
        dropoff_lng: 30.3351,
        dropoff_address: 'Saint Petersburg, Russia',
        distance: 700,
        price: 4200
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject booking for non-existent route', async () => {
      const fakeRouteId = '00000000-0000-0000-0000-000000000000';
      const bookingData = {
        route_id: fakeRouteId,
        passenger_id: 'test-passenger-3',
        passenger_name: 'Test Passenger',
        passenger_phone: '+12345678906',
        pickup_lat: 55.7558,
        pickup_lng: 37.6173,
        pickup_address: 'Moscow, Russia',
        dropoff_lat: 59.9343,
        dropoff_lng: 30.3351,
        dropoff_address: 'Saint Petersburg, Russia',
        distance: 700,
        price: 4200
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should reject booking when no seats available', async () => {
      // Create bookings to fill all seats
      const bookingData = {
        route_id: testRouteId,
        passenger_id: 'test-passenger-4',
        passenger_name: 'Test Passenger 2',
        passenger_phone: '+12345678907',
        pickup_lat: 55.7558,
        pickup_lng: 37.6173,
        pickup_address: 'Moscow, Russia',
        dropoff_lat: 59.9343,
        dropoff_lng: 30.3351,
        dropoff_address: 'Saint Petersburg, Russia',
        distance: 700,
        price: 4200
      };

      await request(app).post('/api/bookings').send(bookingData);
      await request(app).post('/api/bookings').send({
        ...bookingData,
        passenger_id: 'test-passenger-5',
        passenger_phone: '+12345678908'
      });

      // Try to book when full
      const response = await request(app)
        .post('/api/bookings')
        .send({
          ...bookingData,
          passenger_id: 'test-passenger-6',
          passenger_phone: '+12345678909'
        })
        .expect(409);

      expect(response.body.error.code).toBe('BOOKING_CONFLICT');
    });
  });

  describe('GET /api/bookings/:id - Get Booking', () => {
    it('should retrieve a booking by id', async () => {
      const response = await request(app)
        .get(`/api/bookings/${createdBookingId}`)
        .expect(200);

      expect(response.body.id).toBe(createdBookingId);
      expect(response.body.passenger_name).toBe('Test Passenger');
    });

    it('should return 404 for non-existent booking', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/bookings/${fakeId}`)
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/bookings/:id - Update Booking', () => {
    it('should update booking status', async () => {
      const response = await request(app)
        .put(`/api/bookings/${createdBookingId}`)
        .send({ status: 'cancelled' })
        .expect(200);

      expect(response.body.status).toBe('cancelled');
    });

    it('should update booking comments', async () => {
      const response = await request(app)
        .put(`/api/bookings/${createdBookingId}`)
        .send({ passenger_comments: 'Updated comment' })
        .expect(200);

      expect(response.body.passenger_comments).toBe('Updated comment');
    });
  });

  describe('GET /api/bookings/route/:routeId - Get Bookings by Route', () => {
    it('should retrieve all bookings for a route', async () => {
      const response = await request(app)
        .get(`/api/bookings/route/${testRouteId}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent route', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/bookings/route/${fakeId}`)
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /api/bookings/:id - Delete Booking', () => {
    it('should delete a booking', async () => {
      await request(app)
        .delete(`/api/bookings/${createdBookingId}`)
        .expect(204);

      // Verify deletion
      await request(app)
        .get(`/api/bookings/${createdBookingId}`)
        .expect(404);
    });
  });
});
