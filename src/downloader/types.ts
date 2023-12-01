import AWS from 'aws-sdk';

export interface DownloadHelperOptions {
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  },
  Bucket: string;
  region: string;
}

export interface DownloaderOptions {
  /**
   * maximum connections the downloader can use in parallel
   */
  connections?: number;
  chunkSize?: number;
}

export interface SingleDownloaderOptions {
  connections: number;
  chunkSize: number;
  Key: string;
  eventHandlers: Map<DownloaderEvent, Function[]>;
}

export interface ItemFetcherOptions {
  Key: string,
  Range: string,
  chunkIndex: number
}

export type AWSGetRequest = AWS.Request<AWS.S3.GetObjectOutput, AWS.AWSError>;

export type GetObjectEvent = 'error' | 'retry' | 'complete' | 'httpDownloadProgress';

/** Single loader state */
export type SingleDownloaderStatus = 'Idle' | 'Downloading' | 'Pausing' | 'Paused' | 'Success' | 'Aborted' | 'Error';

export type AWSError = AWS.AWSError;

export type DownloaderEvent = 'progress' | 'error' | 'complete';

// ItemFetcher types

/** Response data type */
export type ResponseData = AWS.S3.GetObjectOutput | void;
