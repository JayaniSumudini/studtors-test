import { ClientProfileTypes } from '../constant/clientProfileTypes';

export interface ClientMain {
  email: string;
  fullName: string;
  contactNumber: string;
}

export interface Client extends ClientMain {
  id: string;
  accountStatus: number;
  locationIds?: string[];
  clientProfileType: ClientProfileTypes;
  bookingIds?: string[];
}

export interface ClientDetailsCreateRequest extends ClientMain {
  password: string;
}

export interface ClientDetailsResponse extends ClientMain {
  locationIds?: string[];
  clientProfileType: ClientProfileTypes;
  id: string;
}

export interface ClientEmailMapping {
  email: string;
  id: string;
  password: string;
  otpCode?: string;
  activeToken: string;
  activeExpires: number;
}

export interface ClientLoginRequest {
  email: string;
  password: string;
}

export interface ClientLoginResponse extends ClientMain {
  token: string;
  id: string;
  clientProfileType: ClientProfileTypes;
}

export interface ClientChangePasswordWhenForgot {
  email: string;
  otpCode: string;
  newPassword: string;
}
