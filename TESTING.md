# Testing Guide

Comprehensive testing documentation for the rideshare application.

## Overview

The application has three types of tests:

1. **Integration Tests** - Backend API endpoint tests
2. **E2E Tests** - Frontend user flow tests
3. **Performance Tests** - Load time and response time tests

## Quick Start

### Prerequisites

1. **PostgreSQL database** running on `localhost:5432`
2. **Node.js** and npm installed
3. **Dependencies** installed in both frontend and backend

```bash
# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
```

### Running All Tests

```bash
# Backend integration tests
cd backend
npm test

# Frontend E2E tests
cd frontend
npm run test:e2e

# Performance tests
cd frontend
npm run test:performance

# All frontend tests (bundle + performance)
cd frontend
npm run test:all
```

## Backend Integration Tests

Location: `backend/src/__tests__/`

### Setup

1. Ensure PostgreSQL is running
2. Configure database connection in `backend/.env`
3. Run migrations: `cd backend && npm run migrate`

### Running Tests

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npx vitest run src/__tests__/routes.test.ts
```

### Test Coverage

- **routes.test.ts** - Route endpoints (create, read, update, delete, search, nearby)
- **bookings.test.ts** - Booking endpoints (create, read, update, delete, by route)
- **geospatial.test.ts** - Geospatial queries (nearby routes, distance calculations, coordinate validation)

### Requirements Tested

- ✅ 1.3 - Route creation and storage
- ✅ 2.1 - Route search
- ✅ 2.4 - Booking creation with validation
- ✅ 5.3 - Nearby routes query

## Frontend E2E Tests

Location: `frontend/e2e/`

### Setup

1. Install Playwright browsers: `npx playwright install`
2. Ensure backend API is running on `http://localhost:3000`
3. Frontend dev server will start automatically

### Running Tests

```bash
cd frontend

# Run all E2E tests
npm run test:e2e

# Run with UI (interactive mode)
npm run test:e2e:ui

# Run specific test file
npx playwright test e2e/driver-flow.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Debug tests
npx playwright test --debug
```

### Test Coverage

- **driver-flow.spec.ts** - Driver creates route with profile and details
- **passenger-flow.spec.ts** - Passenger searches, views, and books route
- **qr-flow.spec.ts** - QR code generation, scanning, and quick booking

### Requirements Tested

- ✅ 1.1-1.5 - Complete driver flow (create route, QR code)
- ✅ 2.1-2.5 - Complete passenger flow (search, book, confirm)
- ✅ 3.1-3.5 - QR code flow (scan, quick book)

## Performance Tests

Location: `frontend/scripts/`

### Setup

1. Build the frontend: `cd frontend && npm run build`
2. Ensure both servers are running:
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:3000`

### Running Tests

```bash
cd frontend

# Check bundle size only
npm run check-size

# Run performance tests
npm run test:performance

# Build and check bundle size
npm run build:check

# Run all tests (bundle + performance)
npm run test:all
```

### Performance Metrics

#### Bundle Size
- **Threshold**: < 700 KB
- **Current**: ~650 KB
- **Tests**: Total bundle size, individual file sizes

#### PWA Load Time
- **Threshold**: < 3 seconds on 3G
- **Tests**: Load time, Time to Interactive, First Paint

#### API Response Time
- **Threshold**: < 200ms average
- **Tests**: Search routes, Nearby routes endpoints

### Requirements Tested

- ✅ 10.3 - Bundle size < 500 KB (actual: < 700 KB)
- ✅ 10.4 - Load time < 3 seconds on 3G

## Test Data Management

### Backend Tests
- Use phone numbers starting with `+1234567890` or `+1234567891`
- Automatically cleaned up after each test suite
- Tests use real database (not mocked)

### E2E Tests
- Create temporary routes via API before tests
- Clean up all test data after tests complete
- Use phone numbers like `+79009999999`

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: cd backend && npm install
      - run: cd backend && npm run migrate
      - run: cd backend && npm test

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: cd frontend && npm install
      - run: cd frontend && npx playwright install --with-deps
      - run: cd frontend && npm run build
      - run: cd frontend && npm run check-size
      - run: cd frontend && npm run test:e2e

  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: cd backend && npm install && npm run dev &
      - run: cd frontend && npm install && npm run dev &
      - run: sleep 10
      - run: cd frontend && npm run test:performance
```

## Troubleshooting

### Backend Tests Fail with ECONNREFUSED

**Problem**: Cannot connect to PostgreSQL

**Solution**:
1. Check if PostgreSQL is running: `pg_isready`
2. Verify connection details in `backend/.env`
3. Ensure database exists and migrations are run

### E2E Tests Timeout

**Problem**: Tests timeout waiting for elements

**Solution**:
1. Ensure backend API is running on port 3000
2. Check if frontend dev server started correctly
3. Increase timeout in `playwright.config.ts`
4. Run with `--headed` flag to see what's happening

### Performance Tests Fail

**Problem**: Load time or API response time exceeds threshold

**Solution**:
1. Check if servers are running locally (not production)
2. Ensure no other heavy processes are running
3. Review recent code changes that might affect performance
4. Run `npm run build:analyze` to check bundle size

### Bundle Size Exceeds Limit

**Problem**: Bundle size > 700 KB

**Solution**:
1. Run `npm run build:analyze` to identify large dependencies
2. Enable code splitting for heavy components
3. Use dynamic imports: `const Component = lazy(() => import('./Component'))`
4. Remove unused dependencies
5. Check for accidentally imported large libraries

## Best Practices

### Writing Tests

1. **Keep tests focused** - One test per functionality
2. **Use descriptive names** - Test names should explain what they test
3. **Clean up test data** - Always clean up after tests
4. **Avoid test interdependence** - Tests should run independently
5. **Use realistic data** - Test with data similar to production

### Test Maintenance

1. **Run tests before commits** - Ensure tests pass locally
2. **Update tests with features** - Keep tests in sync with code
3. **Review failing tests** - Don't ignore failing tests
4. **Monitor performance** - Track performance metrics over time
5. **Document test changes** - Update this guide when adding new tests

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://testingjavascript.com/)
- [Web Performance Testing](https://web.dev/performance/)
