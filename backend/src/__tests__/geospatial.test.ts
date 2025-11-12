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
  await pool.query('DELETE FROM bookings WHERE route_id IN (SELECT id FROM routes WHERE driver_phone LIKE \'+1234567891%\')');
  await pool.query('DELETE FROM routes WHERE driver_phone LIKE \'+1234567891%\'');

  // Create test routes at different locations
  const testRoutes = [
    {
      driver_id: 'geo-test-1',
      driver_name: 'Geo Test Driver 1',
      driver_phone: '+12345678911',
      driver_vehicle: { make: 'Toyota', model: 'Camry', color: 'Blue', licensePlate: 'GEO001' },
      origin_lat: 55.7558,
      origin_lng: 37.6173,
      origin_address: 'Moscow Center',
      destination_lat: 55.8558,
      destination_lng: 37.7173,
      destination_address: 'Moscow North',
      departure_time: new Date(Date.now() + 86400000).toISOString(),
      available_seats: 3,
      price_per_km: 5.0,
      total_distance: 15
    },
    {
      driver_id: 'geo-test-2',
      driver_name: 'Geo Test Driver 2',
      driver_phone: '+12345678912',
      driver_vehicle: { make: 'Honda', model: 'Civic', color: 'Red', licensePlate: 'GEO002' },
      origin_lat: 55.7658,
      origin_lng: 37.6273,
      origin_address: 'Moscow East',
      destination_lat: 55.7458,
      destination_lng: 37.6073,
      destination_address: 'Moscow West',
      departure_time: new Date(Date.now() + 86400000).toISOString(),
      available_seats: 2,
      price_per_km: 6.0,
      total_distance: 10
    },
    {
      driver_id: 'geo-test-3',
      driver_name: 'Geo Test Driver 3',
      driver_phone: '+12345678913',
      driver_vehicle: { make: 'Ford', model: 'Focus', color: 'White', licensePlate: 'GEO003' },
      origin_lat: 59.9343,
      origin_lng: 30.3351,
      origin_address: 'Saint Petersburg',
      destination_lat: 60.0343,
      destination_lng: 30.4351,
      destination_address: 'Saint Petersburg North',
      departure_time: new Date(Date.now() + 86400000).toISOString(),
      available_seats: 4,
      price_per_km: 4.5,
      total_distance: 20
    }
  ];

  for (const route of testRoutes) {
    await request(app).post('/api/routes').send(route);
  }
});

afterAll(async () => {
  // Clean up test data
  await pool.query('DELETE FROM bookings WHERE route_id IN (SELECT id FROM routes WHERE driver_phone LIKE \'+1234567891%\')');
  await pool.query('DELETE FROM routes WHERE driver_phone LIKE \'+1234567891%\'');
  await pool.end();
});

describe('Geospatial Queries Integration Tests', () => {
  describe('GET /api/routes/nearby - Nearby Routes', () => {
    it('should find routes within specified radius', async () => {
      const response = await request(app)
        .get('/api/routes/nearby')
        .query({
          lat: 55.7558,
          lng: 37.6173,
          radius: 5
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // All returned routes should be within radius
      response.body.forEach((route: any) => {
        const distance = calculateDistance(
          55.7558, 37.6173,
          route.origin_lat, route.origin_lng
        );
        expect(distance).toBeLessThanOrEqual(5);
      });
    });

    it('should not find routes outside specified radius', async () => {
      const response = await request(app)
        .get('/api/routes/nearby')
        .query({
          lat: 55.7558,
          lng: 37.6173,
          radius: 0.1
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      // Should find very few or no routes in such small radius
      response.body.forEach((route: any) => {
        const distance = calculateDistance(
          55.7558, 37.6173,
          route.origin_lat, route.origin_lng
        );
        expect(distance).toBeLessThanOrEqual(0.1);
      });
    });

    it('should find routes in different city', async () => {
      const response = await request(app)
        .get('/api/routes/nearby')
        .query({
          lat: 59.9343,
          lng: 30.3351,
          radius: 10
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Should find Saint Petersburg route
      const spbRoute = response.body.find((r: any) => 
        r.origin_address.includes('Saint Petersburg')
      );
      expect(spbRoute).toBeDefined();
    });

    it('should use default radius when not specified', async () => {
      const response = await request(app)
        .get('/api/routes/nearby')
        .query({
          lat: 55.7558,
          lng: 37.6173
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/routes/search - Search with Geospatial Filtering', () => {
    it('should find routes matching origin and destination areas', async () => {
      const response = await request(app)
        .get('/api/routes/search')
        .query({
          origin_lat: 55.7558,
          origin_lng: 37.6173,
          destination_lat: 55.8558,
          destination_lng: 37.7173,
          radius: 5
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        // Routes should have origins near search origin
        response.body.forEach((route: any) => {
          const originDistance = calculateDistance(
            55.7558, 37.6173,
            route.origin_lat, route.origin_lng
          );
          expect(originDistance).toBeLessThanOrEqual(10);
        });
      }
    });

    it('should filter by date when provided', async () => {
      const tomorrow = new Date(Date.now() + 86400000);
      const response = await request(app)
        .get('/api/routes/search')
        .query({
          origin_lat: 55.7558,
          origin_lng: 37.6173,
          destination_lat: 55.8558,
          destination_lng: 37.7173,
          date: tomorrow.toISOString()
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      // All routes should be on or after the specified date
      response.body.forEach((route: any) => {
        const routeDate = new Date(route.departure_time);
        expect(routeDate.getTime()).toBeGreaterThanOrEqual(tomorrow.setHours(0, 0, 0, 0));
      });
    });

    it('should return empty array when no routes match', async () => {
      const response = await request(app)
        .get('/api/routes/search')
        .query({
          origin_lat: 0,
          origin_lng: 0,
          destination_lat: 1,
          destination_lng: 1,
          radius: 1
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('Coordinate Validation', () => {
    it('should reject invalid latitude', async () => {
      const response = await request(app)
        .get('/api/routes/nearby')
        .query({
          lat: 95,
          lng: 37.6173
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid longitude', async () => {
      const response = await request(app)
        .get('/api/routes/nearby')
        .query({
          lat: 55.7558,
          lng: 185
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
