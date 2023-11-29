import { DownloadHelper } from './download-helper';
import { ItemFetcher } from './item-fetcher';
import { SingleDownloaderOptions, SingleDownloaderStatus } from './types';

export class SingleDownloader {
  private readonly helper: DownloadHelper;
  public readonly options: SingleDownloaderOptions;

  public status: SingleDownloaderStatus = 'Idle';

  private chunkIndexToFetch = 0;
  private chunkIndexToWrite = 0;
  private pool = new Map();

  private fileTotalLength: number | null | undefined = null;
  private loaded = 0;

  private fileSaver: FileSystemFileHandle | null = null;
  private writer: FileSystemWritableFileStream | null = null;

  constructor(helper: DownloadHelper, options: SingleDownloaderOptions) {
    this.helper = helper;
    this.options = options;

    this.download();
  }

  download() {
    if (!['Idle', 'Paused'].includes(this.status)) {
      return console.error(`Not able to download ${this.options.Key}. Current state is ${this.status}.`);
    }
    return new Promise(async (resolve, reject) => {
      this.status = 'Downloading';

      this.fileSaver = await showSaveFilePicker();
      this.writer = await this.fileSaver.createWritable();

      if (this.fileTotalLength === null) {
        this.fileTotalLength = await this.helper.getFileLength(this.options.Key);
      }

      const fileTotalLength = this.fileTotalLength;
      const chunkSize = this.options.chunkSize;
      const connections = this.options.connections;

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

      const writeData = async () => {
        const buffers = [];

        while ((this.pool.get(this.chunkIndexToWrite)?.data) && (this.chunkIndexToWrite < chunkCount)) {
          buffers.push(this.pool.get(this.chunkIndexToWrite).data);
          this.pool.delete(this.chunkIndexToWrite);

          this.chunkIndexToWrite += 1;
        }

        if (buffers.length) {
          if (this.status === 'Pausing') {
            this.status = 'Paused';
          } else {
            loadData();
            let length = buffers.length;
            for (let i = 0; i < length; i++) {
              if (this.writer) {
                await this.writer.write(buffers[i]);
              }
            }
          }
        }

        if (this.chunkIndexToWrite >= chunkCount) {
          this.writer?.close()
            .then(() => {
              this.status = 'Success';
              resolve("success");
            })
            .catch(reject);
        }
      };

      const loadData = () => {
        while ((this.chunkIndexToFetch < chunkCount) && (this.pool.size < connections)) {
          const itemFetcher = new ItemFetcher(this.helper, {
            Key: this.options.Key,
            Range: getChunkRange(this.chunkIndexToFetch)
          });
          this.pool.set(this.chunkIndexToFetch, itemFetcher);

          itemFetcher.on('complete', async () => {
            await writeData();
            this.options.eventHandlers.get('complete')
              ?.forEach(callback => callback(this.options.Key));

            this.options.eventHandlers.get('progress')
              // @ts-ignore
              ?.forEach(callback => callback(this.options.Key, this.loaded / this.fileTotalLength));
          });

          itemFetcher.on('error', () => {
            this.options.eventHandlers.get('error')
              ?.forEach(callback => callback(this.options.Key));
          });

          this.chunkIndexToFetch += 1;
        }
      };

      loadData();
    });
  }

  pause() {
    if (this.status === 'Downloading') {
      this.status = 'Pausing';
    }
  }

  resume() {
    if (this.status === 'Paused') {
      this.download();
    }
  }

  abort() {
    if (this.status === 'Downloading') {
      this.status = 'Aborted';
      this.pool.forEach(request => request.abort());
    }
  }

  reset() {
    this.status = 'Idle';
    this.pool.clear();
  }
}