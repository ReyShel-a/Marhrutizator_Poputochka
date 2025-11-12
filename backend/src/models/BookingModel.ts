import { query } from '../config/database';
import { BookingModel, CreateBookingInput, UpdateBookingInput } from '../types';

export class BookingRepository {
  async create(data: CreateBookingInput): Promise<BookingModel> {
    const result = await query(
      `INSERT INTO bookings (
        route_id, passenger_id, passenger_name, passenger_phone, passenger_comments,
        pickup_lat, pickup_lng, pickup_address,
        dropoff_lat, dropoff_lng, dropoff_address,
        distance, price
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        data.route_id,
        data.passenger_id,
        data.passenger_name,
        data.passenger_phone,
        data.passenger_comments,
        data.pickup_lat,
        data.pickup_lng,
        data.pickup_address,
        data.dropoff_lat,
        data.dropoff_lng,
        data.dropoff_address,
        data.distance,
        data.price,
      ]
    );
    
    return this.mapRow(result.rows[0]);
  }

  async findById(id: string): Promise<BookingModel | null> {
    const result = await query(
      'SELECT * FROM bookings WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRow(result.rows[0]);
  }

  async update(id: string, data: UpdateBookingInput): Promise<BookingModel | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(data.status);
    }
    if (data.passenger_comments !== undefined) {
      fields.push(`passenger_comments = $${paramCount++}`);
      values.push(data.passenger_comments);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE bookings SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRow(result.rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM bookings WHERE id = $1',
      [id]
    );
    
    return (result.rowCount ?? 0) > 0;
  }

  async findByRouteId(routeId: string): Promise<BookingModel[]> {
    const result = await query(
      `SELECT * FROM bookings 
       WHERE route_id = $1 
       AND status != 'cancelled'
       ORDER BY created_at ASC`,
      [routeId]
    );
    
    return result.rows.map(row => this.mapRow(row));
  }

  async findByPassengerId(passengerId: string): Promise<BookingModel[]> {
    const result = await query(
      `SELECT * FROM bookings 
       WHERE passenger_id = $1 
       ORDER BY created_at DESC`,
      [passengerId]
    );
    
    return result.rows.map(row => this.mapRow(row));
  }

  async countByRouteId(routeId: string): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE route_id = $1 
       AND status = 'confirmed'`,
      [routeId]
    );
    
    return parseInt(result.rows[0].count);
  }

  private mapRow(row: any): BookingModel {
    return {
      id: row.id,
      route_id: row.route_id,
      passenger_id: row.passenger_id,
      passenger_name: row.passenger_name,
      passenger_phone: row.passenger_phone,
      passenger_comments: row.passenger_comments,
      pickup_lat: parseFloat(row.pickup_lat),
      pickup_lng: parseFloat(row.pickup_lng),
      pickup_address: row.pickup_address,
      dropoff_lat: parseFloat(row.dropoff_lat),
      dropoff_lng: parseFloat(row.dropoff_lng),
      dropoff_address: row.dropoff_address,
      distance: parseFloat(row.distance),
      price: parseFloat(row.price),
      status: row.status,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }
}

export const bookingRepository = new BookingRepository();
