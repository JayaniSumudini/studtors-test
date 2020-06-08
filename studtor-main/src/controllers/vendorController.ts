import {
  Body,
  Post,
  Route,
  Tags,
  Get,
  Request,
  Security,
  SuccessResponse,
  Delete,
  Patch,
  Path,
} from 'tsoa';
import 'reflect-metadata';

import { SuperController } from './superController';
import {
  VendorDetailsCreateRequest,
  VendorLoginRequest,
  VendorChangePasswordWhenForgot,
  VendorDetailsUpdateRequest,
} from '../models/vendor';
import { VendorService } from '../services/vendorService';
import DIContainer from '../di-container';
import { APIResponse } from '../models/apiResponse';

@Route('vendor')
export class VendorController extends SuperController {
  private vendorService: VendorService = DIContainer.resolve<VendorService>(VendorService);

  /**
   * Create a Vendor
   * @param VendorDetailsCreateRequest This is a Vendor creation request description
   */
  @Post('registration')
  @Tags('Vendor')
  @SuccessResponse('201', 'Created')
  public async vendorRegistration(
    @Body() request: VendorDetailsCreateRequest,
  ): Promise<APIResponse> {
    return this.vendorService
      .createVendor(request)
      .then((result) => this.sendResponse(result))
      .catch((error) => this.sendResponse(error));
  }

  /**
   * Login a Vendor
   * @param VendorLoginRequest This is a Vendor login request description
   */
  @Post('login')
  @Tags('Vendor')
  public async vendorLogin(@Body() request: VendorLoginRequest): Promise<APIResponse> {
    return this.vendorService
      .loginVendor(request)
      .then((result) => this.sendResponse(result))
      .catch((error) => this.sendResponse(error));
  }

  /**
   * Get Vendor details by vendorId
   */
  @Security('jwt')
  @Get('{vendorId}')
  @Tags('Vendor')
  public async getVendorDetails(
    @Request() request: any,
    @Path() vendorId: string,
  ): Promise<APIResponse> {
    return this.vendorService
      .getVendorDetails(request, vendorId)
      .then((result) => this.sendResponse(result))
      .catch((error) => this.sendResponse(error));
  }

  /**
   * @todo need to remove this end point.
   */

  /**
   * Vendor account delete by email
   * this is for testing purposes only
   */
  @Delete('delete/{email}')
  @Tags('Vendor')
  public async vendorAccountDelete(@Path() email: string): Promise<APIResponse> {
    return this.vendorService
      .vendorAccountDelete(email)
      .then((result) => this.sendResponse(result))
      .catch((error) => this.sendResponse(error));
  }

  /**
   * Send forgot password email
   * @param email This is a Vendor email address
   */
  @Get('forgotPassword/{email}')
  @Tags('Vendor')
  public async vendorForgotPassword(@Path() email: string): Promise<APIResponse> {
    return this.vendorService
      .vendorForgotPassword(email)
      .then((result) => this.sendResponse(result))
      .catch((error) => this.sendResponse(error));
  }

  /**
   * Change password when user forgot password(Without login)
   * @param VendorChangePasswordWhenForgot This is a Vendor email address
   */
  @Post('changePassword')
  @Tags('Vendor')
  public async vendorChangePassword(
    @Body() request: VendorChangePasswordWhenForgot,
  ): Promise<APIResponse> {
    return this.vendorService
      .changePasswordWhenForgot(request)
      .then((result) => this.sendResponse(result))
      .catch((error) => this.sendResponse(error));
  }

  /** Update Vendor details
   * @param VendorDetailsUpdateRequest This is a vendor details update request description
   */
  @Security('jwt', ['vendor:access'])
  @Patch('updateDetails')
  @Tags('Vendor')
  public async updateVendorDetails(
    @Request() { user }: any,
    @Body() vendorDetailsUpdateRequest: VendorDetailsUpdateRequest,
  ): Promise<APIResponse> {
    return this.vendorService
      .updateVendorDetails(user._email, vendorDetailsUpdateRequest)
      .then((result) => this.sendResponse(result))
      .catch((error) => this.sendResponse(error));
  }

  /**
   * Get all Vendors
   */
  @Security('jwt', ['client:access'])
  @Get('vendors/{itemsPerPage}/{lastEvaluatedKey}')
  @Tags('Vendor')
  public async getAllVendorsWithLastEvaluatedKey(
    @Path()
    itemsPerPage: number,
    @Path() lastEvaluatedKey: string,
    @Request() { user }: any,
  ): Promise<APIResponse> {
    return this.vendorService
      .getAllVendors(user._email, itemsPerPage, lastEvaluatedKey)
      .then((result) => this.sendResponse(result))
      .catch((error) => this.sendResponse(error));
  }

  /**
   * Get all Vendors
   */
  @Security('jwt', ['client:access'])
  @Get('vendors/{itemsPerPage}')
  @Tags('Vendor')
  public async getAllVendorsWithoutLastEvaluatedKey(
    @Path()
    itemsPerPage: number,
    @Request() { user }: any,
  ): Promise<APIResponse> {
    return this.vendorService
      .getAllVendors(user._email, itemsPerPage)
      .then((result) => this.sendResponse(result))
      .catch((error) => this.sendResponse(error));
  }

  /**
   * Get Location list for Vendor
   */
  @Security('jwt')
  @Get('{vendorId}/locations')
  @Tags('Vendor')
  public async getVendorLocations(
    @Request() { user }: any,
    @Path() vendorId: string,
  ): Promise<APIResponse> {
    return this.vendorService
      .getVendorLocations(user._email, vendorId)
      .then((result) => this.sendResponse(result))
      .catch((error) => this.sendResponse(error));
  }

  /**
   * Get all bookings for vendor
   */
  @Security('jwt')
  @Get('{vendorId}/booking')
  @Tags('Vendor')
  public async getAllBookingDetailsForVendor(
    @Path()
    vendorId: string,
  ): Promise<APIResponse> {
    return this.vendorService
      .getAllBookingDetailsForVendor(vendorId)
      .then((result) => this.sendResponse(result))
      .catch((error) => this.sendResponse(error));
  }
}
