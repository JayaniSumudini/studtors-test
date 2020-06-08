import { injectable } from 'inversify';
import { PreferredSyllabusAndSubjects, ExamResult } from '../models/exam';

@injectable()
export class Validation {
  errors: string[] = [];

  public validateRequest(request: any): object {
    for (const key in request) {
      if (key) {
        switch (key) {
          case 'email': {
            if (!this.validEmail(request.email)) this.errors.push('Email Validation Failed');
            break;
          }
          case 'fullName': {
            if (!this.validName(request.fullName)) this.errors.push('FullName Validation Failed');
            break;
          }
          case 'firstName': {
            if (!this.validName(request.firstName)) this.errors.push('FirstName Validation Failed');
            break;
          }
          case 'lastName': {
            if (!this.validName(request.lastName)) this.errors.push('LastName Validation Failed');
            break;
          }
          case 'contactNumber': {
            if (!this.validContactNumber(request.contactNumber))
              this.errors.push('Contact Number Validation Failed');
            break;
          }

          case 'otpCode': {
            if (!this.validOTPCode(request.otpCode)) this.errors.push('OtpCode Validation Failed');
            break;
          }

          case 'universityId': {
            if (!this.validUniversityId(request.universityId))
              this.errors.push('UniversityId Validation Failed');
            break;
          }

          case 'nationalityId': {
            if (!this.validNationalityId(request.nationalityId))
              this.errors.push('NationalityId Validation Failed');
            break;
          }

          case 'languagesSpokenIds': {
            if (!this.validLanguagesSpokenIds(request.languagesSpokenIds))
              this.errors.push('LanguagesSpokenIds Validation Failed');
            break;
          }

          case 'preferredDistrictsIds': {
            if (!this.validPreferredDistrictsIds(request.preferredDistrictsIds))
              this.errors.push('Preferred DistrictsIds Validation Failed');
            break;
          }

          case 'yearsOfExperience': {
            if (!this.validYearsOfExperience(request.yearsOfExperience))
              this.errors.push('yearsOfExperience Validation Failed');
            break;
          }

          case 'profilePicBase64': {
            if (!this.validBase64Image(request.profilePicBase64))
              this.errors.push('profilePicBase64 Validation Failed');
            break;
          }

          case 'certificatesBase64': {
            if (!this.validBase64Image(request.certificatesBase64))
              this.errors.push('certificatesBase64 Validation Failed');
            break;
          }

          case 'distictId': {
            if (!this.validDistictId(request.distictId))
              this.errors.push('distictId Validation Failed');
            break;
          }

          case 'countryId': {
            if (!this.validCountryId(request.countryId))
              this.errors.push('countryId Validation Failed');
            break;
          }

          case 'locationId': {
            if (!this.validLocationId(request.locationId)) {
              this.errors.push('locationId Validation Failed');
            }
            break;
          }

          case 'userId':
          case 'clientId': {
            if (!this.validUserId(request[key])) {
              this.errors.push(`${key} Validation Failed`);
            }
            break;
          }

          case 'vendorId': {
            if (!this.validVendorId(request.vendorId)) {
              this.errors.push('vendorId Validation Failed');
            }
            break;
          }

          case 'latitude': {
            if (!this.validLatitude(request.latitude)) {
              this.errors.push('Latitude Validation Failed');
            }
            break;
          }

          case 'longitude': {
            if (!this.validLongitude(request.longitude)) {
              this.errors.push('Longitude Validation Failed');
            }
            break;
          }

          case 'examId':
          case 'syllabusId': {
            if (!this.validExamId(request[key])) {
              this.errors.push(`${key} Validation Failed`);
            }
            break;
          }

          case 'subjectId': {
            if (!this.validSubjectId(request.subjectId)) {
              this.errors.push('subjectId Validation Failed');
            }
            break;
          }
          case 'preferredSyllabusAndSubjects': {
            if (!this.validPreferredSyllabusAndSubjects(request.preferredSyllabusAndSubjects)) {
              this.errors.push('Preferred Syllabus And Subjects Validation Failed');
            }
            break;
          }

          case 'examResults': {
            if (!this.validExamResults(request.examResults)) {
              this.errors.push('examResults Validation Failed');
            }
            break;
          }
          case 'bookingId': {
            if (!this.validBookingId(request.bookingId)) {
              this.errors.push('bookingId Validation Failed');
            }
            break;
          }
        }
      }
    }

    return this.errors.length ? this.errors : null;
  }

  private validEmail(email: string): boolean {
    // email validation from https://emailregex.com/
    const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return email && regex.test(email.toLowerCase());
  }

  private validName(fullName: string): boolean {
    const regex = /^[a-zA-Z ]{2,30}$/;
    return fullName && regex.test(fullName.trim());
  }

  private validContactNumber(contactNumber: string): boolean {
    // need to change according to HK contact number
    const regex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return contactNumber && regex.test(contactNumber);
  }

  private validOTPCode(otpCode: string): boolean {
    const regex = /^\d{6}$/;
    return otpCode && regex.test(otpCode);
  }

  private validUniversityId(universityId: string): boolean {
    return universityId && universityId.endsWith('_university');
  }

  private validNationalityId(nationalityId: string): boolean {
    return nationalityId && nationalityId.endsWith('_nationality');
  }

  private validLanguagesSpokenIds(languagesSpokenIds: string[]): boolean {
    const wrongIds = languagesSpokenIds.filter((languagesSpokenId) => {
      if (!(languagesSpokenId && languagesSpokenId.endsWith('_language'))) {
        return languagesSpokenId;
      }
    });
    return wrongIds.length === 0;
  }

  private validPreferredDistrictsIds(preferredDistrictsIds: string[]): boolean {
    const wrongIds = preferredDistrictsIds.filter((preferredDistrictsId) => {
      if (!this.validDistictId(preferredDistrictsId)) {
        return preferredDistrictsId;
      }
    });
    return wrongIds.length === 0;
  }

  private validYearsOfExperience(yearsOfExperience: number): boolean {
    return yearsOfExperience && !isNaN(yearsOfExperience);
  }

  private validBase64Image(base64Image: string): boolean {
    const regex = /^data:image\/(?:gif|png|jpeg|bmp|webp)(?:;charset=utf-8)?;base64,(?:[A-Za-z0-9]|[+/])+={0,2}/;
    return base64Image && regex.test(base64Image);
  }

  private validDistictId(distictId: any): boolean {
    return distictId && distictId.endsWith('_district');
  }

  private validCountryId(countryId: any): boolean {
    return countryId && countryId.endsWith('_country');
  }

  private validLocationId(locationId: any): boolean {
    return locationId && locationId.endsWith('_location');
  }

  private validUserId(userId: any): boolean {
    return userId && userId.endsWith('_client');
  }

  private validVendorId(vendorId: any): boolean {
    return vendorId && vendorId.endsWith('_vendor');
  }

  private validLatitude(latitude: number): boolean {
    return isFinite(latitude) && Math.abs(latitude) <= 90;
  }

  private validLongitude(longitude: number): boolean {
    return isFinite(longitude) && Math.abs(longitude) <= 180;
  }

  private validExamId(examId: any): boolean {
    return examId && examId.endsWith('_exam');
  }

  private validSubjectId(subjectId: any): boolean {
    return subjectId && subjectId.endsWith('_subject');
  }

  private validBookingId(bookingId: any): boolean {
    return bookingId && bookingId.endsWith('_booking');
  }

  private validPreferredSyllabusAndSubjects(
    preferredSyllabusAndSubjects: PreferredSyllabusAndSubjects[],
  ): boolean {
    const wrongIds: string[] = [];

    preferredSyllabusAndSubjects.forEach((preferredSyllabusAndSubject) => {
      if (!this.validExamId(preferredSyllabusAndSubject.syllabusId)) {
        wrongIds.push(preferredSyllabusAndSubject.syllabusId);
      } else {
        preferredSyllabusAndSubject.subjectIds.forEach((subjectId) => {
          if (!this.validSubjectId(subjectId)) {
            wrongIds.push(subjectId);
          }
        });
      }
    });

    return wrongIds.length === 0;
  }

  private validExamResults(examResults: ExamResult[]): boolean {
    const wrongIds: string[] = [];

    examResults.forEach((examResult) => {
      if (!this.validExamId(examResult.examId)) {
        wrongIds.push(examResult.examId);
      } else {
        examResult.subjectResults.forEach((subjectResult) => {
          if (!this.validSubjectId(subjectResult.subjectId)) {
            wrongIds.push(subjectResult.subjectId);
          }
        });
      }
    });
    return wrongIds.length === 0;
  }
}
