import config from "./config";
import { getS3FileSize, getObject, s3 } from './helper';

function log(...args) {
  console.log(...args);
}

export const downloadFiles = (setComments, setSize) => async () => {
  /** helper function to display information */
  let pushComment = str => setComments(comments => [...comments, str]);

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

      /** Read data of a given chunk index */
      function getDataGivenIndex(index) {
        return getObject(config.bucketName, config.Key, byteRangeOfChunk(index));
      }

      /** Write the given buffers to local using `writer` */
      async function writeToSave(buffers) {
        for (let i = 0, length = buffers.length; i < length; i++) {
          await writer.write(buffers[i]);

          // Set size
          setSize(size => size + buffers[i].length);
        }
      }

      class ItemReader {
        loaded = false;
        data = null;
        chunkIndex = null;

        constructor(index) {
          log('[start_chunk_read]', index);
          this.chunkIndex = index;
          
          let _this = this;
          getDataGivenIndex(index)
            .then(response => {
              log('[chunk_read_success]', index);
              _this.data = response;
              _this.loaded = true;

              tryToWriteDate();
            })
            .catch(err => {
              console.error("[Error]", err);
            });
        }
      }

      //
      // End helper functions
      
      pushComment(`The file is ${SIZE} bytes`);
      pushComment(`There are all ${length} chunks`);
      
      pushComment('Fetching...');
      
      //

      let pool = new Map();
      let maxBatchSize = config.maxBatchSize;
      let chunkIndexToFetch = 0;

      let chunkIndexToWrite = 0;

      async function tryToWriteDate() {
        // dev
        let dev = [];

        let buffers = [];
        while ((pool.get(chunkIndexToWrite)?.loaded) && (chunkIndexToWrite < length)) {
          // dev
          dev.push(chunkIndexToWrite);

          buffers.push(pool.get(chunkIndexToWrite).data);
          pool.delete(chunkIndexToWrite);

          chunkIndexToWrite += 1;
        }
        if (buffers.length) {
          loadData();

          log("[trying to write]", dev);
          await writeToSave(buffers);
          log("[successfully write]", dev);
        }

        // Wrote last chunk
        if (chunkIndexToWrite >= length) {
          resolve();
        }
      }

      function loadData() {
        while ((chunkIndexToFetch < length) && (pool.size < maxBatchSize)) {
          pool.set(chunkIndexToFetch, new ItemReader(chunkIndexToFetch));
          chunkIndexToFetch += 1;
        }
      }

      loadData();
    });
  };
};