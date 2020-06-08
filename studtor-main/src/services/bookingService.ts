import { injectable, inject } from 'inversify';
import { DynamoDbAdapterImpl } from '../dependency/database/dynamoDb/dynamoDbAdapterImpl';
import { BookingCreateRequest, Booking, BookingModifyRequest } from '../models/booking';
import { CustomResponse, CustomResponseBuilder } from '../dependency/customResponse';
import { Validation } from '../util/validation';
import DIContainer from '../di-container';
import { TableTypes } from '../constant/tableNames';
import { DbOperations } from '../constant/dbOperations';
import { BookingStatus } from '../constant/bookingStatus';
import { Client } from '../models/client';
import { Vendor } from '../models/vendor';
import { CommonUtil } from '../util/commonUtil';

@injectable()
export class BookingService {
  private db: DynamoDbAdapterImpl;
  private validation: Validation = DIContainer.resolve<Validation>(Validation);
  private commonUtil: CommonUtil = DIContainer.resolve<CommonUtil>(CommonUtil);

  constructor(@inject(DynamoDbAdapterImpl) dbAdapter: DynamoDbAdapterImpl) {
    this.db = dbAdapter;
  }
  public async createNewBooking(
    newBookingRequest: BookingCreateRequest,
    providedClientEmail: string,
  ): Promise<CustomResponse> {
    const validationErrors = this.validation.validateRequest(newBookingRequest);

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
      clientId,
      vendorId,
      profileId,
      syllabusId,
      subjectId,
      bookingStartDateTime,
      bookingEndDateTime,
      locationId,
    } = newBookingRequest;

    const responses = await this.db
      .transactGetItems([
        {
          tableName: TableTypes.CLIENT_DETAILS,
          values: { id: clientId },
        },
        {
          tableName: TableTypes.VENDOR_DETAILS,
          values: { id: vendorId },
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
        reject(new CustomResponseBuilder().status(422).message('Customer not exists').build());
      });
    } else if (!responses[1].Item) {
      return new Promise((resolve, reject) => {
        reject(new CustomResponseBuilder().status(422).message('Vendor not exists').build());
      });
    }
    const clientDetails: Client = responses[0].Item;
    const vendorDetails: Vendor = responses[1].Item;

    if (providedClientEmail !== clientDetails.email) {
      return new Promise((resolve, reject) => {
        reject(
          new CustomResponseBuilder()
            .status(422)
            .message('Can not apply booking for other clients')
            .build(),
        );
      });
    }

    if (
      clientDetails.email === vendorDetails.email ||
      clientDetails.contactNumber === vendorDetails.contactNumber
    ) {
      return new Promise((resolve, reject) => {
        reject(
          new CustomResponseBuilder()
            .status(422)
            .message('Can not apply booking for your vendor profile')
            .build(),
        );
      });
    }

    if (
      !clientDetails.locationIds ||
      (clientDetails.locationIds && clientDetails.locationIds.indexOf(locationId) === -1)
    ) {
      return new Promise((resolve, reject) => {
        reject(
          new CustomResponseBuilder()
            .status(422)
            .message('Can not find this location in client mylocation list')
            .build(),
        );
      });
    }

    if (
      this.commonUtil.isPastDateTime(bookingStartDateTime) &&
      this.commonUtil.isPastDateTime(bookingEndDateTime)
    ) {
      return new Promise((resolve, reject) => {
        reject(
          new CustomResponseBuilder().status(422).message('Can not book past datetime').build(),
        );
      });
    } else if (!this.commonUtil.compareToDateTime(bookingStartDateTime, bookingEndDateTime)) {
      return new Promise((resolve, reject) => {
        reject(
          new CustomResponseBuilder()
            .status(422)
            .message('Booking end dateTime is invalid ')
            .build(),
        );
      });
    }

    let bookingId: string;

    await this.db
      .getId(TableTypes.BOOKING)
      .then((result) => (bookingId = `${result.id}_booking`))
      .catch(
        (error) =>
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(500).message(error.message).build());
          }),
      );

    const newBooking: Booking = Object.assign(newBookingRequest, {
      id: bookingId,
      bookingStatus: BookingStatus.PENDING,
      vendorFullName: vendorDetails.fullName,
      vendorProfilePicS3Key: vendorDetails.profilePicS3Key,
      clientFullName: clientDetails.fullName,
    });

    clientDetails.bookingIds
      ? clientDetails.bookingIds.push(bookingId)
      : (clientDetails.bookingIds = [bookingId]);

    vendorDetails.bookingIds
      ? vendorDetails.bookingIds.push(bookingId)
      : (vendorDetails.bookingIds = [bookingId]);

    return await this.db
      .transactWriteItems([
        {
          tableName: TableTypes.BOOKING,
          values: newBooking,
          dbOperation: DbOperations.PUT,
        },
        {
          tableName: TableTypes.CLIENT_DETAILS,
          key: { id: clientId },
          values: { bookingIds: clientDetails.bookingIds },
          dbOperation: DbOperations.UPDATE,
        },
        {
          tableName: TableTypes.VENDOR_DETAILS,
          key: { id: vendorId },
          values: { bookingIds: vendorDetails.bookingIds },
          dbOperation: DbOperations.UPDATE,
        },
      ])
      .then((responses) =>
        new CustomResponseBuilder().status(200).message('Booking Success').build(),
      )
      .catch((error) => new CustomResponseBuilder().status(500).message(error.message).build());
  }

  public async modifyBooking(
    bookingModifyRequest: BookingModifyRequest,
    providedClientId: string,
  ): Promise<CustomResponse> {
    const validationErrors = this.validation.validateRequest(bookingModifyRequest);

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

    const { bookingId, profileId, syllabusId, subjectId, locationId } = bookingModifyRequest;

    let bookingDetails: Booking;

    await this.db
      .getItem(TableTypes.BOOKING, { id: bookingId })
      .then((result) => {
        if (result) {
          bookingDetails = result;
        } else {
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(422).message('Can not find booking').build());
          });
        }
      })
      .catch(
        (error) =>
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(500).message(error.message).build());
          }),
      );

    const bookingStartDateTime = bookingModifyRequest.bookingStartDateTime
      ? bookingModifyRequest.bookingStartDateTime
      : bookingDetails.bookingStartDateTime;

    const bookingEndDateTime = bookingModifyRequest.bookingEndDateTime
      ? bookingModifyRequest.bookingEndDateTime
      : bookingDetails.bookingEndDateTime;

    if (providedClientId !== bookingDetails.clientId) {
      return new Promise((resolve, reject) => {
        reject(
          new CustomResponseBuilder()
            .status(422)
            .message('You can modify only your bookings')
            .build(),
        );
      });
    } else if (!this.commonUtil.isBookingCanModify(bookingDetails.bookingStatus)) {
      return new Promise((resolve, reject) => {
        reject(
          new CustomResponseBuilder()
            .status(422)
            .message('Can not modify booking.It is already canceled')
            .build(),
        );
      });
    }

    if (
      this.commonUtil.isPastDateTime(bookingStartDateTime) ||
      this.commonUtil.isPastDateTime(bookingEndDateTime)
    ) {
      return new Promise((resolve, reject) => {
        reject(
          new CustomResponseBuilder().status(422).message('Can not book past datetime').build(),
        );
      });
    } else if (!this.commonUtil.compareToDateTime(bookingStartDateTime, bookingEndDateTime)) {
      return new Promise((resolve, reject) => {
        reject(
          new CustomResponseBuilder()
            .status(422)
            .message('Booking end dateTime is invalid ')
            .build(),
        );
      });
    }

    let bookingStatus: BookingStatus;

    if (bookingDetails.bookingStatus === BookingStatus.PENDING) {
      bookingStatus = BookingStatus.PENDING;
    } else {
      bookingStatus = BookingStatus.MODIFIED_BY_STUDENT;
    }

    const bookingModifyParam = {
      profileId,
      syllabusId,
      subjectId,
      bookingStartDateTime,
      bookingEndDateTime,
      locationId,
      bookingStatus,
    };

    Object.keys(bookingModifyParam).forEach(
      (key) => bookingModifyParam[key] === undefined && delete bookingModifyParam[key],
    );

    return this.db
      .updateItem(TableTypes.BOOKING, { id: bookingId }, bookingModifyParam)
      .then((result) =>
        new CustomResponseBuilder().status(200).message('Booking update success').build(),
      )
      .catch((error) => new CustomResponseBuilder().status(500).message(error.message).build());
  }

  public async cancelBooking(request: any, bookingId: string): Promise<CustomResponse> {
    const validationErrors = this.validation.validateRequest(bookingId);

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

    const { _id, scopes } = request.user;
    let bookingDetails: Booking;

    await this.db
      .getItem(TableTypes.BOOKING, { id: bookingId })
      .then((result) => {
        if (result) {
          bookingDetails = result;
        } else {
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(422).message('Can not find booking').build());
          });
        }
      })
      .catch(
        (error) =>
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(500).message(error.message).build());
          }),
      );

    if (
      (scopes[0] === 'client:access' && _id !== bookingDetails.clientId) ||
      (scopes[0] === 'vendor:access' && _id !== bookingDetails.vendorId)
    ) {
      return new Promise((resolve, reject) => {
        reject(
          new CustomResponseBuilder()
            .status(422)
            .message('You can cancel only your bookings')
            .build(),
        );
      });
    } else if (bookingDetails.bookingStatus === BookingStatus.CANCELED_BY_STUDENT) {
      return new Promise((resolve, reject) => {
        reject(
          new CustomResponseBuilder()
            .status(422)
            .message('Booking is already canceled by client')
            .build(),
        );
      });
    } else if (bookingDetails.bookingStatus === BookingStatus.CANCELED_BY_TUTOR) {
      return new Promise((resolve, reject) => {
        reject(
          new CustomResponseBuilder()
            .status(422)
            .message('Booking is already canceled by tutor')
            .build(),
        );
      });
    } else if (
      bookingDetails.bookingStatus !== BookingStatus.EXPIRED &&
      bookingDetails.bookingStatus !== BookingStatus.READY_TO_REVIEW
    ) {
      const bookingStatus =
        scopes[0] === 'client:access'
          ? BookingStatus.CANCELED_BY_STUDENT
          : BookingStatus.CANCELED_BY_TUTOR;
      return await this.db
        .updateItem(TableTypes.BOOKING, { id: bookingId }, { bookingStatus })
        .then((result) => {
          if (result) {
            return new CustomResponseBuilder().status(200).message('Booking is canceled').build();
          }
        })
        .catch((error) => new CustomResponseBuilder().status(500).message(error.message).build());
    }
  }

  public async acceptBooking(bookingId: string, providedVendorId: string): Promise<CustomResponse> {
    const validationErrors = this.validation.validateRequest({
      bookingId,
      vendorId: providedVendorId,
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

    let bookingDetails: Booking;

    await this.db
      .getItem(TableTypes.BOOKING, { id: bookingId })
      .then((result) => {
        if (result) {
          bookingDetails = result;
        } else {
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(422).message('Can not find booking').build());
          });
        }
      })
      .catch(
        (error) =>
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(500).message(error.message).build());
          }),
      );

    if (providedVendorId !== bookingDetails.vendorId) {
      return new Promise((resolve, reject) => {
        reject(
          new CustomResponseBuilder()
            .status(422)
            .message('You can accept only your bookings')
            .build(),
        );
      });
    } else if (!this.commonUtil.isBookingCanAccept(bookingDetails.bookingStatus)) {
      return new Promise((resolve, reject) => {
        reject(
          new CustomResponseBuilder()
            .status(422)
            .message('Booking not in Acceptable state')
            .build(),
        );
      });
    } else {
      return this.db
        .updateItem(
          TableTypes.BOOKING,
          { id: bookingId },
          { bookingStatus: BookingStatus.APPROVED },
        )
        .then((result) =>
          new CustomResponseBuilder().status(200).message('Booking Accept success').build(),
        )
        .catch((error) => new CustomResponseBuilder().status(500).message(error.message).build());
    }
  }

  public async declineBooking(
    bookingId: string,
    providedVendorId: string,
  ): Promise<CustomResponse> {
    const validationErrors = this.validation.validateRequest({
      bookingId,
      vendorId: providedVendorId,
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

    let bookingDetails: Booking;

    await this.db
      .getItem(TableTypes.BOOKING, { id: bookingId })
      .then((result) => {
        if (result) {
          bookingDetails = result;
        } else {
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(422).message('Can not find booking').build());
          });
        }
      })
      .catch(
        (error) =>
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(500).message(error.message).build());
          }),
      );

    if (providedVendorId !== bookingDetails.vendorId) {
      return new Promise((resolve, reject) => {
        reject(
          new CustomResponseBuilder()
            .status(422)
            .message('You can decline only your bookings')
            .build(),
        );
      });
    } else if (bookingDetails.bookingStatus !== BookingStatus.PENDING) {
      return new Promise((resolve, reject) => {
        reject(
          new CustomResponseBuilder()
            .status(422)
            .message('Booking not in pending state to decline')
            .build(),
        );
      });
    } else {
      return this.db
        .updateItem(
          TableTypes.BOOKING,
          { id: bookingId },
          { bookingStatus: BookingStatus.DECLINED },
        )
        .then((result) =>
          new CustomResponseBuilder().status(200).message('Booking Decline success').build(),
        )
        .catch((error) => new CustomResponseBuilder().status(500).message(error.message).build());
    }
  }
}
