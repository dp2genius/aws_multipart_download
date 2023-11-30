import { DownloadHelper } from "./download-helper";
import { AWSGetRequest, ResponseData, ItemFetcherOptions } from "./types";

export class ItemFetcher {
  public data?: ResponseData;
  public on: Function;
  public chunkIndex: number;
  public options: ItemFetcherOptions;
  public timeout: number = 500;

  private request: AWSGetRequest;

  constructor(helper: DownloadHelper, options: ItemFetcherOptions, timeout: number = 500) {
    this.options = options;
    this.chunkIndex =options.chunkIndex;
    this.timeout = Math.min(3500, timeout);
    this.request = helper.getObject(options.Key, options.Range);

    this.request.on('complete', (res) => {
      this.data = res.data;
    });

    this.start();

    this.on = this.request.on.bind(this.request);
  }

  start() {
    this.request.send();
  }

  abort() {
    this.request.abort();
  }
}