import { DownloadHelper } from './download-helper';
import { SingleDownloader } from './signle-downloader';
import { DownloaderOptions, SingleDownloaderOptions } from './types';

import { _16MB } from './consts';

export class Downloader {
  private readonly helper: DownloadHelper;
  private readonly sigleLoaders: SingleDownloader[];

  public readonly downloaderOptions: DownloaderOptions;

  constructor(helper: DownloadHelper, options?: DownloaderOptions) {
    this.helper = helper;
    this.sigleLoaders = [];
    this.downloaderOptions = {
      connections: options?.connections || 15,
      chunkSize: options?.chunkSize || _16MB
    };
  }

  download(key: string, options?: DownloaderOptions): void {
    const singleDownloaderOptions = {
      connections: options?.connections || this.downloaderOptions.connections,
      chunkSize: options?.chunkSize || this.downloaderOptions.chunkSize,
      Key: key
    } as SingleDownloaderOptions;

    // TODO
    this.sigleLoaders.push(new SingleDownloader(this.helper, singleDownloaderOptions));
  }
}