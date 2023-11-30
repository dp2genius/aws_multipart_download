import { DownloadHelper } from "./download-helper";
import { AWSGetRequest, ResponseData, ItemFetcherOptions } from "./types";

export class ItemFetcher {
  public data?: ResponseData;
  public on?: Function;

  private request: AWSGetRequest;

  constructor(helper: DownloadHelper, options: ItemFetcherOptions) {
    this.request = helper.getObject(options.Key, options.Range);

    this.request.on('complete', (res) => {
      this.data = res.data?.Body;
    });

    this.start();

    this.on = this.request.on;
  }

  start() {
    this.request.send();
  }

  abort() {
    this.request.abort();
  }
}