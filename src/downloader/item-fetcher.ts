import { DownloadHelper } from "./download-helper";
import { AWSGetRequest, GetObjectEvent, ItemFetcherOptions } from "./types";

export class ItemFetcher {
  public readonly options: ItemFetcherOptions;
  private helper: DownloadHelper;
  private request: AWSGetRequest;

  constructor(helper: DownloadHelper, options: ItemFetcherOptions) {
    this.helper = helper;
    this.options = options;

    this.request = this.helper.getObject(this.options.Key, this.options.Range);
    this.request.send();
  }

  start() {
    this.request.send();
  }

  abort() {
    this.request.abort();
  }

  on(event: GetObjectEvent, callback: () => void) {
    this.request.on(event, callback);
  }
}