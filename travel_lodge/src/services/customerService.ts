import { User } from "../models/customer";
import { injectable } from "inversify";

@injectable()
export class CustomerService {
  get(id: number): PromiseLike<User> {
    return new Promise((resolve, reject) => {
      resolve({
        id,
        email: "jayanisumudini@gmail.com",
        phoneNumbers: ["123445", "12466"],
      });
    });
  }
}
