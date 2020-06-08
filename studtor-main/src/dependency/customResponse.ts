export class CustomResponse {
  status: number;
  message?: string;
  data?: any;
  errors?: any;
}

export class CustomResponseBuilder {
  private response: CustomResponse;

  constructor() {
    this.response = new CustomResponse();
  }

  status(status: number): CustomResponseBuilder {
    this.response.status = status;
    return this;
  }

  message(message: string): CustomResponseBuilder {
    this.response.message = message;
    return this;
  }

  data(data: any): CustomResponseBuilder {
    this.response.data = data;
    return this;
  }

  errors(errors: any): CustomResponseBuilder {
    this.response.errors = errors;
    return this;
  }

  build(): CustomResponse {
    return this.response;
  }
}
