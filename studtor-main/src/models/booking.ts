import { BookingStatus } from '../constant/bookingStatus';

export interface BookingCreateRequest {
  clientId: string;
  vendorId: string;
  profileId?: string;
  syllabusId: string;
  subjectId: string;
  bookingStartDateTime: string;
  bookingEndDateTime: string;
  locationId: string;
}

export interface Booking extends BookingCreateRequest {
  id: string;
  bookingStatus: BookingStatus;
  vendorFullName: string;
  vendorProfilePicS3Key: string;
  clientFullName: string;
}

export interface BookingModifyRequest {
  bookingId: string;
  profileId?: string;
  syllabusId?: string;
  subjectId?: string;
  bookingStartDateTime?: string;
  bookingEndDateTime?: string;
  locationId?: string;
}
