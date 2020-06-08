import { LocationTypes } from '../constant/locationTypes';

export interface LocationCreateRequest {
  latitude?: number;
  longitude?: number;
  address?: string;
  locationType: LocationTypes;
  additionalInformation?: string;
}

export interface Location extends LocationCreateRequest {
  id: string;
  userId: string;
  zoomId?: String;
}

export interface District {
  district: string;
  id: string;
}
