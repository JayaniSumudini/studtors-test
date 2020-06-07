import { Controller, Get, Route, Tags } from "tsoa";
import "reflect-metadata";
import { User } from "../models/customer";
import { CustomerService } from "../services/customerService";
import DIContainer from "../di-container";

@Route("users")
@Tags("Customer")
export class CustomerController extends Controller {
  private userService: CustomerService = DIContainer.resolve<CustomerService>(
    CustomerService
  );

  @Get("{id}")
  public async getUser(id: number): Promise<User> {
    return await this.userService.get(id);
  }
}
