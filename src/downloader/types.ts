export interface DownloadOptions {
  /**
   * maximum connections the downloader can use in parallel
   */
  connections?: number;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  },
  Bucket: string;
  region: string;
}
