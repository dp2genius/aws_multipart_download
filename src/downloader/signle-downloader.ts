import { DownloadHelper } from './download-helper';
import { ItemFetcher } from './item-fetcher';
import { SingleDownloaderOptions } from './types';

export class SingleDownloader {
  private readonly helper: DownloadHelper;
  public readonly options: SingleDownloaderOptions;

  private chunkIndexToFetch = 0;
  private chunkIndexToWrite = 0;
  private pool = new Map();

  constructor(helper: DownloadHelper, options: SingleDownloaderOptions) {
    this.helper = helper;
    this.options = options;

    // TODO
    this.download();
  }

  download() {
    return new Promise(async (resolve, reject) => {
      const chunkSize = this.options.chunkSize;
      const connections = this.options.connections;

      const fileTotalLength = 10000000; //await this.helper.getFileLength(this.options.Key);
      if (fileTotalLength === undefined) {
        return reject(new Error(`Not able to calculate the total length of the ${this.options.Key}.`));
      }
      const chunkCount = Math.ceil(fileTotalLength / this.options.chunkSize);

      const getChunkRange = (index: number) => {
        const start = chunkSize * index;
        const end = Math.min((index + 1) * chunkSize, fileTotalLength) - 1;
        console.assert(start <= end);
        return `bytes=${start}-${end}`;
      };

      const writeData = () => {
        const buffers = [];

        while ((this.pool.get(this.chunkIndexToWrite)?.data) && (this.chunkIndexToWrite < chunkCount)) {
          buffers.push(this.pool.get(this.chunkIndexToWrite).data);
          this.pool.delete(this.chunkIndexToWrite);

          this.chunkIndexToWrite += 1;
        }

        if (buffers.length) {
          loadData();
          // TODO
          console.log("[write] <", this.chunkIndexToWrite);
        }

        if (this.chunkIndexToWrite >= chunkCount) {
          resolve("success");
        }
      };

      const loadData = () => {
        while ((this.chunkIndexToFetch < chunkCount) && (this.pool.size < connections)) {
          const itemFetcher = new ItemFetcher(this.helper, {
            Key: this.options.Key,
            Range: getChunkRange(this.chunkIndexToFetch)
          });
          this.pool.set(this.chunkIndexToFetch, itemFetcher);

          itemFetcher.on('complete', writeData);

          this.chunkIndexToFetch += 1;
        }
      };

      loadData();
    });
  }

  pause() {

  }

  resume() { }

  abort() { }

  reset() { }
}