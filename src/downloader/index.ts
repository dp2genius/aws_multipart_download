import { DownloadOptions } from './types';

import * as A from '@smithy/signature-v4'
console.log(A);

export class Downloader {
  public readonly options: DownloadOptions;

  constructor(options: DownloadOptions) {
    this.options = options;
  }

  download(key: string): void {

    (async () => {

    })()

  }
}