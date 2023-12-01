import { DownloadHelper } from './download-helper';
import { ItemFetcher } from './item-fetcher';
import { ResponseData, SingleDownloaderOptions, SingleDownloaderStatus, AWSError } from './types';

export class SingleDownloader {
  private readonly helper: DownloadHelper;
  public readonly options: SingleDownloaderOptions;

  public status: SingleDownloaderStatus = 'Idle';

  private chunkIndexToFetch = 0;
  private chunkIndexToWrite = 0;
  private pool = new Map<number, ItemFetcher>();

  private fileTotalLength?: number;
  private loaded = 0;

  private fileSaver: FileSystemFileHandle | null = null;
  private writer?: FileSystemWritableFileStream;

  private id?: NodeJS.Timer;

  constructor(helper: DownloadHelper, options: SingleDownloaderOptions) {
    this.helper = helper;
    this.options = options;

    this.download();
  }

  download() {
    if (!['Idle', 'Paused'].includes(this.status)) {
      return console.error(`Not able to download ${this.options.Key}. Current state of the is ${this.status}.`);
    }

    return new Promise(async (resolve, reject) => {
      if (this.status !== 'Paused') {
        this.fileSaver = await showSaveFilePicker();
        this.writer = await this.fileSaver.createWritable();
      }

      this.status = 'Downloading';

      // If it's the first downloading
      if (this.fileTotalLength === undefined) {
        this.fileTotalLength = await this.helper.getFileLength(this.options.Key);

        // Not able to get the file length
        if (this.fileTotalLength === undefined) {
          return reject(new Error(`Not able to get the total length of the file: ${this.options.Key}`));
        }
      }

      const fileTotalLength = this.fileTotalLength;
      const chunkSize = this.options.chunkSize;
      const connections = this.options.connections;

      const chunkCount = Math.ceil(fileTotalLength / this.options.chunkSize);

      /** Get byte range of a given chunk index */
      const getChunkRange = (index: number) => {
        const start = chunkSize * index;
        const end = Math.min((index + 1) * chunkSize, fileTotalLength) - 1;
        console.assert(start <= end);
        return `bytes=${start}-${end}`;
      };

      /** Write fetched data to local writer */
      const writeData = async () => {
        console.assert(this.writer !== undefined);
        if (["Aborted"].includes(this.status)) {
          return resolve("Aborted");
        }

        const buffers = [];

        while (this.chunkIndexToWrite < chunkCount) {
          const data = this.pool.get(this.chunkIndexToWrite)?.data;
          if (data === undefined) break;

          buffers.push(data);

          this.pool.delete(this.chunkIndexToWrite);
          this.chunkIndexToWrite += 1;
        }

        let length = buffers.length;
        if (length) { // If there's data to write to local
          if (this.writer !== undefined) {
            for (let i = 0; i < length; i++) {
              await this.writer.write(buffers.at(i)?.Body as ArrayBuffer);
              this.loaded += buffers.at(i)?.ContentLength as number;

              // Emit possible 'progress' events
              this.options.eventHandlers.get('progress')
                ?.forEach(callback => callback(this.options.Key, this.loaded / (this.fileTotalLength as number)));
            }
          }
          if (this.status === 'Pausing') {
            console.log(this.chunkIndexToFetch, this.chunkIndexToWrite);
            if (this.chunkIndexToFetch === this.chunkIndexToWrite) {
              this.status = 'Paused';
            }
          } else {
            loadData();
          }
        }

        if (this.chunkIndexToWrite >= chunkCount) {
          this.writer?.close()
            .then(() => {
              this.status = 'Success';
              this.options.eventHandlers.get('complete')
                ?.forEach(callback => callback(this.options.Key));
              resolve("success");
              clearInterval(this.id);
            })
            .catch(reject);
        }
      };

      const loadData = () => {
        while ((this.chunkIndexToFetch < chunkCount) && (this.pool.size < connections)) {
          // Create new as many fetches as possible

          // Create a new item fetcher
          const itemFetcher = new ItemFetcher(this.helper, {
            Key: this.options.Key,
            Range: getChunkRange(this.chunkIndexToFetch),
            chunkIndex: this.chunkIndexToFetch
          });
          this.pool.set(this.chunkIndexToFetch, itemFetcher); // Register the fetcher to pool

          itemFetcher.on('success', () => { // fetcher successfully pulled data
            writeData(); // run writer

            // Dev
            // @ts-ignore
            // if (window.fails[`${this.options.Key}: ${itemFetcher.chunkIndex}`]) {
            // @ts-ignore
            // window.fails[`${this.options.Key}: ${itemFetcher.chunkIndex}`] = false;
            // }
            // End Dev
          });

          itemFetcher.on('retry', () => { // fetcher did not pulled data
            if (this.status === 'Aborted') {
              return;
            }

            // Dev
            // @ts-ignore
            // window.fails[`${this.options.Key}: ${itemFetcher.chunkIndex}`] = window.fails[`${this.options.Key}: ${itemFetcher.chunkIndex}`] ? window.fails[`${this.options.Key}: ${itemFetcher.chunkIndex}`] + 1 : 1;
            // End Dev

            // try agian after a certain period of time
            setTimeout(() => {
              this.pool.set(
                itemFetcher.chunkIndex,
                new ItemFetcher(this.helper, itemFetcher.options, itemFetcher.timeout + 500),
              );
            }, itemFetcher.timeout);
          });

          itemFetcher.on('error', (err: AWSError) => {
            if (err.code !== 'RequestAbortedError') {
              this.options.eventHandlers.get('error')
                ?.forEach(callback => callback(this.options.Key));
              debugger;
            }
          });

          this.chunkIndexToFetch += 1;
        }
      };

      loadData();
      this.id = setInterval(writeData, 3000);
    });
  }

  pause() {
    console.assert(this.status === 'Downloading');
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
    if (!['Downloading', 'Pausing', 'Paused'].includes(this.status)) {
      return console.warn(`Current loader state for '${this.options.Key}' is '${this.status}'`);
    }
    this.status = 'Aborted';
    this.pool.forEach(request => request.abort());
    this.writer?.close();
  }

  reset() {
    this.abort();
    this.status = 'Idle';
    this.pool.clear();
  }
}