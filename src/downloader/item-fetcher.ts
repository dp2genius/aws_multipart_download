import { DownloadHelper } from "./download-helper";
import { AWSGetRequest, GetObjectEvent, ItemFetcherOptions } from "./types";

export class ItemFetcher {
  public readonly options: ItemFetcherOptions;
  public data = null;
  private helper: DownloadHelper;
  private request: AWSGetRequest;

  constructor(helper: DownloadHelper, options: ItemFetcherOptions) {
    const _this = this;

    this.helper = helper;
    this.options = options;

    this.request = this.helper.getObject(this.options.Key, this.options.Range);
    this.request.send();

    this.request.on('complete', function () {
      const res = arguments[0];
      _this.data = res.data.Body;
    });

    this.request.on('retry', () => {
      setTimeout(() => _this.request.send(), 500);
    });
  }

  start() {
    this.request.send();
  }

  abort() {
    this.request.abort();
  }

  on(event: GetObjectEvent, callback: Function) {
    // @ts-ignore
    this.request.on(event, callback);
  }
}