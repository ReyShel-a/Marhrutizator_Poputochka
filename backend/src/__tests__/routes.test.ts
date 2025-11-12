import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import cors from 'cors';
import routesRouter from '../routes/routes';
import { errorHandler } from '../middleware/errorHandler';
import { pool } from '../config/database';

let app: Express;

beforeAll(async () => {
  // Setup test app
  app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/routes', routesRouter);
  app.use(errorHandler);

  // Clean up test data
  await pool.query('DELETE FROM bookings WHERE route_id IN (SELECT id FROM routes WHERE driver_phone LIKE \'+1234567890%\')');
  await pool.query('DELETE FROM routes WHERE driver_phone LIKE \'+1234567890%\'');
});

afterAll(async () => {
  // Clean up test data
  await pool.query('DELETE FROM bookings WHERE route_id IN (SELECT id FROM routes WHERE driver_phone LIKE \'+1234567890%\')');
  await pool.query('DELETE FROM routes WHERE driver_phone LIKE \'+1234567890%\'');
  await pool.end();
});

describe('Routes API Integration Tests', () => {
  let createdRouteId: string;

  describe('POST /api/routes - Create Route', () => {
    it('should create a new route with valid data', async () => {
      const routeData = {
        driver_id: 'test-driver-1',
        driver_name: 'Test Driver',
        driver_phone: '+12345678901',
        driver_vehicle: {
          make: 'Toyota',
          model: 'Camry',
          color: 'Blue',
          licensePlate: 'ABC123'
        },
        origin_lat: 55.7558,
        origin_lng: 37.6173,
        origin_address: 'Moscow, Russia',
        destination_lat: 59.9343,
        destination_lng: 30.3351,
        destination_address: 'Saint Petersburg, Russia',
        departure_time: new Date(Date.now() + 86400000).toISOString(),
        available_seats: 3,
        price_per_km: 5.5,
        total_distance: 700
      };

      const response = await request(app)
        .post('/api/routes')
        .send(routeData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.driver_name).toBe('Test Driver');
      expect(response.body.available_seats).toBe(3);
      expect(response.body.status).toBe('planned');
      
      createdRouteId = response.body.id;
    });

    it('should reject route with invalid phone number', async () => {
      const routeData = {
        driver_id: 'test-driver-2',
        driver_name: 'Test Driver',
        driver_phone: 'invalid-phone',
        driver_vehicle: {
          make: 'Toyota',
          model: 'Camry',
          color: 'Blue',
          licensePlate: 'ABC123'
        },
        origin_lat: 55.7558,
        origin_lng: 37.6173,
        origin_address: 'Moscow, Russia',
        destination_lat: 59.9343,
        destination_lng: 30.3351,
        destination_address: 'Saint Petersburg, Russia',
        departure_time: new Date(Date.now() + 86400000).toISOString(),
        available_seats: 3,
        price_per_km: 5.5
      };

      const response = await request(app)
        .post('/api/routes')
        .send(routeData)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject route with invalid coordinates', async () => {
      const routeData = {
        driver_id: 'test-driver-3',
        driver_name: 'Test Driver',
        driver_phone: '+12345678903',
        driver_vehicle: {
          make: 'Toyota',
          model: 'Camry',
          color: 'Blue',
          licensePlate: 'ABC123'
        },
        origin_lat: 95.0,
        origin_lng: 37.6173,
        origin_address: 'Invalid Location',
        destination_lat: 59.9343,
        destination_lng: 30.3351,
        destination_address: 'Saint Petersburg, Russia',
        departure_time: new Date(Date.now() + 86400000).toISOString(),
        available_seats: 3,
        price_per_km: 5.5
      };

      const response = await request(app)
        .post('/api/routes')
        .send(routeData)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/routes/:id - Get Route', () => {
    it('should retrieve a route by id', async () => {
      const response = await request(app)
        .get(`/api/routes/${createdRouteId}`)
        .expect(200);

      expect(response.body.id).toBe(createdRouteId);
      expect(response.body.driver_name).toBe('Test Driver');
    });

    it('should return 404 for non-existent route', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/routes/${fakeId}`)
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/routes/:id - Update Route', () => {
    it('should update route available seats', async () => {
      const response = await request(app)
        .put(`/api/routes/${createdRouteId}`)
        .send({ available_seats: 2 })
        .expect(200);

      expect(response.body.available_seats).toBe(2);
    });

    it('should update route status', async () => {
      const response = await request(app)
        .put(`/api/routes/${createdRouteId}`)
        .send({ status: 'active' })
        .expect(200);

      expect(response.body.status).toBe('active');
    });
  });

  describe('GET /api/routes/search - Search Routes', () => {
    it('should search routes by origin and destination', async () => {
      const response = await request(app)
        .get('/api/routes/search')
        .query({
          origin_lat: 55.7558,
          origin_lng: 37.6173,
          destination_lat: 59.9343,
          destination_lng: 30.3351
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should reject search without required parameters', async () => {
      const response = await request(app)
        .get('/api/routes/search')
        .query({
          origin_lat: 55.7558
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/routes/nearby - Get Nearby Routes', () => {
    it('should get nearby routes', async () => {
      const response = await request(app)
        .get('/api/routes/nearby')
        .query({
          lat: 55.7558,
          lng: 37.6173,
          radius: 50
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should reject request without coordinates', async () => {
      const response = await request(app)
        .get('/api/routes/nearby')
        .query({
          radius: 50
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/routes/:id - Delete Route', () => {
    it('should delete a route', async () => {
      await request(app)
        .delete(`/api/routes/${createdRouteId}`)
        .expect(204);

      // Verify deletion
      await request(app)
        .get(`/api/routes/${createdRouteId}`)
        .expect(404);
    });
  });
});
