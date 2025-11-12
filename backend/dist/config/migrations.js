"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = void 0;
const database_1 = require("./database");
const runMigrations = async () => {
    const client = await database_1.pool.connect();
    try {
        console.log('Running database migrations...');
        // Enable PostGIS extension
        await client.query(`
      CREATE EXTENSION IF NOT EXISTS postgis;
    `);
        // Create routes table
        await client.query(`
      CREATE TABLE IF NOT EXISTS routes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        driver_id VARCHAR(255) NOT NULL,
        driver_name VARCHAR(255) NOT NULL,
        driver_phone VARCHAR(50) NOT NULL,
        driver_vehicle JSONB,
        origin_lat DECIMAL(10, 8) NOT NULL,
        origin_lng DECIMAL(11, 8) NOT NULL,
        origin_address TEXT,
        destination_lat DECIMAL(10, 8) NOT NULL,
        destination_lng DECIMAL(11, 8) NOT NULL,
        destination_address TEXT,
        departure_time TIMESTAMP NOT NULL,
        available_seats INTEGER NOT NULL,
        price_per_km DECIMAL(10, 2) NOT NULL,
        total_distance DECIMAL(10, 2),
        status VARCHAR(50) DEFAULT 'planned',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // Create indexes for routes table
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_routes_departure ON routes(departure_time);
    `);
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_routes_status ON routes(status);
    `);
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_routes_origin ON routes(origin_lat, origin_lng);
    `);
        // Create geospatial index for routes
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_routes_origin_gist 
      ON routes USING GIST (
        ST_MakePoint(origin_lng, origin_lat)
      );
    `);
        // Create bookings table
        await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
        passenger_id VARCHAR(255) NOT NULL,
        passenger_name VARCHAR(255) NOT NULL,
        passenger_phone VARCHAR(50) NOT NULL,
        passenger_comments TEXT,
        pickup_lat DECIMAL(10, 8) NOT NULL,
        pickup_lng DECIMAL(11, 8) NOT NULL,
        pickup_address TEXT,
        dropoff_lat DECIMAL(10, 8) NOT NULL,
        dropoff_lng DECIMAL(11, 8) NOT NULL,
        dropoff_address TEXT,
        distance DECIMAL(10, 2) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'confirmed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // Create indexes for bookings table
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_route ON bookings(route_id);
    `);
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_passenger ON bookings(passenger_id);
    `);
        // Create geospatial indexes for bookings
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_pickup_gist 
      ON bookings USING GIST (
        ST_MakePoint(pickup_lng, pickup_lat)
      );
    `);
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_dropoff_gist 
      ON bookings USING GIST (
        ST_MakePoint(dropoff_lng, dropoff_lat)
      );
    `);
        console.log('Migrations completed successfully');
    }
    catch (error) {
        console.error('Migration error:', error);
        throw error;
    }
    finally {
        client.release();
    }
};
exports.runMigrations = runMigrations;
