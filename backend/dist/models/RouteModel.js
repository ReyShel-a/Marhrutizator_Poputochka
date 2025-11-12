"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeRepository = exports.RouteRepository = void 0;
const database_1 = require("../config/database");
class RouteRepository {
    async create(data) {
        const result = await (0, database_1.query)(`INSERT INTO routes (
        driver_id, driver_name, driver_phone, driver_vehicle,
        origin_lat, origin_lng, origin_address,
        destination_lat, destination_lng, destination_address,
        departure_time, available_seats, price_per_km, total_distance
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`, [
            data.driver_id,
            data.driver_name,
            data.driver_phone,
            JSON.stringify(data.driver_vehicle),
            data.origin_lat,
            data.origin_lng,
            data.origin_address,
            data.destination_lat,
            data.destination_lng,
            data.destination_address,
            data.departure_time,
            data.available_seats,
            data.price_per_km,
            data.total_distance,
        ]);
        return this.mapRow(result.rows[0]);
    }
    async findById(id) {
        const result = await (0, database_1.query)('SELECT * FROM routes WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return null;
        }
        return this.mapRow(result.rows[0]);
    }
    async update(id, data) {
        const fields = [];
        const values = [];
        let paramCount = 1;
        if (data.departure_time !== undefined) {
            fields.push(`departure_time = $${paramCount++}`);
            values.push(data.departure_time);
        }
        if (data.available_seats !== undefined) {
            fields.push(`available_seats = $${paramCount++}`);
            values.push(data.available_seats);
        }
        if (data.price_per_km !== undefined) {
            fields.push(`price_per_km = $${paramCount++}`);
            values.push(data.price_per_km);
        }
        if (data.status !== undefined) {
            fields.push(`status = $${paramCount++}`);
            values.push(data.status);
        }
        if (fields.length === 0) {
            return this.findById(id);
        }
        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        const result = await (0, database_1.query)(`UPDATE routes SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`, values);
        if (result.rows.length === 0) {
            return null;
        }
        return this.mapRow(result.rows[0]);
    }
    async delete(id) {
        const result = await (0, database_1.query)('DELETE FROM routes WHERE id = $1', [id]);
        return (result.rowCount ?? 0) > 0;
    }
    async search(params) {
        const radius = params.radius || 20; // Default 20 km
        let queryText = `
      SELECT * FROM routes
      WHERE status = 'planned'
      AND ST_DWithin(
        ST_MakePoint(origin_lng, origin_lat)::geography,
        ST_MakePoint($1, $2)::geography,
        $3
      )
      AND ST_DWithin(
        ST_MakePoint(destination_lng, destination_lat)::geography,
        ST_MakePoint($4, $5)::geography,
        $3
      )
    `;
        const queryParams = [
            params.origin_lng,
            params.origin_lat,
            radius * 1000, // Convert km to meters
            params.destination_lng,
            params.destination_lat,
        ];
        if (params.date) {
            queryText += ` AND DATE(departure_time) = DATE($6)`;
            queryParams.push(params.date);
        }
        queryText += ` ORDER BY departure_time ASC`;
        const result = await (0, database_1.query)(queryText, queryParams);
        return result.rows.map(row => this.mapRow(row));
    }
    async findNearby(params) {
        const radius = params.radius || 20; // Default 20 km
        const result = await (0, database_1.query)(`SELECT * FROM routes
       WHERE status IN ('planned', 'active')
       AND ST_DWithin(
         ST_MakePoint(origin_lng, origin_lat)::geography,
         ST_MakePoint($1, $2)::geography,
         $3
       )
       ORDER BY 
         ST_Distance(
           ST_MakePoint(origin_lng, origin_lat)::geography,
           ST_MakePoint($1, $2)::geography
         ) ASC
       LIMIT 50`, [params.lng, params.lat, radius * 1000]);
        return result.rows.map(row => this.mapRow(row));
    }
    mapRow(row) {
        return {
            id: row.id,
            driver_id: row.driver_id,
            driver_name: row.driver_name,
            driver_phone: row.driver_phone,
            driver_vehicle: typeof row.driver_vehicle === 'string'
                ? JSON.parse(row.driver_vehicle)
                : row.driver_vehicle,
            origin_lat: parseFloat(row.origin_lat),
            origin_lng: parseFloat(row.origin_lng),
            origin_address: row.origin_address,
            destination_lat: parseFloat(row.destination_lat),
            destination_lng: parseFloat(row.destination_lng),
            destination_address: row.destination_address,
            departure_time: new Date(row.departure_time),
            available_seats: parseInt(row.available_seats),
            price_per_km: parseFloat(row.price_per_km),
            total_distance: row.total_distance ? parseFloat(row.total_distance) : undefined,
            status: row.status,
            created_at: new Date(row.created_at),
            updated_at: new Date(row.updated_at),
        };
    }
}
exports.RouteRepository = RouteRepository;
exports.routeRepository = new RouteRepository();
