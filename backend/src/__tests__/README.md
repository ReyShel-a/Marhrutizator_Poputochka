# Backend Integration Tests

This directory contains integration tests for the API endpoints.

## Prerequisites

Before running the tests, ensure you have:

1. **PostgreSQL database running** on `localhost:5432`
2. **Database configured** with the connection details in `.env` file
3. **Database schema created** by running migrations:
   ```bash
   npm run migrate
   ```

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch
```

## Test Structure

### routes.test.ts
Tests for route endpoints:
- POST /api/routes - Create route
- GET /api/routes/:id - Get route by ID
- PUT /api/routes/:id - Update route
- DELETE /api/routes/:id - Delete route
- GET /api/routes/search - Search routes
- GET /api/routes/nearby - Get nearby routes

### bookings.test.ts
Tests for booking endpoints:
- POST /api/bookings - Create booking
- GET /api/bookings/:id - Get booking by ID
- PUT /api/bookings/:id - Update booking
- DELETE /api/bookings/:id - Delete booking
- GET /api/bookings/route/:routeId - Get bookings by route

### geospatial.test.ts
Tests for geospatial queries:
- Nearby routes with radius filtering
- Search with geospatial filtering
- Coordinate validation
- Distance calculations

## Test Data

Tests use phone numbers starting with `+1234567890` and `+1234567891` for test data, which is automatically cleaned up after each test suite.

## Notes

- Tests require a real database connection (not mocked)
- Each test suite cleans up its own test data
- Tests validate real functionality including database operations
- Geospatial tests verify distance calculations and coordinate validation
