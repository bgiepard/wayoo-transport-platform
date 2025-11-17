// Types for TransportConnect MVP

export type UserRole = 'passenger' | 'carrier' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  avatar?: string;
}

export interface Location {
  address: string;
  city: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export type RequestStatus = 'active' | 'offers_received' | 'booked' | 'completed' | 'cancelled';

export interface TransportRequest {
  id: string;
  userId: string;
  status: RequestStatus;
  from: Location;
  to: Location;
  departureDate: Date;
  returnDate?: Date;
  isRoundTrip: boolean;
  passengerCount: number;
  luggageInfo?: string;
  specialRequirements?: string;
  budget?: {
    min?: number;
    max?: number;
    currency: string;
  };
  viewCount: number;
  offerCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Carrier {
  id: string;
  userId: string;
  companyName: string;
  rating: number;
  reviewCount: number;
  description?: string;
  logo?: string;
}

export type VehicleType = 'minibus' | 'bus' | 'coach' | 'van';

export interface Vehicle {
  id: string;
  carrierId: string;
  type: VehicleType;
  brand: string;
  model: string;
  capacity: number;
  features: string[];
  images: string[];
}

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export interface Offer {
  id: string;
  requestId: string;
  carrierId: string;
  vehicleId: string;
  status: OfferStatus;
  price: number;
  currency: string;
  description?: string;
  includedServices: string[];
  proposedDeparture: Date;
  proposedReturn?: Date;
  estimatedDuration: number;
  validUntil: Date;
  createdAt: Date;
}

export interface Review {
  id: string;
  carrierId: string;
  userId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}
