import AWS = require('aws-sdk');
import { injectable } from 'inversify';
import { FileHandler } from '../fileHandler';
import { ManagedUpload } from 'aws-sdk/lib/s3/managed_upload';

AWS.config.update({
  region: 'us-east-1',
});

const S3_BUCKET = 'studtors';
const s3BucketClient = new AWS.S3();

@injectable()
export class S3FileHandlerImpl implements FileHandler {
  public async uploadImage(
    base64EncodedImage: string,
    userId: string,
    suffix: string
  ): Promise<string> {
    const type = base64EncodedImage.split(';')[0].split('/')[1];
    const buf = new Buffer(
      base64EncodedImage.replace(/^data:image\/\w+;base64,/, ''),
      'base64'
    );

    const params = {
      Bucket: S3_BUCKET,
      Key: this.getUniqueFilename(userId, suffix, type),
      Body: buf,
      ContentEncoding: 'base64',
      ContentType: `image/${type}`,
    };

    return new Promise<string>((resolve, reject) => {
      s3BucketClient.upload(
        params,
        (err: Error, data: ManagedUpload.SendData) => {
          if (err) {
            console.error(
              'Unable to add image. Error JSON:',
              JSON.stringify(err, null, 2)
            );
            reject(err);
          } else {
            console.log('Added image:', JSON.stringify(data));
            resolve(data.Key);
          }
        }
      );
    });
  }

  public async getS3SignedUrl(s3Key: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      s3BucketClient.getSignedUrl(
        'getObject',
        {
          Bucket: S3_BUCKET,
          Key: s3Key,
          Expires: 60 * 60 * 6, // 6 hours
        },
        (err: Error, url: string) => {
          if (err) {
            console.error(
              'Unable to add image. Error JSON:',
              JSON.stringify(err, null, 2)
            );
            reject(err);
          } else {
            console.log('Added image:', JSON.stringify(url));
            resolve(url);
          }
        }
      );
    });
  }

  private getUniqueFilename(
    userId: string,
    suffix: string,
    type: string
  ): string {
    return `${userId}_${suffix}.${type}`;
  }
}
