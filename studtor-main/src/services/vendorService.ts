import { injectable, inject } from 'inversify';
import { DynamoDbAdapterImpl } from '../dependency/database/dynamoDb/dynamoDbAdapterImpl';
import { TableTypes, DetailTypes } from '../constant/tableNames';
import { AccountStatus } from '../constant/accountStatus';
import { CustomResponseBuilder, CustomResponse } from '../dependency/customResponse';
import {
  VendorDetailsCreateRequest,
  VendorEmailMapping,
  Vendor,
  VendorLoginRequest,
  VendorDetailsResponse,
  VendorChangePasswordWhenForgot,
  VendorDetailsUpdateRequest,
  VendorDetailsForCard,
  VendorLoginResponse,
} from '../models/vendor';
import { S3FileHandlerImpl } from '../dependency/fileHandler/s3FileHandler/s3FileHandlerImpl';
import { sign } from 'jsonwebtoken';
import { Validation } from '../util/validation';
import DIContainer from '../di-container';
import { ContactNumberMapping } from '../models/contactNumberMapping';
import { DbOperations } from '../constant/dbOperations';
import { ItemResponseList, ItemResponse } from 'aws-sdk/clients/dynamodb';
import { OTPcodeGenerator } from '../dependency/otpCodeGenerator';
import { SesMailHandlerImpl } from '../dependency/mailservice/ses/SesMailHandlerImpl';
import { EmailTypes } from '../constant/emailTypes';
import { Location } from '../models/location';
import { DbParam } from '../models/dbParam';
import { PreferredSyllabusAndSubjectsResponse } from '../models/exam';
import { University } from '../models/university';
import { Nationality } from '../models/nationality';

import moment = require('moment');
import { CommonUtil } from '../util/commonUtil';
import { ElasticSearchAdapterImpl } from '../dependency/database/elasticSearch/elasticSearchAdapterImpl';
import { QueryFilters } from '../models/apiResponse';
const secret = process.env.JWT_SECRET || 'my@#$secret';

@injectable()
export class VendorService {
  private db: DynamoDbAdapterImpl;
  private fileHandler: S3FileHandlerImpl;
  private mailHandler: SesMailHandlerImpl;
  private elasticSearch: ElasticSearchAdapterImpl;

  private validation: Validation = DIContainer.resolve<Validation>(Validation);
  private commonUtil: CommonUtil = DIContainer.resolve<CommonUtil>(CommonUtil);

  private otpCodeGenerator: OTPcodeGenerator = DIContainer.resolve<OTPcodeGenerator>(
    OTPcodeGenerator,
  );

  constructor(
    @inject(DynamoDbAdapterImpl) dbAdapter: DynamoDbAdapterImpl,
    @inject(S3FileHandlerImpl) imageUploader: S3FileHandlerImpl,
    @inject(SesMailHandlerImpl) mailHandler: SesMailHandlerImpl,
    @inject(ElasticSearchAdapterImpl) elasticSearch: ElasticSearchAdapterImpl,
  ) {
    this.db = dbAdapter;
    this.fileHandler = imageUploader;
    this.mailHandler = mailHandler;
    this.elasticSearch = elasticSearch;
  }

  public async createVendor(newVendorDetails: VendorDetailsCreateRequest): Promise<CustomResponse> {
    const validationErrors = this.validation.validateRequest(newVendorDetails);

    if (validationErrors) {
      return new Promise((resolve, reject) => {
        reject(
          new CustomResponseBuilder()
            .status(422)
            .message('Validation Failed')
            .errors(validationErrors)
            .build(),
        );
      });
    }

    const {
      password,
      biography,
      universityId,
      majorInUniversity,
      nationalityId,
      examResults,
      languagesSpokenIds,
      preferredDistrictsIds,
      yearsOfExperience,
      profilePicBase64,
      videoUrl,
      certificatesBase64,
      zoomId,
      zoomPassword,
    } = newVendorDetails;

    const email: string = newVendorDetails.email.toLowerCase().trim();
    const fullName: string = newVendorDetails.fullName.trim();
    const contactNumber: string = newVendorDetails.contactNumber.replace(/\D/g, '');

    const responses: ItemResponseList = await this.db
      .transactGetItems([
        {
          tableName: TableTypes.VENDOR_EMAIL_MAPPING,
          values: { email },
        },
        {
          tableName: TableTypes.CONTACT_NUMBER_MAPPING,
          values: { contactNumber },
        },
      ])
      .then((responses: ItemResponseList) => responses)
      .catch(
        (error) =>
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(500).message(error.message).build());
          }),
      );

    if (responses[0].Item) {
      return new Promise((resolve, reject) => {
        reject(new CustomResponseBuilder().status(422).message('Vendor Already Exists').build());
      });
    } else if (responses[1].Item) {
      return new Promise((resolve, reject) => {
        reject(
          new CustomResponseBuilder().status(422).message('Contact number already used').build(),
        );
      });
    }

    let id: string;

    await this.db
      .getId(TableTypes.VENDOR_DETAILS)
      .then((result) => (id = `${result.id}_vendor`))
      .catch(
        (error) =>
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(500).message(error.message).build());
          }),
      );

    let profilePicS3Key: string;

    await this.fileHandler
      .uploadImage(profilePicBase64, id, 'profilePic')
      .then((data) => {
        profilePicS3Key = data;
      })
      .catch(
        (error) =>
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(500).message(error.message).build());
          }),
      );

    let certificatesS3Key: string;

    await this.fileHandler
      .uploadImage(certificatesBase64, id, 'certificate')
      .then((data) => {
        certificatesS3Key = data;
      })
      .catch(
        (error) =>
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(500).message(error.message).build());
          }),
      );

    /**
     * @todo need to set AccountStatus to PENDING.
     * after create admin panel.
     */
    const accountStatus: AccountStatus = AccountStatus.ACTIVATED;

    const vendorEmailMappingParam: VendorEmailMapping = {
      email,
      id,
      password,
    };

    const contactNumberMappingParam: ContactNumberMapping = {
      contactNumber,
      id,
    };
    const newVendor: Vendor = {
      id,
      email,
      fullName,
      contactNumber,
      biography,
      universityId,
      majorInUniversity,
      nationalityId,
      examResults,
      languagesSpokenIds,
      preferredDistrictsIds,
      yearsOfExperience,
      profilePicS3Key,
      videoUrl,
      certificatesS3Key,
      accountStatus,
      zoomId,
      zoomPassword,
      joiningDate: new Date().toISOString(),
    };

    return this.mailHandler
      .sendMail(email, fullName, '', '', EmailTypes.ACCOUNT_REGISTRATION_VENDOR)
      .then(async (result) => {
        return await this.db
          .transactWriteItems([
            {
              tableName: TableTypes.VENDOR_EMAIL_MAPPING,
              values: vendorEmailMappingParam,
              dbOperation: DbOperations.PUT,
            },
            {
              tableName: TableTypes.CONTACT_NUMBER_MAPPING,
              values: contactNumberMappingParam,
              dbOperation: DbOperations.PUT,
            },
            {
              tableName: TableTypes.VENDOR_DETAILS,
              values: newVendor,
              dbOperation: DbOperations.PUT,
            },
          ])
          .then((result) =>
            new CustomResponseBuilder().status(201).message('Vender Registration Success').build(),
          )
          .catch((error) => new CustomResponseBuilder().status(500).message(error.message).build());
      })
      .catch((error) => new CustomResponseBuilder().status(500).message(error.message).build());
  }

  public async loginVendor(vendorLoginDetails: VendorLoginRequest): Promise<CustomResponse> {
    const validationErrors = this.validation.validateRequest(vendorLoginDetails);

    if (validationErrors) {
      return new Promise((resolve, reject) => {
        reject(
          new CustomResponseBuilder()
            .status(422)
            .message('Validation Failed')
            .errors(validationErrors)
            .build(),
        );
      });
    }

    const { password } = vendorLoginDetails;
    const email = vendorLoginDetails.email.toLowerCase().trim();

    let vendor: VendorEmailMapping;

    await this.db
      .getItem(TableTypes.VENDOR_EMAIL_MAPPING, {
        email,
      })
      .then((result) => (vendor = result))
      .catch(
        (error) =>
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(500).message(error.message).build());
          }),
      );

    if (!vendor) {
      return new Promise((resolve, reject) => {
        reject(new CustomResponseBuilder().status(422).message('User Not Registed').build());
      });
    } else {
      let vendorDetails: Vendor;
      await this.db
        .getItem(TableTypes.VENDOR_DETAILS, {
          id: vendor.id,
        })
        .then((result) => (vendorDetails = result))
        .catch(
          (error) =>
            new Promise((resolve, reject) => {
              reject(new CustomResponseBuilder().status(500).message(error.message).build());
            }),
        );

      const {
        email,
        id,
        fullName,
        contactNumber,
        firstName,
        lastName,
        gender,
        accountStatus,
        profilePicS3Key,
      } = vendorDetails;

      if (accountStatus === AccountStatus.PENDING) {
        return new Promise((resolve, reject) => {
          reject(new CustomResponseBuilder().status(422).message('Account Not Activated').build());
        });
      }

      if (this.commonUtil.compareToString(password, vendor.password)) {
        const token = sign(
          {
            _id: vendor.id,
            _email: vendor.email,
            scopes: ['vendor:access'],
          },
          secret,
          { expiresIn: '6h' },
        );

        let profilePicUrl: string;
        await this.getUrl(profilePicS3Key)
          .then((result) => (profilePicUrl = result))
          .catch((err) => err);

        const vendorLoginResponse: VendorLoginResponse = {
          email,
          id,
          token,
          fullName,
          contactNumber,
          profilePicUrl,
          firstName,
          lastName,
          gender,
        };

        return new CustomResponseBuilder()
          .status(200)
          .message('User Login Success')
          .data(vendorLoginResponse)
          .build();
      } else {
        return new Promise((resolve, reject) => {
          reject(new CustomResponseBuilder().status(422).message('Invalid Login').build());
        });
      }
    }
  }

  public async getVendorDetails(request: any, vendorId: string): Promise<CustomResponse> {
    const validationErrors = this.validation.validateRequest(request);

    if (validationErrors) {
      return new Promise((resolve, reject) => {
        reject(
          new CustomResponseBuilder()
            .status(422)
            .message('Validation Failed')
            .errors(validationErrors)
            .build(),
        );
      });
    }

    let vendorDetails: Vendor;
    await this.db
      .getItem(TableTypes.VENDOR_DETAILS, {
        id: vendorId,
      })
      .then((result) => {
        if (result) {
          vendorDetails = result;
        } else {
          return new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(422).message('Vendor not registed').build());
          });
        }
      })
      .catch(
        (error) =>
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(500).message(error.message).build());
          }),
      );

    let vendorDetailsResponse: VendorDetailsResponse;

    await this.createVendorDetailsResponse(vendorDetails)
      .then((result) => (vendorDetailsResponse = result))
      .catch(
        (error) =>
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(500).message(error.message).build());
          }),
      );

    return new CustomResponseBuilder()
      .status(200)
      .message('Get Vendor Details Success')
      .data(vendorDetailsResponse)
      .build();
  }

  /**
   * @todo need to change this end service to get email from jwt token.
   */
  public async vendorAccountDelete(providedEmail: any): Promise<CustomResponse> {
    const email: string = providedEmail.toLowerCase().trim();

    let vendor: VendorEmailMapping;

    await this.db
      .getItem(TableTypes.VENDOR_EMAIL_MAPPING, {
        email,
      })
      .then((result) => (vendor = result))
      .catch(
        (error) =>
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(500).message(error.message).build());
          }),
      );

    let vendorDetails: Vendor;
    await this.db
      .getItem(TableTypes.VENDOR_DETAILS, {
        id: vendor.id,
      })
      .then((result) => (vendorDetails = result))
      .catch(
        (error) =>
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(500).message(error.message).build());
          }),
      );

    const transactWriteItems: DbParam[] = [];

    if (vendorDetails.locationIds) {
      vendorDetails.locationIds.forEach((locationId) => {
        transactWriteItems.push({
          tableName: TableTypes.LOCATION,
          values: { id: locationId, userId: vendor.id },
          dbOperation: DbOperations.DELETE,
        });
      });
    }

    transactWriteItems.push(
      {
        tableName: TableTypes.VENDOR_DETAILS,
        values: { id: vendor.id },
        dbOperation: DbOperations.DELETE,
      },
      {
        tableName: TableTypes.VENDOR_EMAIL_MAPPING,
        values: { email },
        dbOperation: DbOperations.DELETE,
      },
      {
        tableName: TableTypes.CONTACT_NUMBER_MAPPING,
        values: {
          contactNumber: vendorDetails.contactNumber,
        },
        dbOperation: DbOperations.DELETE,
      },
    );
    return this.db
      .transactWriteItems(transactWriteItems)
      .then((result) => new CustomResponseBuilder().status(200).message('Vendor Deleted').build())
      .catch((error) => new CustomResponseBuilder().status(500).message(error.message).build());
  }

  public async vendorForgotPassword(emailProvide: string): Promise<CustomResponse> {
    const email: string = emailProvide.toLowerCase().trim();

    const validationErrors = this.validation.validateRequest(email);

    if (validationErrors) {
      return new Promise((resolve, reject) => {
        reject(
          new CustomResponseBuilder()
            .status(422)
            .message('Validation Failed')
            .errors(validationErrors)
            .build(),
        );
      });
    }

    let vendor: VendorEmailMapping;

    await this.db
      .getItem(TableTypes.VENDOR_EMAIL_MAPPING, {
        email,
      })
      .then((result) => (vendor = result))
      .catch(
        (error) =>
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(500).message(error.message).build());
          }),
      );

    if (vendor) {
      const otpCode: string = this.otpCodeGenerator.generateOTPcode();
      return this.mailHandler
        .sendMail(email, '', otpCode, '', EmailTypes.FORGOT_PASSWORD)
        .then(async (result) => {
          if (result) {
            try {
              const updateResult = await this.db.updateItem(
                TableTypes.VENDOR_EMAIL_MAPPING,
                { email },
                { otpCode },
              );
              if (updateResult) {
                return new CustomResponseBuilder()
                  .status(200)
                  .message('Email Send Success')
                  .build();
              }
            } catch (error) {
              return new CustomResponseBuilder().status(500).message(error.message).build();
            }
          }
        })
        .catch((error) =>
          new CustomResponseBuilder().status(500).message('Can not send the email').build(),
        );
    } else {
      return new Promise((resolve, reject) => {
        reject(new CustomResponseBuilder().status(422).message('User Not Registed').build());
      });
    }
  }

  public async changePasswordWhenForgot(
    changePasswordWhenForgotRequest: VendorChangePasswordWhenForgot,
  ): Promise<CustomResponse> {
    const { otpCode, newPassword } = changePasswordWhenForgotRequest;
    const email: string = changePasswordWhenForgotRequest.email.toLowerCase().trim();

    const validationErrors = this.validation.validateRequest(changePasswordWhenForgotRequest);

    if (validationErrors) {
      return new Promise((resolve, reject) => {
        reject(
          new CustomResponseBuilder()
            .status(422)
            .message('Validation Failed')
            .errors(validationErrors)
            .build(),
        );
      });
    }

    let vendor: VendorEmailMapping;

    await this.db
      .getItem(TableTypes.VENDOR_EMAIL_MAPPING, {
        email,
      })
      .then((result) => (vendor = result))
      .catch(
        (error) =>
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(500).message(error.message).build());
          }),
      );

    if (!vendor) {
      return new Promise((resolve, reject) => {
        reject(new CustomResponseBuilder().status(422).message('User Not Registed').build());
      });
    }

    if (this.commonUtil.compareToString(otpCode, vendor.otpCode)) {
      return this.db
        .updateItem(
          TableTypes.VENDOR_EMAIL_MAPPING,
          { email },
          { password: newPassword, otpCode: '-1' },
        )
        .then((result) =>
          new CustomResponseBuilder().status(200).message('Passowrd Reset Success').build(),
        )
        .catch((error) => new CustomResponseBuilder().status(500).message(error.message).build());
    } else {
      return new Promise((resolve, reject) => {
        reject(
          new CustomResponseBuilder().status(422).message('Provided OTP code Invalid').build(),
        );
      });
    }
  }

  public async updateVendorDetails(
    emailProvide: string,
    vendorDetailsUpdateRequest: VendorDetailsUpdateRequest,
  ): Promise<CustomResponse> {
    const email: string = emailProvide.toLowerCase().trim();

    const validationErrors = this.validation.validateRequest(vendorDetailsUpdateRequest);

    if (validationErrors) {
      return new Promise((resolve, reject) => {
        reject(
          new CustomResponseBuilder()
            .status(422)
            .message('Validation Failed')
            .errors(validationErrors)
            .build(),
        );
      });
    }

    const {
      email: newEmail,
      id,
      firstName,
      lastName,
      gender,
      nationalityId,
      languagesSpokenIds,
      preferredSyllabusAndSubjects,
      locations,
      universityId,
      majorInUniversity,
      profilePicBase64,
    } = vendorDetailsUpdateRequest;

    let vendorDetails: Vendor;
    await this.db
      .getItem(TableTypes.VENDOR_DETAILS, {
        id,
      })
      .then((result) => (vendorDetails = result))
      .catch(
        (error) =>
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(500).message(error.message).build());
          }),
      );

    if (!vendorDetails) {
      return new Promise((resolve, reject) => {
        reject(new CustomResponseBuilder().status(422).message('Vendor not found').build());
      });
    }

    let locationIds: string[];
    const transactWriteItems: DbParam[] = [];

    if (locations) {
      for (const location of locations) {
        let locationId: string;
        await this.db
          .getId(TableTypes.LOCATION)
          .then((result) => (locationId = `${result.id}_location`))
          .catch(
            (error) =>
              new Promise((resolve, reject) => {
                reject(new CustomResponseBuilder().status(500).message(error.message).build());
              }),
          );

        const newLocation: Location = {
          id: locationId,
          userId: id,
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
          locationType: location.locationType,
          additionalInformation: location.additionalInformation,
        };

        locationIds ? locationIds.push(locationId) : (locationIds = [locationId]);

        transactWriteItems.push({
          tableName: TableTypes.LOCATION,
          values: newLocation,
          dbOperation: DbOperations.PUT,
        });
      }

      if (vendorDetails.locationIds) {
        vendorDetails.locationIds.forEach((locationId) => {
          transactWriteItems.push({
            tableName: TableTypes.LOCATION,
            values: { id: locationId, userId: id },
            dbOperation: DbOperations.DELETE,
          });
        });
      }
    }

    let profilePicS3Key: string;

    if (profilePicBase64) {
      await this.fileHandler
        .uploadImage(profilePicBase64, id, 'profilePic')
        .then((data) => {
          profilePicS3Key = data;
        })
        .catch(
          (error) =>
            new Promise((resolve, reject) => {
              reject(new CustomResponseBuilder().status(500).message(error.message).build());
            }),
        );
    }

    if (!this.commonUtil.compareToString(email, newEmail)) {
      let vendor: VendorEmailMapping;

      await this.db
        .getItem(TableTypes.VENDOR_EMAIL_MAPPING, {
          email,
        })
        .then((result) => (vendor = result))
        .catch(
          (error) =>
            new Promise((resolve, reject) => {
              reject(new CustomResponseBuilder().status(500).message(error.message).build());
            }),
        );

      const newVendorDetail = {
        email: newEmail,
        firstName,
        lastName,
        gender,
        nationalityId,
        languagesSpokenIds,
        preferredSyllabusAndSubjects,
        locationIds,
        universityId,
        majorInUniversity,
        profilePicS3Key,
      };

      Object.keys(newVendorDetail).forEach(
        (key) => newVendorDetail[key] === undefined && delete newVendorDetail[key],
      );

      transactWriteItems.push(
        {
          tableName: TableTypes.VENDOR_DETAILS,
          key: { id },
          values: newVendorDetail,
          dbOperation: DbOperations.UPDATE,
        },
        {
          tableName: TableTypes.VENDOR_EMAIL_MAPPING,
          values: { email },
          dbOperation: DbOperations.DELETE,
        },
        {
          tableName: TableTypes.VENDOR_EMAIL_MAPPING,
          values: {
            newEmail,
            id,
            password: vendor.password,
          },
          dbOperation: DbOperations.PUT,
        },
      );

      return this.db
        .transactWriteItems(transactWriteItems)
        .then((result) =>
          new CustomResponseBuilder().status(200).message('Vendor Details Updated').build(),
        )
        .catch((error) => new CustomResponseBuilder().status(500).message(error.message).build());
    } else {
      const newVendorDetail = {
        firstName,
        lastName,
        gender,
        nationalityId,
        languagesSpokenIds,
        preferredSyllabusAndSubjects,
        locationIds,
        universityId,
        majorInUniversity,
        profilePicS3Key,
      };

      Object.keys(newVendorDetail).forEach(
        (key) => newVendorDetail[key] === undefined && delete newVendorDetail[key],
      );

      transactWriteItems.push({
        tableName: TableTypes.VENDOR_DETAILS,
        key: { id },
        values: newVendorDetail,
        dbOperation: DbOperations.UPDATE,
      });

      return this.db
        .transactWriteItems(transactWriteItems)
        .then((result) =>
          new CustomResponseBuilder().status(200).message('Vendor Details Updated').build(),
        )
        .catch((error) => new CustomResponseBuilder().status(500).message(error.message).build());
    }
  }

  public async getAllVendors(
    clientEmail: any,
    itemsPerPage: number,
    lastEvaluatedKey?: string,
  ): Promise<CustomResponse> {
    const data = {
      result: [],
      lastEvaluatedKey: undefined,
    };

    if (lastEvaluatedKey && lastEvaluatedKey.endsWith('_vendor')) {
      return this.db
        .getItemByPagination(TableTypes.VENDOR_DETAILS, itemsPerPage, {
          id: lastEvaluatedKey,
        })
        .then(async (result) => {
          data.lastEvaluatedKey = result.lastEvaluatedKey ? result.lastEvaluatedKey.id : undefined;
          data.result = await this.mapVenderDetailsToVendorDetailsForList(result.data, clientEmail);
          return new CustomResponseBuilder()
            .status(200)
            .message('Get all vendors success')
            .data(data)
            .build();
        })
        .catch((error) => new CustomResponseBuilder().status(500).message(error.message).build());
    } else {
      return this.db
        .getItemByPagination(TableTypes.VENDOR_DETAILS, itemsPerPage)
        .then(async (result) => {
          data.lastEvaluatedKey = result.lastEvaluatedKey ? result.lastEvaluatedKey.id : undefined;
          data.result = await this.mapVenderDetailsToVendorDetailsForList(result.data, clientEmail);

          return new CustomResponseBuilder()
            .status(200)
            .message('Get all vendors success')
            .data(data)
            .build();
        })
        .catch((error) => new CustomResponseBuilder().status(500).message(error.message).build());
    }
  }

  public async getAllBookingDetailsForVendor(vendorId: string): Promise<CustomResponse> {
    let bookingIds: string[];

    await this.db
      .getItem(TableTypes.VENDOR_DETAILS, { id: vendorId })
      .then((result: Vendor) => {
        if (result) {
          bookingIds = result.bookingIds;
        } else {
          return new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(422).message('Vendor not registed').build());
          });
        }
      })
      .catch(
        (error) =>
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(500).message(error.message).build());
          }),
      );

    const transactGetItems: DbParam[] = [];

    if (!bookingIds) {
      return new CustomResponseBuilder()
        .status(200)
        .message('Get Booking details success')
        .data([])
        .build();
    }

    for (const bookingId of bookingIds) {
      if (bookingId) {
        transactGetItems.push({
          tableName: TableTypes.BOOKING,
          values: { id: bookingId },
        });
      }
    }

    const data: any[] = [];
    return await this.db
      .transactGetItems(transactGetItems)
      .then(async (bookingDetails: ItemResponse[]) => {
        for (const bookingDetail of bookingDetails) {
          if (bookingDetail.Item) {
            const {
              syllabusId,
              subjectId,
              locationId,
              vendorProfilePicS3Key,
              ...bookingResponse
            } = bookingDetail.Item;

            let vendorProfilePicUrl;
            await this.getUrl(vendorProfilePicS3Key.toString())
              .then((result) => (vendorProfilePicUrl = result))
              .catch((err) => err);

            if (vendorProfilePicUrl) {
              bookingResponse.vendorProfilePicUrl = vendorProfilePicUrl;
            }

            await this.db
              .transactGetItems([
                {
                  tableName: TableTypes.COMMON_DETAILS,
                  values: { id: syllabusId, detailType: DetailTypes.EXAM },
                },
                {
                  tableName: TableTypes.COMMON_DETAILS,
                  values: { id: subjectId, detailType: DetailTypes.SUBJECT },
                },
                {
                  tableName: TableTypes.LOCATION,
                  values: { id: locationId, userId: bookingResponse.clientId },
                },
              ])
              .then((responses) => {
                if (responses[0]) {
                  delete responses[0].Item.grades;
                  delete responses[0].Item.subjectIds;

                  bookingResponse.syllabus = responses[0].Item;
                }
                if (responses[1]) {
                  bookingResponse.subject = responses[1].Item;
                }
                if (responses[2]) {
                  bookingResponse.location = responses[2].Item;
                }

                data.push(bookingResponse);
              });
          }
        }

        return new CustomResponseBuilder()
          .status(200)
          .message('Get Booking details success')
          .data(this.commonUtil.groupBookingsByDate(data))
          .build();
      })
      .catch((error) => new CustomResponseBuilder().status(500).message(error.message).build());
  }

  public async getVendorLocations(
    providedEmail: string,
    vendorId: string,
  ): Promise<CustomResponse> {
    const email: string = providedEmail.toLowerCase().trim();

    const locationDetails: Location[] = [];
    let locationIds: string[];

    await this.db
      .getItem(TableTypes.VENDOR_DETAILS, {
        id: vendorId,
      })
      .then((result: Vendor) => (locationIds = result.locationIds))
      .catch(
        (error) =>
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(422).message('Vendor not registed').build());
          }),
      );

    if (locationIds) {
      for (const locationId of locationIds) {
        await this.db
          .getItem(TableTypes.LOCATION, {
            id: locationId,
            userId: vendorId,
          })
          .then((result) => {
            if (result) {
              locationDetails.push(result);
            }
          })
          .catch(
            (error) =>
              new Promise((resolve, reject) => {
                reject(new CustomResponseBuilder().status(500).message(error.message).build());
              }),
          );
      }
    }

    return new Promise((resolve, reject) => {
      resolve(
        new CustomResponseBuilder()
          .status(200)
          .message('Get Vendor Locations Success')
          .data(locationDetails)
          .build(),
      );
    });
  }

  public async searchVendors(searchParams: string): Promise<CustomResponse> {
    // var searchParam = 'searchParams?fullname=jayani&yearsOfExperience=4';

    let vendors: any[];
    await this.elasticSearch
      .search(TableTypes.VENDOR_DETAILS, searchParams)
      .then((result) => (vendors = result))
      .catch((error) => {
        console.log(error);
        return new Promise((resolve, reject) => {
          reject(new CustomResponseBuilder().status(422).message('Vendor Search Error').build());
        });
      });

    return new Promise((resolve, reject) => {
      resolve(
        new CustomResponseBuilder()
          .status(200)
          .message('Get Vendor Locations Success')
          .data(vendors)
          .build(),
      );
    });
  }

  private async createVendorDetailsResponse(vendor: Vendor): Promise<VendorDetailsResponse> {
    let profilePicUrl: string;
    const locations: any[] = [];
    const languagesSpoken: any[] = [];
    const preferredDistricts: any[] = [];
    const preferredSyllabusAndSubjects: PreferredSyllabusAndSubjectsResponse[] = [];
    let university: University;
    let nationality: Nationality;

    await this.getUrl(vendor.profilePicS3Key)
      .then((result) => (profilePicUrl = result))
      .catch((err) => err);

    if (vendor.locationIds) {
      const transactGetItems: DbParam[] = [];
      vendor.locationIds.forEach((locationId) => {
        transactGetItems.push({
          tableName: TableTypes.LOCATION,
          values: { id: locationId, userId: vendor.id },
        });
      });

      const responses: ItemResponseList = await this.db
        .transactGetItems(transactGetItems)
        .then((responses: ItemResponseList) => responses)
        .catch(
          (error) =>
            new Promise((resolve, reject) => {
              reject(new CustomResponseBuilder().status(500).message(error.message).build());
            }),
        );

      responses.forEach((response) => {
        locations.push(response.Item);
      });
    }

    if (vendor.languagesSpokenIds) {
      const transactGetItems: DbParam[] = [];
      vendor.languagesSpokenIds.forEach((languagesSpokenId) => {
        transactGetItems.push({
          tableName: TableTypes.COMMON_DETAILS,
          values: { id: languagesSpokenId, detailType: DetailTypes.LANGUAGE.toString() },
        });
      });

      const responses: ItemResponseList = await this.db
        .transactGetItems(transactGetItems)
        .then((responses: ItemResponseList) => responses)
        .catch(
          (error) =>
            new Promise((resolve, reject) => {
              reject(new CustomResponseBuilder().status(500).message(error.message).build());
            }),
        );

      responses.forEach((response) => {
        languagesSpoken.push(response.Item);
      });
    }

    if (vendor.preferredDistrictsIds) {
      const transactGetItems: DbParam[] = [];
      vendor.preferredDistrictsIds.forEach((preferredDistrictsId) => {
        transactGetItems.push({
          tableName: TableTypes.COMMON_DETAILS,
          values: { id: preferredDistrictsId, detailType: DetailTypes.DISTRICT.toString() },
        });
      });

      const responses: ItemResponseList = await this.db
        .transactGetItems(transactGetItems)
        .then((responses: ItemResponseList) => responses)
        .catch(
          (error) =>
            new Promise((resolve, reject) => {
              reject(new CustomResponseBuilder().status(500).message(error.message).build());
            }),
        );

      responses.forEach((response) => {
        preferredDistricts.push(response.Item);
      });
    }

    if (vendor.examResults) {
      for (const examResult of vendor.examResults) {
        await this.db
          .getItem(TableTypes.COMMON_DETAILS, {
            id: examResult.examId,
            detailType: DetailTypes.EXAM,
          })
          .then((result) => {
            if (result) {
              examResult.examName = result.examName;
            }
          })
          .catch(
            (error) =>
              new Promise((resolve, reject) => {
                reject(new CustomResponseBuilder().status(500).message(error.message).build());
              }),
          );

        for (const subjectResult of examResult.subjectResults) {
          await this.db
            .getItem(TableTypes.COMMON_DETAILS, {
              id: subjectResult.subjectId,
              detailType: DetailTypes.SUBJECT,
            })
            .then((result) => {
              if (result) {
                subjectResult.subjectName = result.subjectName;
              }
            })
            .catch(
              (error) =>
                new Promise((resolve, reject) => {
                  reject(new CustomResponseBuilder().status(500).message(error.message).build());
                }),
            );
        }
      }
    }

    if (vendor.preferredSyllabusAndSubjects) {
      for (const preferredSyllabusAndSubject of vendor.preferredSyllabusAndSubjects) {
        const preferredSyllabusAndSubjectsResponse: PreferredSyllabusAndSubjectsResponse = {
          syllabusId: preferredSyllabusAndSubject.syllabusId,
          syllabusName: '',
          subjects: [],
        };

        await this.db
          .getItem(TableTypes.COMMON_DETAILS, {
            id: preferredSyllabusAndSubject.syllabusId,
            detailType: DetailTypes.EXAM,
          })
          .then((result) => {
            if (result) {
              preferredSyllabusAndSubjectsResponse.syllabusName = result.examName;
            }
          })
          .catch(
            (error) =>
              new Promise((resolve, reject) => {
                reject(new CustomResponseBuilder().status(500).message(error.message).build());
              }),
          );

        for (const subjectId of preferredSyllabusAndSubject.subjectIds) {
          await this.db
            .getItem(TableTypes.COMMON_DETAILS, {
              id: subjectId,
              detailType: DetailTypes.SUBJECT,
            })
            .then((result) => {
              if (result) {
                preferredSyllabusAndSubjectsResponse.subjects.push(result);
              }
            })
            .catch(
              (error) =>
                new Promise((resolve, reject) => {
                  reject(new CustomResponseBuilder().status(500).message(error.message).build());
                }),
            );
        }

        preferredSyllabusAndSubjects.push(preferredSyllabusAndSubjectsResponse);
      }
    }

    if (vendor.universityId) {
      await this.db
        .getItem(TableTypes.COMMON_DETAILS, {
          id: vendor.universityId,
          detailType: DetailTypes.UNIVERSITY.toString(),
        })
        .then((result) => {
          if (result) {
            university = result;
          }
        })
        .catch(
          (error) =>
            new Promise((resolve, reject) => {
              reject(new CustomResponseBuilder().status(500).message(error.message).build());
            }),
        );
    }

    if (vendor.nationalityId) {
      await this.db
        .getItem(TableTypes.COMMON_DETAILS, {
          id: vendor.nationalityId,
          detailType: DetailTypes.NATIONALITY.toString(),
        })
        .then((result) => {
          if (result) {
            nationality = result;
          }
        })
        .catch(
          (error) =>
            new Promise((resolve, reject) => {
              reject(new CustomResponseBuilder().status(500).message(error.message).build());
            }),
        );
    }

    const vendorDetailsResponse: VendorDetailsResponse = {
      id: vendor.id,
      email: vendor.email,
      fullName: vendor.fullName,
      firstName: vendor.firstName,
      lastName: vendor.lastName,
      gender: vendor.gender,
      contactNumber: vendor.contactNumber,
      biography: vendor.biography,
      majorInUniversity: vendor.majorInUniversity,
      yearsOfExperience: vendor.yearsOfExperience,
      videoUrl: vendor.videoUrl,
      isNewVendor: vendor.isNewVendor,
      isGoldVendor: vendor.isGoldVendor,
      isExpressVendor: vendor.isExpressVendor,
      joiningDate: vendor.joiningDate,
      examResults: vendor.examResults,
      profilePicUrl,
      preferredSyllabusAndSubjects,
      locations,
      languagesSpoken,
      preferredDistricts,
      university,
      nationality,
    };

    return vendorDetailsResponse;
  }

  private async mapVenderDetailsToVendorDetailsForList(
    vendorDetails: Vendor[],
    clientEmail: string,
  ): Promise<VendorDetailsForCard[]> {
    const vendorDetailsForCard: VendorDetailsForCard[] = [];
    for (const vendorDetail of vendorDetails) {
      let profilePicUrl: string;
      const preferredSyllabusAndSubjectsResponses: PreferredSyllabusAndSubjectsResponse[] = [];

      const { id, fullName, preferredSyllabusAndSubjects, profilePicS3Key, email } = vendorDetail;
      if (email !== clientEmail) {
        await this.getUrl(profilePicS3Key)
          .then((result) => (profilePicUrl = result))
          .catch((err) => err);
      }

      if (preferredSyllabusAndSubjects) {
        for (const preferredSyllabusAndSubject of preferredSyllabusAndSubjects) {
          const preferredSyllabusAndSubjectsResponse = {
            syllabusId: preferredSyllabusAndSubject.syllabusId,
            syllabusName: '',
            subjects: [],
          };

          await this.db
            .getItem(TableTypes.COMMON_DETAILS, {
              id: preferredSyllabusAndSubject.syllabusId,
              detailType: DetailTypes.EXAM,
            })
            .then((result) => {
              if (result) {
                preferredSyllabusAndSubjectsResponse.syllabusName = result.examName;
              }
            })
            .catch(
              (error) =>
                new Promise((resolve, reject) => {
                  reject(new CustomResponseBuilder().status(500).message(error.message).build());
                }),
            );

          for (const subjectId of preferredSyllabusAndSubject.subjectIds) {
            await this.db
              .getItem(TableTypes.COMMON_DETAILS, {
                id: subjectId,
                detailType: DetailTypes.SUBJECT,
              })
              .then((result) => {
                if (result) {
                  delete result.detailType;
                  preferredSyllabusAndSubjectsResponse.subjects.push(result);
                }
              })
              .catch(
                (error) =>
                  new Promise((resolve, reject) => {
                    reject(new CustomResponseBuilder().status(500).message(error.message).build());
                  }),
              );
          }

          preferredSyllabusAndSubjectsResponses.push(preferredSyllabusAndSubjectsResponse);
        }
      }

      vendorDetailsForCard.push({
        id,
        fullName,
        preferredSyllabusAndSubjects: preferredSyllabusAndSubjectsResponses,
        profilePicUrl,
      });
    }

    return vendorDetailsForCard;
  }

  private async getUrl(s3Key: string): Promise<string> {
    return await this.fileHandler
      .getS3SignedUrl(s3Key)
      .then((result) => result)
      .catch((err) => err);
  }
}
