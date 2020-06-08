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
import DIContainer from '../di-container';
import { ClientService } from '../services/clientService';
import {
  ClientDetailsCreateRequest,
  ClientLoginRequest,
  ClientChangePasswordWhenForgot,
} from '../models/client';
import { SuperController } from './superController';
import { APIResponse } from '../models/apiResponse';
import { LocationCreateRequest, Location } from '../models/location';

@Route('client')
export class ClientController extends SuperController {
  private clientService: ClientService = DIContainer.resolve<ClientService>(ClientService);

  /**
   * Create a Client
   * @param ClientDetailsCreateRequest This is a Client creation request description
   */
  @Post('registration')
  @Tags('Client')
  @SuccessResponse('201', 'Created')
  public async clientRegistration(
    @Body() request: ClientDetailsCreateRequest,
  ): Promise<APIResponse> {
    return this.clientService
      .createClient(request)
      .then((result) => this.sendResponse(result))
      .catch((error) => this.sendResponse(error));
  }

  /**
   * Login a Client
   * @param ClientLoginRequest This is a Client login request description
   */
  @Post('login')
  @Tags('Client')
  public async clientLogin(@Body() request: ClientLoginRequest): Promise<APIResponse> {
    return this.clientService
      .loginClient(request)
      .then((result) => this.sendResponse(result))
      .catch((error) => this.sendResponse(error));
  }

  /**
   * Get client details by clientId
   */
  @Security('jwt')
  @Get('{clientId}')
  @Tags('Client')
  public async getClientDetails(
    @Request() request: any,
    @Path() clientId: string,
  ): Promise<APIResponse> {
    return this.clientService
      .getClientDetails(request, clientId)
      .then((result) => this.sendResponse(result))
      .catch((error) => this.sendResponse(error));
  }

  /**
   * Send forgot password email
   * @param email This is a Client email address
   */
  @Get('forgotPassword/{email}')
  @Tags('Client')
  public async clientForgotPassword(email: string): Promise<APIResponse> {
    return this.clientService
      .clientForgotPassword(email)
      .then((result) => this.sendResponse(result))
      .catch((error) => this.sendResponse(error));
  }

  /**
   * Change password when user forgot password(Without login)
   * @param ClientChangePasswordWhenForgot This is a Client email address
   */
  @Post('changePassword')
  @Tags('Client')
  public async clientChangePassword(
    @Body() request: ClientChangePasswordWhenForgot,
  ): Promise<APIResponse> {
    return this.clientService
      .changePasswordWhenForgot(request)
      .then((result) => this.sendResponse(result))
      .catch((error) => this.sendResponse(error));
  }

  /**
   * Client account activation
   * @param email This is a Client active token send to the email
   * @param activeToken This is a Client active token send to the email
   */
  @Get('active/{email}/{activeToken}')
  @Tags('Client')
  public async clientAccountActivate(email: string, activeToken: string): Promise<APIResponse> {
    return this.clientService
      .clientAccountActivate(email, activeToken)
      .then((result) => this.sendResponse(result))
      .catch((error) => this.sendResponse(error));
  }

  /**
   * @todo need to remove this end point.
   */

  /**
   * Client account delete by email
   * this is for testing purposes only
   */
  @Delete('delete/{email}')
  @Tags('Client')
  public async clientAccountDelete(email: string): Promise<APIResponse> {
    return this.clientService
      .clientAccountDelete(email)
      .then((result) => this.sendResponse(result))
      .catch((error) => this.sendResponse(error));
  }

  /**
   * Add location by Client
   * @param LocationCreateRequest This is a Location creation request
   */
  @Security('jwt', ['client:access'])
  @Post('location')
  @Tags('Client')
  public async addMyLocation(
    @Body() location: LocationCreateRequest,
    @Request() { user }: any,
  ): Promise<APIResponse> {
    return this.clientService
      .addMyLocations(location, user._email)
      .then((result) => this.sendResponse(result))
      .catch((error) => this.sendResponse(error));
  }

  /**
   * Get Location list for Client
   */
  @Security('jwt')
  @Get('{clientId}/locations')
  @Tags('Client')
  public async getClientLocations(
    @Request() { user }: any,
    @Path() clientId: string,
  ): Promise<APIResponse> {
    return this.clientService
      .getClientLocations(user._email, clientId)
      .then((result) => this.sendResponse(result))
      .catch((error) => this.sendResponse(error));
  }

  /** Update a Location
   * @param Location This is a location update request description
   */
  @Security('jwt', ['client:access'])
  @Patch('location')
  @Tags('Client')
  public async updateClientLocation(
    @Request() { user }: any,
    @Body() updateLocations: Location[],
  ): Promise<APIResponse> {
    return this.clientService
      .updateClientLocation(user._email, updateLocations)
      .then((result) => this.sendResponse(result))
      .catch((error) => this.sendResponse(error));
  }

  /**
   * Client location delete
   */
  @Security('jwt', ['client:access'])
  @Delete('location/{locationId}')
  @Tags('Client')
  public async clientLocationDelete(
    @Request() { user }: any,
    @Path() locationId: string,
  ): Promise<APIResponse> {
    return this.clientService
      .clientLocationDelete(user._id, locationId)
      .then((result) => this.sendResponse(result))
      .catch((error) => this.sendResponse(error));
  }

  /**
   * Get all bookings for client
   */
  @Security('jwt')
  @Get('{clientId}/booking')
  @Tags('Client')
  public async getAllBookingDetailsForClient(
    @Path()
    clientId: string,
  ): Promise<APIResponse> {
    return this.clientService
      .getAllBookingDetailsForClient(clientId)
      .then((result) => this.sendResponse(result))
      .catch((error) => this.sendResponse(error));
  }
}
