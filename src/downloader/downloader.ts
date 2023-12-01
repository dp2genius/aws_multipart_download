import { DownloadHelper } from './download-helper';
import { SingleDownloader } from './single-downloader';
import { DownloaderOptions, SingleDownloaderOptions, DownloaderEvent } from './types';

import { _16MB } from './consts';

export class Downloader {
  private readonly helper: DownloadHelper;
  private readonly singleLoaders: Map<string, SingleDownloader> = new Map();
  private readonly eventHandlers: Map<DownloaderEvent, Function[]> = new Map();

  public readonly downloaderOptions: DownloaderOptions;

  constructor(helper: DownloadHelper, options?: DownloaderOptions) {
    this.helper = helper;
    this.downloaderOptions = {
      connections: options?.connections || 15,
      chunkSize: options?.chunkSize || _16MB
    };
  }

  download(key: string, options?: DownloaderOptions): void {
    const singleDownloaderOptions = {
      connections: options?.connections || this.downloaderOptions.connections,
      chunkSize: options?.chunkSize || this.downloaderOptions.chunkSize,
      Key: key,
      eventHandlers: this.eventHandlers
    } as SingleDownloaderOptions;

    this.singleLoaders.set(key, new SingleDownloader(this.helper, singleDownloaderOptions));
  }

  pause(key: string) {
    this.singleLoaders.get(key)?.pause();
  }

  pauseAll() {
    this.singleLoaders.forEach(loader => loader.pause());
  }

  resume(key: string) {
    this.singleLoaders.get(key)?.resume();
  }

  resumeAll() {
    this.singleLoaders.forEach(loader => loader.resume());
  }

  abort(key: string) {
    this.singleLoaders.get(key)?.abort();
  }

  abortAll() {
    this.singleLoaders.forEach(loader => loader.abort());
  }

  reset() {
    this.singleLoaders.forEach(loader => loader.reset());
  }

  on(event: DownloaderEvent, callback: Function) {
    this.eventHandlers.set(event, [...(this.eventHandlers.get(event) || []), callback]);
  }

  off(event: DownloaderEvent, callback: Function) {
    this.eventHandlers.set(
      event,
      this.eventHandlers.get(event)?.filter(func => func !== callback) || []
    );
  }

  getStatus(key: string) {
    return this.singleLoaders.get(key)?.status || 'NoLoader';
  }
}