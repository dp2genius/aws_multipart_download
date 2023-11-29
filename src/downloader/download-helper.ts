import AWS from 'aws-sdk';
import { AWSGetRequest, DownloadHelperOptions } from "./types";

export class DownloadHelper {
  private readonly options: DownloadHelperOptions;
  private readonly S3: AWS.S3;
  private readonly Bucket: string;

  constructor(options: DownloadHelperOptions) {
    this.options = options;

    this.S3 = new AWS.S3({
      credentials: options.credentials,
      region: options.region
    });

    this.Bucket = options.Bucket;
  }

  /**
   * Get file length or undefined if Key is not valid
   */
  getFileLength(Key: string): Promise<number | undefined> {
    return this.S3.headObject({ Bucket: this.Bucket, Key}).promise()
      .then(res => res.ContentLength)
      .catch(err => undefined);
  }

  getObject(Key: string, Range: string): AWSGetRequest {
    return this.S3.getObject({
      Bucket: this.Bucket,
      Key,
      Range
    });
  }
}