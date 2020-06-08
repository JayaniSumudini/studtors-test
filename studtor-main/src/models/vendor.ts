import {
  ExamResult,
  PreferredSyllabusAndSubjects,
  PreferredSyllabusAndSubjectsResponse,
} from './exam';
import { Gender } from '../constant/gender';
import { LocationCreateRequest, Location, District } from './location';
import { Language } from './language';
import { University } from './university';
import { Nationality } from './nationality';

export interface VendorMain {
  email: string;
  fullName: string;
  contactNumber: string;
  biography: string;
  universityId: string;
  majorInUniversity: string;
  nationalityId: string;
  /**
   * @todo need to set this as required. waiting for FE changes.
   */
  examResults?: ExamResult[];
  languagesSpokenIds: string[];
  preferredDistrictsIds: string[];
  yearsOfExperience: number;
  videoUrl: string;
  zoomId: string;
  zoomPassword: string;
}

export interface Vendor extends VendorMain {
  id: string;
  profilePicS3Key: string;
  certificatesS3Key: string;
  accountStatus: number;
  isNewVendor?: boolean;
  isGoldVendor?: boolean;
  isExpressVendor?: boolean;
  joiningDate: string;
  firstName?: string;
  lastName?: string;
  gender?: Gender;
  preferredSyllabusAndSubjects?: PreferredSyllabusAndSubjects[];
  locationIds?: string[];
  bookingIds?: string[];
}

export interface VendorDetailsResponse {
  id: string;
  email: string;
  fullName: string;
  contactNumber: string;
  biography: string;
  majorInUniversity: string;
  yearsOfExperience: number;
  videoUrl: string;
  profilePicUrl: string;
  isNewVendor?: boolean;
  isGoldVendor?: boolean;
  isExpressVendor?: boolean;
  firstName?: string;
  lastName?: string;
  preferredSyllabusAndSubjects?: PreferredSyllabusAndSubjectsResponse[];
  locations?: Location[];
  gender?: Gender;
  joiningDate: string;
  languagesSpoken: Language[];
  preferredDistricts: District[];
  university: University;
  nationality: Nationality;
  examResults: ExamResult[];
}

export interface VendorDetailsCreateRequest extends VendorMain {
  password: string;
  profilePicBase64: string;
  certificatesBase64: string;
}

export interface VendorEmailMapping {
  email: string;
  id: string;
  password: string;
  otpCode?: string;
}

export interface VendorLoginRequest {
  email: string;
  password: string;
}

export interface VendorLoginResponse {
  email: string;
  id: string;
  token: string;
  fullName: string;
  contactNumber: string;
  profilePicUrl: string;
  firstName?: string;
  lastName?: string;
  gender?: Gender;
}

export interface VendorChangePasswordWhenForgot {
  email: string;
  otpCode: string;
  newPassword: string;
}

export interface VendorDetailsUpdateRequest {
  email?: string;
  id: string;
  firstName?: string;
  lastName?: string;
  gender: Gender;
  nationalityId?: string;
  languagesSpokenIds?: string[];
  preferredSyllabusAndSubjects: PreferredSyllabusAndSubjects[];
  locations?: LocationCreateRequest[];
  universityId?: string;
  majorInUniversity?: string;
  profilePicBase64?: string;
}

export interface VendorDetailsForCard {
  id: string;
  fullName: string;
  profilePicUrl: string;
  preferredSyllabusAndSubjects?: PreferredSyllabusAndSubjectsResponse[];
}
