import config from "./config";
import { getS3FileSize, getObject, s3 } from './helper';

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
      let pool = new Map();
      window.pool = pool;
      let chunkIndexToPush = 0;
      let indexToWriteFrom = 0;
      let writing = false;
      let maxBatchSize = 10;
      let id = null;

      /** the whole number of bytes of the file */
      let SIZE = 609823123 || await getS3FileSize({ Bucket: config.bucketName, Key: config.Key });

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

      /** Fetch maximum next batch */
      function fetchNextOne() {
        if ((chunkIndexToPush >= length) && (!pool.size)) {
          clearInterval(id);
          return resolve();
        }
        if (pool.size >= maxBatchSize) {
          return;
        }
        while((pool.size <= maxBatchSize) && (chunkIndexToPush < length)) {
          pool.set(chunkIndexToPush, new ItemReader(chunkIndexToPush));
          ++chunkIndexToPush;
        }
      }

      /** Write the given buffers to local using `writer` */
      async function writeToSave(buffers) {
        for (let i = 0, length = buffers.length; i < length; i++) {
          await writer.write(buffers[i]);

          // Set size
          setSize(size => size + buffers[i].length);
        }
      }

      async function writableNow() {
        if (writing === true) return;

        console.log(`[pool.get(${indexToWriteFrom}).lock]`, pool.get(indexToWriteFrom)?.lock);

        let dev = []; // dev

        let buffers = [];
        while(pool.get(indexToWriteFrom)?.lock) {
          buffers.push(pool.get(indexToWriteFrom).data);
          pool.delete(indexToWriteFrom);

          dev.push(indexToWriteFrom);

          indexToWriteFrom++;
        }

        if (buffers.length) {
          console.log("[writing chunk]", dev);

          writing = true;
          await writeToSave(buffers);
          writing = false;

          console.log("[writing chunk success]", dev);

          fetchNextOne();
        }
      }

      class ItemReader {
        lock = false;
        data = null;
        chunkIndex = null;

        constructor(index) {
          console.log('[start fetching]', index);
          let _this = this;
          _this.chunkIndex = index;
          _this.promise = getDataGivenIndex(index)
            .then(response => {
              console.log('[chunk_read_success]', index);
              _this.data = response;
              _this.lock = true;

              writableNow(index);
            });
        }
      }

      pushComment(`The file is ${SIZE} bytes`);
      pushComment(`There are all ${length} chunks`);

      pushComment('Fetching...');

      while ((chunkIndexToPush < maxBatchSize) && (chunkIndexToPush < length)) {
        pool.set(chunkIndexToPush, new ItemReader(chunkIndexToPush++));
      }

      id = setInterval(writableNow, 3000);
    });
  };
};