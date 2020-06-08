import { EmailTypes } from '../../constant/emailTypes';

export interface MailHandler {
  sendMail(
    toAddress: string,
    name: string,
    otpCode: string,
    activeUrl: string,
    emailType: EmailTypes
  ): Promise<any>;
}
