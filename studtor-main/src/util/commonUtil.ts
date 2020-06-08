import { injectable } from 'inversify';
import moment = require('moment');
import { BookingStatus } from '../constant/bookingStatus';

@injectable()
export class CommonUtil {
  public groupBookingsByDate(bookingDetails: any[]): object {
    const groupedResult = {};
    bookingDetails.forEach((bookingDetail) => {
      const date = moment(bookingDetail.bookingStartDateTime).format('YYYY-MM-DD');
      if (groupedResult[date]) {
        groupedResult[date].push(bookingDetail);
      } else {
        groupedResult[date] = [bookingDetail];
      }
    });

    return groupedResult;
  }

  public compareToString(string1: string, string2: string): boolean {
    if (string1.length > 0 && string2.length > 0) {
      return string1 === string2;
    }
    return false;
  }

  public isBookingCanModify(bookingStatus: BookingStatus): boolean {
    return (
      bookingStatus === BookingStatus.PENDING ||
      bookingStatus === BookingStatus.APPROVED ||
      bookingStatus === BookingStatus.MODIFIED_BY_STUDENT
    );
  }

  public isBookingCanAccept(bookingStatus: BookingStatus): boolean {
    return (
      bookingStatus === BookingStatus.PENDING || bookingStatus === BookingStatus.MODIFIED_BY_STUDENT
    );
  }

  public compareToDateTime(date1: string, date2: string): boolean {
    return new Date(date2) > new Date(date1);
  }

  public isPastDateTime(date: string): boolean {
    return new Date(date) <= new Date();
  }
}
