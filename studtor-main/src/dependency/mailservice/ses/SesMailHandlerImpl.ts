import AWS = require('aws-sdk');
import { injectable } from 'inversify';
import { MailHandler } from '../mailHandler';
import { EmailTypes } from '../../../constant/emailTypes';
import { MessageId } from 'aws-sdk/clients/ses';

AWS.config.update({
  region: 'us-east-1',
});

const sesClient = new AWS.SES();

@injectable()
export class SesMailHandlerImpl implements MailHandler {
  CHAR_SET: 'UTF-8';

  public async sendMail(
    toAddress: string,
    name: string,
    otpCode: string,
    activeUrl: string,
    emailType: EmailTypes,
  ): Promise<MessageId> {
    const params = {
      Destination: {
        ToAddresses: [toAddress],
      },
      Message: {
        Body: {
          Html: {
            Charset: this.CHAR_SET,
            Data: this.generateMessage(name, activeUrl, otpCode, emailType),
          },
          Text: {
            Charset: this.CHAR_SET,
            Data: 'Hello Charith Sample description time 1517831318946',
          },
        },
        Subject: {
          Charset: this.CHAR_SET,
          Data: this.getSubject(emailType),
        },
      },
      Source: 'no_reply@xeptagon.com',
    };

    return new Promise<MessageId>((resolve, reject) => {
      sesClient.sendEmail(params, (err, data) => {
        if (err) {
          console.error('Unable to send mail. Error JSON:', JSON.stringify(err, null, 2));
          reject(err);
        } else {
          console.log('Send mail:', JSON.stringify(data.MessageId));
          resolve(data.MessageId);
        }
      });
    });
  }

  private generateMessage(name: string, activeUrl: string, otpCode: string, emailType: EmailTypes) {
    switch (emailType) {
      case EmailTypes.ACCOUNT_ACTIVATION_CLIENT:
        return (
          '<html><body><h1>Hello ' +
          name +
          "</h1><p style='color:balck'>Please Activate Your Accont: </p><a href=" +
          activeUrl +
          "><input type=button value='Activate Your Account' style='background-color:#3CB371;border: none;padding:5px;font-size:16px;cursor:grab'></a><p style='color:balck'>Enjoy learning with Studtors</p></body></html>"
        );

      case EmailTypes.FORGOT_PASSWORD:
        return (
          "<p style='color:balck'>Your Password reset OTP code is: </p> <p style='color:balck'>" +
          otpCode +
          '</p></body></html>'
        );

      case EmailTypes.ACCOUNT_REGISTRATION_VENDOR:
        return (
          "<p style='color: balck;'>Dear Tutor:</p>" +
          "<p style='color: balck;'>Thank you for registering on Studtors. We are currently validating your information and you will be contacted soon via email by one of Studtor’s representative.</p>" +
          "<p style='color: balck;'>Please be rest assured that your registration information will be kept private and confidentialand will solely be used on Studtors only. We take our data privacy very seriously.</p>" +
          "<p style='color: balck;'>Yours sincerely,<br/>Studtors</p>"
        );

      default:
        console.log('No such template exists!');
        break;
    }
  }

  private getSubject(emailType: EmailTypes) {
    switch (emailType) {
      case EmailTypes.ACCOUNT_ACTIVATION_CLIENT:
        return 'Activate Your Studtors New Account';

      case EmailTypes.FORGOT_PASSWORD:
        return 'Studtors Account Forgot Password';

      case EmailTypes.ACCOUNT_REGISTRATION_VENDOR:
        return 'New login on your Studtors account';

      default:
        return 'Studtors Account Information';
    }
  }
}
