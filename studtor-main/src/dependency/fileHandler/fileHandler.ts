export interface FileHandler {
  uploadImage(
    base64EncodedImage: string,
    userId: string,
    suffix: string
  ): Promise<string>;

  getS3SignedUrl(s3Key: string): Promise<string>;
}
