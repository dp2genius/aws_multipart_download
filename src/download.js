import config from "./config";
import { getS3FileSize, getObject } from './helper';

export const downloadFiles = async (onmessage = () => {}) => {
  // Main procedure

  let fileSave = await showSaveFilePicker();
  let writer = await fileSave.createWritable();
  await downloadSimultaneously();
  writer.close().then(() => alert('[complete]'));

  // End procedure

  function downloadSimultaneously() {
    return new Promise(async resolve => {
      /** the whole number of bytes of the file */
      let SIZE = await getS3FileSize({ Bucket: config.bucketName, Key: config.Key });

      /** the numger of chunks */
      let length = Math.ceil(SIZE / config.ChunkSize);

      /** Get bytes range of a given chunk index */
      function byteRangeOfChunk(chunkIndex) {
        let start = chunkIndex * config.ChunkSize;
        let end = Math.min((chunkIndex + 1) * config.ChunkSize, SIZE) - 1;
        console.assert(start <= end);
        return `bytes=${start}-${end}`;
      }

      /**
       * Read data of a given chunk index
       * @returns binary data (array buffer)
       */
      function getBinaryDataOfChunk(index) {
        return getObject(config.bucketName, config.Key, byteRangeOfChunk(index));
      }

      /** Write the given buffers to local using `writer` */
      async function writeDataToLocalFile(buffers) {
        for (let i = 0, length = buffers.length; i < length; i++) {
          await writer.write(buffers[i]);

          // Set size
          onmessage({
            type: 'downloaded',
            payload: buffers[i].length
          });
        }
      }

      /**
       * Item fetcher, every fetching data from s3 will be done by this item fetcher.
       * Given a index of chunk to fetch, it starts fetching automatically and as soon as
       * fetching is ended it calls {@link tryToWriteData} function, which trys to loaded
       * data to local file.
       */
      class ItemFetcher {
        loaded = false;
        data = null;
        chunkIndex = null;

        constructor(index) {
          this.chunkIndex = index;
          
          let _this = this;
          getBinaryDataOfChunk(index)
            .then(response => {
              _this.data = response;
              _this.loaded = true;

              tryToWriteData();
            })
            .catch(err => {
              console.error("[Error]", err);
            });
        }
      }

      //
      // End helper functions

      onmessage({ type: 'size', payload: SIZE });

      let pool = new Map(); // a pool that holds ItemFetchers
      let maxPoolSize = config.maxPoolSize;
      /**
       * Next chunk index to fetch.  
       * `chunkIndexToFetch = 10` means that chunks 0-9 is already fetched or
       * under progress.
       */ 
      let chunkIndexToFetch = 0;
      /**
       * Next chunk index to write to local file.  
       * `chunkIndexToWrite = 10` means that chunks 0-9 is already written to local, and
       * `ItemFetchers` 0 - 9 are removed from `pool`.
       */
      let chunkIndexToWrite = 0;

      async function tryToWriteData() {
        let buffers = [];

        // Beginning at `chunkIndexToWrite`, select adjacent `ItemFetcher`s, which is fetched
        // successfully, at much as possible to write them to local file.
        // Selecting adjacent `ItemFetcher`s ensure that all bytes are written in correct order.
        while ((pool.get(chunkIndexToWrite)?.loaded) && (chunkIndexToWrite < length)) {
          buffers.push(pool.get(chunkIndexToWrite).data);
          pool.delete(chunkIndexToWrite);

          chunkIndexToWrite += 1;
        }
        if (buffers.length) {
          // Since some of `ItemFetcher`s are successfully downloaded and removed from `pool`
          // We need to start `ItemFetcher` more
          loadData();
          await writeDataToLocalFile(buffers);
        }

        // Wrote last chunk
        if (chunkIndexToWrite >= length) {
          resolve();
        }
      }

      /**
       * Make new {@link ItemFetcher}s, and add them to {@link pool}.
       */
      function loadData() {
        while ((chunkIndexToFetch < length) && (pool.size < maxPoolSize)) {
          pool.set(chunkIndexToFetch, new ItemFetcher(chunkIndexToFetch));
          chunkIndexToFetch += 1;
        }
      }

      loadData();
    });
  };
};