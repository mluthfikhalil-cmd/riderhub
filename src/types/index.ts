// RiderHub shared domain types

export interface Coord {
  lat: number;
  lng: number;
  speed?: number;
}

export interface Ride {
  id: string;
  user_id?: string;
  title: string;
  distance: string;
  duration: string;
  avg_speed: string;
  max_speed: string;
  date: string;
  route_path?: Coord[] | null;
  created_at?: string;
}

export interface Bike {
  id: string;
  user_id: string;
  brand: string;
  model: string;
  plate_number: string;
  year?: string;
  odometer_km?: number;
  oil_change_km?: number;
  last_service_date?: string;
  is_primary: boolean;
  created_at?: string;
}

export interface Community {
  id: string | number;
  name: string;
  members: string;
  type?: string;
  image?: string;
  posts?: number;
}

export interface Segment {
  id: string;
  name: string;
  city: string;
  distance_km: number;
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
}

export interface SegmentEffort {
  id: string;
  segment_id: string;
  ride_id: string;
  user_id: string;
  user_name: string;
  elapsed_seconds: number;
  avg_speed: number;
  date: string;
}

export interface RideSummaryParams {
  ride: Ride;
  newlyUnlocked?: string[];
}
