import {
  Route,
  Post,
  Tags,
  SuccessResponse,
  Body,
  Security,
  Request,
  Patch,
  Delete,
  Path,
  Get,
} from 'tsoa';
import { SuperController } from './superController';
import { BookingService } from '../services/bookingService';
import DIContainer from '../di-container';
import { BookingCreateRequest, BookingModifyRequest } from '../models/booking';
import { APIResponse } from '../models/apiResponse';

@Route('booking')
export class BookingController extends SuperController {
  private bookingService: BookingService = DIContainer.resolve<BookingService>(BookingService);

  /**
   * Create new booking by client
   * @param BookingCreateRequest
   */
  @Security('jwt', ['client:access'])
  @Post('newBooking')
  @Tags('Booking')
  @SuccessResponse('201', 'Created')
  public async createNewBooking(
    @Body() newBookingRequest: BookingCreateRequest,
    @Request() { user }: any,
  ): Promise<APIResponse> {
    return this.bookingService
      .createNewBooking(newBookingRequest, user._email)
      .then((result) => this.sendResponse(result))
      .catch((error) => this.sendResponse(error));
  }

  /**
   * Modify booking by client
   * @param BookingModifyRequest
   */
  @Security('jwt', ['client:access'])
  @Patch('modify')
  @Tags('Booking')
  public async modifyBooking(
    @Body() bookingModifyRequest: BookingModifyRequest,
    @Request() { user }: any,
  ): Promise<APIResponse> {
    return this.bookingService
      .modifyBooking(bookingModifyRequest, user._id)
      .then((result) => this.sendResponse(result))
      .catch((error) => this.sendResponse(error));
  }

  /**
   * Cancel booking by client/vendor
   */
  @Security('jwt')
  @Delete('cancel/{bookingId}')
  @Tags('Booking')
  public async cancelBooking(
    @Request() request: any,
    @Path() bookingId: string,
  ): Promise<APIResponse> {
    return this.bookingService
      .cancelBooking(request, bookingId)
      .then((result) => this.sendResponse(result))
      .catch((error) => this.sendResponse(error));
  }

  /**
   * Accept booking by vendor
   */
  @Security('jwt', ['vendor:access'])
  @Get('accept/{bookingId}')
  @Tags('Booking')
  public async acceptBooking(
    @Path() bookingId: string,
    @Request() { user }: any,
  ): Promise<APIResponse> {
    return this.bookingService
      .acceptBooking(bookingId, user._id)
      .then((result) => this.sendResponse(result))
      .catch((error) => this.sendResponse(error));
  }

  /**
   * Decline booking by vendor
   */
  @Security('jwt', ['vendor:access'])
  @Get('decline/{bookingId}')
  @Tags('Booking')
  public async declineBooking(
    @Path() bookingId: string,
    @Request() { user }: any,
  ): Promise<APIResponse> {
    return this.bookingService
      .declineBooking(bookingId, user._id)
      .then((result) => this.sendResponse(result))
      .catch((error) => this.sendResponse(error));
  }
}
