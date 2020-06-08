import { injectable } from 'inversify';
import { v4 as uuidv4 } from 'uuid';

@injectable()
export class ActivateDetailsGenerator {
  public getActivateDetails(email: string): any {
    const activeToken: string = `${uuidv4()}`;
    const activeUrl = `http://35.172.223.128:3001/v1/client/active/${email}/${activeToken}`;
    return { activeUrl, activeToken };
  }
}
