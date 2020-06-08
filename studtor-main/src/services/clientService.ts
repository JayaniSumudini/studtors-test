import { injectable, inject } from 'inversify';
import { DynamoDbAdapterImpl } from '../dependency/database/dynamoDb/dynamoDbAdapterImpl';
import { TableTypes, DetailTypes } from '../constant/tableNames';
import {
  ClientDetailsCreateRequest,
  Client,
  ClientEmailMapping,
  ClientLoginRequest,
  ClientChangePasswordWhenForgot,
  ClientLoginResponse,
} from '../models/client';
import { sign } from 'jsonwebtoken';
import { SesMailHandlerImpl } from '../dependency/mailservice/ses/SesMailHandlerImpl';
import { ActivateDetailsGenerator } from '../dependency/activateDetailsGenerator';
import { EmailTypes } from '../constant/emailTypes';
import { AccountStatus } from '../constant/accountStatus';
import { CustomResponseBuilder, CustomResponse } from '../dependency/customResponse';
import { OTPcodeGenerator } from '../dependency/otpCodeGenerator';
import { Validation } from '../util/validation';
import DIContainer from '../di-container';
import { Location, LocationCreateRequest } from '../models/location';
import { ContactNumberMapping } from '../models/contactNumberMapping';
import { DbOperations } from '../constant/dbOperations';
import { ItemResponseList, ItemResponse } from 'aws-sdk/clients/dynamodb';
import { ClientProfileTypes } from '../constant/clientProfileTypes';
import { DbParam } from '../models/dbParam';
import { CommonUtil } from '../util/commonUtil';
import { LocationTypes } from '../constant/locationTypes';
import { response } from 'express';
import { S3FileHandlerImpl } from '../dependency/fileHandler/s3FileHandler/s3FileHandlerImpl';

const secret = process.env.JWT_SECRET || 'my@#$secret';

@injectable()
export class ClientService {
  private db: DynamoDbAdapterImpl;
  private mailHandler: SesMailHandlerImpl;
  private fileHandler: S3FileHandlerImpl;

  private validation: Validation = DIContainer.resolve<Validation>(Validation);
  private commonUtil: CommonUtil = DIContainer.resolve<CommonUtil>(CommonUtil);
  private activateGenerator: ActivateDetailsGenerator = DIContainer.resolve<
    ActivateDetailsGenerator
  >(ActivateDetailsGenerator);
  private otpCodeGenerator: OTPcodeGenerator = DIContainer.resolve<OTPcodeGenerator>(
    OTPcodeGenerator,
  );

  constructor(
    @inject(DynamoDbAdapterImpl) dbAdapter: DynamoDbAdapterImpl,
    @inject(SesMailHandlerImpl) mailHandler: SesMailHandlerImpl,
    @inject(S3FileHandlerImpl) fileHandler: S3FileHandlerImpl,
  ) {
    this.db = dbAdapter;
    this.mailHandler = mailHandler;
    this.fileHandler = fileHandler;
  }

  public async createClient(newClientDetails: ClientDetailsCreateRequest): Promise<CustomResponse> {
    const { password } = newClientDetails;
    const email: string = newClientDetails.email.toLowerCase().trim();
    const fullName: string = newClientDetails.fullName.trim();
    const contactNumber: string = newClientDetails.contactNumber.replace(/\D/g, '');

    const validationErrors = this.validation.validateRequest({
      password,
      email,
      fullName,
      contactNumber,
    });

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

    const responses: ItemResponseList = await this.db
      .transactGetItems([
        {
          tableName: TableTypes.CLIENT_EMAIL_MAPPING,
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
        reject(new CustomResponseBuilder().status(422).message('User Already Exists').build());
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
      .getId(TableTypes.CLIENT_DETAILS)
      .then((result) => (id = `${result.id}_client`))
      .catch(
        (error) =>
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(500).message(error.message).build());
          }),
      );

    const { activeUrl, activeToken } = this.activateGenerator.getActivateDetails(email);

    const accountStatus: AccountStatus = AccountStatus.PENDING;
    const activeExpires: number = Date.now() + 24 * 3600 * 1000;

    const clientEmailMappingParam: ClientEmailMapping = {
      id,
      email,
      password,
      activeToken,
      activeExpires,
    };

    const contactNumberMappingParam: ContactNumberMapping = {
      contactNumber,
      id,
    };

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

    const location: Location = {
      locationType: LocationTypes.CURRENT,
      id: locationId,
      userId: id,
      address: 'ONLINE-ZOOM',
    };

    const newClient: Client = {
      email,
      id,
      fullName,
      contactNumber,
      accountStatus,
      clientProfileType: ClientProfileTypes.PARENT,
      locationIds: [locationId],
    };

    return this.mailHandler
      .sendMail(email, fullName, '', activeUrl, EmailTypes.ACCOUNT_ACTIVATION_CLIENT)
      .then(async (result) => {
        if (result) {
          return await this.db
            .transactWriteItems([
              {
                tableName: TableTypes.CLIENT_EMAIL_MAPPING,
                values: clientEmailMappingParam,
                dbOperation: DbOperations.PUT,
              },
              {
                tableName: TableTypes.CONTACT_NUMBER_MAPPING,
                values: contactNumberMappingParam,
                dbOperation: DbOperations.PUT,
              },
              {
                tableName: TableTypes.CLIENT_DETAILS,
                values: newClient,
                dbOperation: DbOperations.PUT,
              },
              {
                tableName: TableTypes.LOCATION,
                values: location,
                dbOperation: DbOperations.PUT,
              },
            ])
            .then((result) =>
              new CustomResponseBuilder()
                .status(201)
                .message('Client Registration Success')
                .build(),
            )
            .catch((error) =>
              new CustomResponseBuilder().status(500).message(error.message).build(),
            );
        }
      })
      .catch((error) => new CustomResponseBuilder().status(500).message(error.message).build());
  }

  public async clientAccountActivate(emailProvide: string, activeToken: string): Promise<any> {
    const email: string = emailProvide.toLowerCase().trim();

    const validationErrors = this.validation.validateRequest({ email });

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

    let client: ClientEmailMapping;

    await this.db
      .getItem(TableTypes.CLIENT_EMAIL_MAPPING, {
        email,
      })
      .then((result) => (client = result))
      .catch(
        (error) =>
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(500).message(error.message).build());
          }),
      );

    if (!client) {
      return new Promise((resolve, reject) => {
        reject(new CustomResponseBuilder().status(422).message('User Not Exists').build());
      });
    }

    if (client.activeExpires < Date.now()) {
      return new Promise((resolve, reject) => {
        reject(new CustomResponseBuilder().status(422).message('Activate Code Expired').build());
      });
    }

    if (this.commonUtil.compareToString(activeToken, client.activeToken)) {
      return await this.db
        .transactWriteItems([
          {
            tableName: TableTypes.CLIENT_EMAIL_MAPPING,
            key: { email },
            values: { activeToken: '-1', activeExpires: Date.now() },
            dbOperation: DbOperations.UPDATE,
          },
          {
            tableName: TableTypes.CLIENT_DETAILS,
            key: { id: client.id },
            values: {
              accountStatus: AccountStatus.ACTIVATED,
            },
            dbOperation: DbOperations.UPDATE,
          },
        ])
        .then((result) =>
          new CustomResponseBuilder().status(200).message('Account Activation Success').build(),
        )
        .catch((error) => new CustomResponseBuilder().status(500).message(error.message).build());
    } else {
      new CustomResponseBuilder().status(422).message('Provided Activate Token Invalid').build();
    }
  }

  public async loginClient(clientLoginDetails: ClientLoginRequest): Promise<CustomResponse> {
    const { password } = clientLoginDetails;

    const email: string = clientLoginDetails.email.toLowerCase().trim();

    const validationErrors = this.validation.validateRequest(clientLoginDetails);

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

    let client: ClientEmailMapping;

    await this.db
      .getItem(TableTypes.CLIENT_EMAIL_MAPPING, {
        email,
      })
      .then((result) => (client = result))
      .catch(
        (error) =>
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(500).message(error.message).build());
          }),
      );

    if (!client) {
      return new Promise((resolve, reject) => {
        reject(new CustomResponseBuilder().status(422).message('User Not Registed').build());
      });
    } else {
      let clientDetails: Client;
      await this.db
        .getItem(TableTypes.CLIENT_DETAILS, {
          id: client.id,
        })
        .then((result) => (clientDetails = result))
        .catch(
          (error) =>
            new Promise((resolve, reject) => {
              reject(new CustomResponseBuilder().status(500).message(error.message).build());
            }),
        );

      const { id, fullName, contactNumber, clientProfileType, accountStatus } = clientDetails;

      if (accountStatus === AccountStatus.PENDING) {
        return new Promise((resolve, reject) => {
          reject(new CustomResponseBuilder().status(422).message('Account Not Activated').build());
        });
      }

      if (this.commonUtil.compareToString(password, client.password)) {
        const token = sign(
          {
            _id: client.id,
            _email: client.email,
            scopes: ['client:access'],
          },
          secret,
          { expiresIn: '6h' },
        );
        const clientLoginResponse: ClientLoginResponse = {
          token,
          email,
          id,
          fullName,
          contactNumber,
          clientProfileType,
        };
        return new CustomResponseBuilder()
          .status(200)
          .message('User Login Success')
          .data(clientLoginResponse)
          .build();
      } else {
        return new Promise((resolve, reject) => {
          reject(new CustomResponseBuilder().status(422).message('Invalid Login').build());
        });
      }
    }
  }

  public async getClientDetails(request: any, clientId: string): Promise<CustomResponse> {
    const validationErrors = this.validation.validateRequest(clientId);

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

    let clientDetails: Client;
    await this.db
      .getItem(TableTypes.CLIENT_DETAILS, {
        id: clientId,
      })
      .then((result) => {
        if (result) {
          clientDetails = result;
        } else {
          return new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(422).message('Client not registed').build());
          });
        }
      })
      .catch(
        (error) =>
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(500).message(error.message).build());
          }),
      );

    delete clientDetails.accountStatus;

    return new CustomResponseBuilder()
      .status(200)
      .message('Get Client Details Success')
      .data(clientDetails)
      .build();
  }

  public async clientForgotPassword(emailProvide: string): Promise<CustomResponse> {
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

    let client: ClientEmailMapping;

    await this.db
      .getItem(TableTypes.CLIENT_EMAIL_MAPPING, {
        email,
      })
      .then((result) => (client = result))
      .catch(
        (error) =>
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(500).message(error.message).build());
          }),
      );

    if (client) {
      const otpCode: string = this.otpCodeGenerator.generateOTPcode();
      return this.mailHandler
        .sendMail(email, '', otpCode, '', EmailTypes.FORGOT_PASSWORD)
        .then(async (result) => {
          if (result) {
            try {
              const updateResult = await this.db.updateItem(
                TableTypes.CLIENT_EMAIL_MAPPING,
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
    changePasswordWhenForgotRequest: ClientChangePasswordWhenForgot,
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

    let client: ClientEmailMapping;

    await this.db
      .getItem(TableTypes.CLIENT_EMAIL_MAPPING, {
        email,
      })
      .then((result) => (client = result))
      .catch(
        (error) =>
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(500).message(error.message).build());
          }),
      );

    if (!client) {
      return new Promise((resolve, reject) => {
        reject(new CustomResponseBuilder().status(422).message('User Not Registed').build());
      });
    }

    if (this.commonUtil.compareToString(otpCode, client.otpCode)) {
      return this.db
        .updateItem(
          TableTypes.CLIENT_EMAIL_MAPPING,
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

  /**
   * @todo need to change this end service to get email from jwt token.
   */
  public async clientAccountDelete(providedEmail: any): Promise<CustomResponse> {
    const email: string = providedEmail.toLowerCase().trim();

    let client: ClientEmailMapping;

    await this.db
      .getItem(TableTypes.CLIENT_EMAIL_MAPPING, {
        email,
      })
      .then((result) => (client = result))
      .catch(
        (error) =>
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(500).message(error.message).build());
          }),
      );

    let clientDetails: Client;
    await this.db
      .getItem(TableTypes.CLIENT_DETAILS, {
        id: client.id,
      })
      .then((result) => (clientDetails = result))
      .catch(
        (error) =>
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(500).message(error.message).build());
          }),
      );

    return this.db
      .transactWriteItems([
        {
          tableName: TableTypes.CLIENT_DETAILS,
          values: { id: client.id },
          dbOperation: DbOperations.DELETE,
        },
        {
          tableName: TableTypes.CLIENT_EMAIL_MAPPING,
          values: { email },
          dbOperation: DbOperations.DELETE,
        },
        {
          tableName: TableTypes.CONTACT_NUMBER_MAPPING,
          values: {
            contactNumber: clientDetails.contactNumber,
          },
          dbOperation: DbOperations.DELETE,
        },
      ])
      .then((result) => new CustomResponseBuilder().status(200).message('Client Deleted').build())
      .catch((error) => new CustomResponseBuilder().status(500).message(error.message).build());
  }

  public async addMyLocations(
    location: LocationCreateRequest,
    email: string,
  ): Promise<CustomResponse> {
    const validationErrors = this.validation.validateRequest(location);

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

    const { latitude, longitude, address, locationType, additionalInformation } = location;

    let client: ClientEmailMapping;

    await this.db
      .getItem(TableTypes.CLIENT_EMAIL_MAPPING, {
        email: email.toLowerCase().trim(),
      })
      .then((result) => (client = result))
      .catch(
        (error) =>
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(500).message(error.message).build());
          }),
      );

    let clientDetails: Client;
    await this.db
      .getItem(TableTypes.CLIENT_DETAILS, {
        id: client.id,
      })
      .then((result) => (clientDetails = result))
      .catch(
        (error) =>
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(500).message(error.message).build());
          }),
      );

    let id: string;

    await this.db
      .getId(TableTypes.LOCATION)
      .then((result) => (id = `${result.id}_location`))
      .catch(
        (error) =>
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(500).message(error.message).build());
          }),
      );

    const newLocation: Location = {
      id,
      userId: client.id,
      latitude,
      longitude,
      address,
      locationType,
      additionalInformation,
    };

    clientDetails.locationIds
      ? clientDetails.locationIds.push(id)
      : (clientDetails.locationIds = [id]);

    return this.db
      .transactWriteItems([
        {
          tableName: TableTypes.LOCATION,
          values: newLocation,
          dbOperation: DbOperations.PUT,
        },
        {
          tableName: TableTypes.CLIENT_DETAILS,
          key: { id: client.id },
          values: { locationIds: clientDetails.locationIds },
          dbOperation: DbOperations.UPDATE,
        },
      ])
      .then((result) =>
        new CustomResponseBuilder().status(200).message('Location Added Success').build(),
      )
      .catch((error) => new CustomResponseBuilder().status(500).message(error.message).build());
  }

  public async getClientLocations(
    providedEmail: string,
    clientId: string,
  ): Promise<CustomResponse> {
    const email: string = providedEmail.toLowerCase().trim();

    const locationDetails: Location[] = [];
    let locationIds: string[];
    await this.db
      .getItem(TableTypes.CLIENT_DETAILS, {
        id: clientId,
      })
      .then((result: Client) => (locationIds = result.locationIds))
      .catch(
        (error) =>
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(422).message('Client not registed').build());
          }),
      );

    if (locationIds) {
      for (const locationId of locationIds) {
        await this.db
          .getItem(TableTypes.LOCATION, {
            id: locationId,
            userId: clientId,
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
          .message('Get Client Locations Success')
          .data(locationDetails)
          .build(),
      );
    });
  }

  public async updateClientLocation(
    providedEmail: string,
    updateLocations: Location[],
  ): Promise<CustomResponse> {
    const transactWriteItems: DbParam[] = [];

    updateLocations.forEach((updateLocation) => {
      const validationErrors = this.validation.validateRequest(updateLocations);

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
        id,
        userId,
        latitude,
        longitude,
        address,
        locationType,
        additionalInformation,
      } = updateLocation;

      let updateValues: {};
      if (address === 'ONLINE-ZOOM') {
        updateValues = { locationType };
      } else {
        if (additionalInformation) {
          updateValues = { latitude, longitude, address, locationType, additionalInformation };
        } else {
          updateValues = { latitude, longitude, address, locationType };
        }
      }

      transactWriteItems.push({
        tableName: TableTypes.LOCATION,
        key: { id, userId },
        values: updateValues,
        dbOperation: DbOperations.UPDATE,
      });
    });

    return this.db
      .transactWriteItems(transactWriteItems)
      .then((result) =>
        new CustomResponseBuilder().status(200).message('Locations Updated').build(),
      )
      .catch((error) => new CustomResponseBuilder().status(500).message(error.message).build());
  }

  public async clientLocationDelete(
    providedClientId: string,
    locationId: string,
  ): Promise<CustomResponse> {
    const validationErrors = this.validation.validateRequest({
      locationId,
    });

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

    let locationIds: string[];
    let location: Location;

    const responses = await this.db
      .transactGetItems([
        {
          tableName: TableTypes.CLIENT_DETAILS,
          values: { id: providedClientId },
        },
        {
          tableName: TableTypes.LOCATION,
          values: { id: locationId, userId: providedClientId },
        },
      ])
      .then((responses) => responses)
      .catch(
        (error) =>
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(500).message(error.message).build());
          }),
      );

    if (!responses[0].Item) {
      return new Promise((resolve, reject) => {
        reject(new CustomResponseBuilder().status(422).message('Client not exists').build());
      });
    } else if (!responses[1].Item) {
      return new Promise((resolve, reject) => {
        reject(
          new CustomResponseBuilder()
            .status(422)
            .message('This Location not exists for this client')
            .build(),
        );
      });
    }

    locationIds = responses[0].Item.locationIds;
    location = responses[1].Item;

    if (location.userId !== providedClientId) {
      return new Promise((resolve, reject) => {
        reject(
          new CustomResponseBuilder()
            .status(422)
            .message('you can not delete others locations')
            .build(),
        );
      });
    } else {
      if (location.address === 'ONLINE-ZOOM') {
        return new Promise((resolve, reject) => {
          reject(
            new CustomResponseBuilder()
              .status(422)
              .message('you can not delete default zoom locations')
              .build(),
          );
        });
      }
      const indexOfLocation = locationIds.indexOf(locationId);

      if (indexOfLocation === -1) {
        return new Promise((resolve, reject) => {
          reject(
            new CustomResponseBuilder()
              .status(422)
              .message('client not have this location')
              .build(),
          );
        });
      } else {
        locationIds.splice(indexOfLocation, 1);
        return this.db
          .transactWriteItems([
            {
              tableName: TableTypes.LOCATION,
              values: { id: locationId, userId: providedClientId },
              dbOperation: DbOperations.DELETE,
            },
            {
              tableName: TableTypes.CLIENT_DETAILS,
              key: { id: providedClientId },
              values: { locationIds },
              dbOperation: DbOperations.UPDATE,
            },
          ])
          .then((result) =>
            new CustomResponseBuilder().status(200).message('Location Deleted').build(),
          )
          .catch((error) => new CustomResponseBuilder().status(500).message(error.message).build());
      }
    }
  }

  public async getAllBookingDetailsForClient(clientId: string): Promise<CustomResponse> {
    let bookingIds: string[];

    await this.db
      .getItem(TableTypes.CLIENT_DETAILS, { id: clientId })
      .then((result: Client) => {
        if (result) {
          bookingIds = result.bookingIds;
        } else {
          return new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(422).message('Client not Exists').build());
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

  private async getUrl(s3Key: string): Promise<string> {
    return await this.fileHandler
      .getS3SignedUrl(s3Key)
      .then((result) => result)
      .catch((err) => err);
  }
}
