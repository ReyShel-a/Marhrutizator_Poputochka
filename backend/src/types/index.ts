export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface VehicleInfo {
  make: string;
  model: string;
  color: string;
  licensePlate: string;
}

export interface RouteModel {
  id: string;
  driver_id: string;
  driver_name: string;
  driver_phone: string;
  driver_vehicle: VehicleInfo;
  origin_lat: number;
  origin_lng: number;
  origin_address?: string;
  destination_lat: number;
  destination_lng: number;
  destination_address?: string;
  departure_time: Date;
  available_seats: number;
  price_per_km: number;
  total_distance?: number;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}

export interface CreateRouteInput {
  driver_id: string;
  driver_name: string;
  driver_phone: string;
  driver_vehicle: VehicleInfo;
  origin_lat: number;
  origin_lng: number;
  origin_address?: string;
  destination_lat: number;
  destination_lng: number;
  destination_address?: string;
  departure_time: Date;
  available_seats: number;
  price_per_km: number;
  total_distance?: number;
}

export interface UpdateRouteInput {
  departure_time?: Date;
  available_seats?: number;
  price_per_km?: number;
  status?: 'planned' | 'active' | 'completed' | 'cancelled';
}

export interface BookingModel {
  id: string;
  route_id: string;
  passenger_id: string;
  passenger_name: string;
  passenger_phone: string;
  passenger_comments?: string;
  pickup_lat: number;
  pickup_lng: number;
  pickup_address?: string;
  dropoff_lat: number;
  dropoff_lng: number;
  dropoff_address?: string;
  distance: number;
  price: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}

export interface CreateBookingInput {
  route_id: string;
  passenger_id: string;
  passenger_name: string;
  passenger_phone: string;
  passenger_comments?: string;
  pickup_lat: number;
  pickup_lng: number;
  pickup_address?: string;
  dropoff_lat: number;
  dropoff_lng: number;
  dropoff_address?: string;
  distance: number;
  price: number;
}

export interface UpdateBookingInput {
  status?: 'pending' | 'confirmed' | 'cancelled';
  passenger_comments?: string;
}

export interface SearchRoutesParams {
  origin_lat: number;
  origin_lng: number;
  destination_lat: number;
  destination_lng: number;
  date?: Date;
  radius?: number;
}

export interface NearbyRoutesParams {
  lat: number;
  lng: number;
  radius?: number;
}
