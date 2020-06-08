import { Controller } from 'tsoa';
import { CustomResponse } from '../dependency/customResponse';
import { APIResponse } from '../models/apiResponse';

export class SuperController extends Controller {
  public sendResponse(customResponse: CustomResponse): APIResponse {
    this.setStatus(customResponse.status);
    const response: APIResponse = {
      message: customResponse.message,
      data: customResponse.data,
      errors: customResponse.errors,
    };

    return response;
  }
}
