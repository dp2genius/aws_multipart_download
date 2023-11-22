import { render } from 'react-dom';
import { useState } from 'react';
import cfg from "./config";
import { getMetadata, getObject, s3 } from './helper';

function App() {
  let [size, setSize] = useState(0);
  let [comments, setComments] = useState([]);

  const downloadFiles = async () => {
    let writeToSave = async (buffers) => {
      for (let i = 0, length = buffers.length; i < length; i++) {
        setSize(size => size + buffers[i].length);
        await writer.write(buffers[i]);
      }
    };

    /**
     * 
     * @param {number} batch the number of chunks
     */
    async function downloadSimultaneously(batch = 100) {
      let pushComment = str => setComments(comments => [...comments, str]);

      /** the whole number of bytes of the file */
      let SIZE = await getMetadata({ Bucket: cfg.bucketName, Key: cfg.Key });
      pushComment("[signed_url] " + s3.getSignedUrl('getObject', { Bucket: cfg.bucketName, Key: cfg.Key }));

      pushComment("[file size] " + SIZE);

      /** the numger of chunks */
      let length = Math.ceil(SIZE / cfg.ChunkSize);
      pushComment("[chunk count] " + length);

      /** the start no of the chunk */
      let start = 0;
      /** the end no of the chunk, exclusively */
      let end = Math.min(length, batch);
      let next = () => {
        start = end;
        end = Math.min(length, start + batch);
      };

      /** Load binary data from url using fetch */
      const getBuffers = (start, end) => {
        let promises = [];
        for (let i = start; i < end; i++) {
          promises.push(getObject(cfg.bucketName, cfg.Key, `bytes=${i * cfg.ChunkSize}-${Math.min((i + 1) * cfg.ChunkSize - 1, SIZE - 1)}`));
        }
        return Promise.all(promises);
      }

      // first fetch data
      pushComment("Fetching first data (batch)...");
      let buffersToWrite = await getBuffers(start, end);
      pushComment("Fetching first data ended");

      next();

      while (true) {
        let writePromise = writeToSave(buffersToWrite);

        if (start >= end) {
          await writePromise;
          break;
        }

        let fetchPromise = getBuffers(start, end);

        let res = await Promise.all([writePromise, fetchPromise]);
        buffersToWrite = res[1];

        next();
      }
    };

    let fileSave = await showSaveFilePicker();
    let writer = await fileSave.createWritable();
    await downloadSimultaneously(cfg.batch);
    writer.close().then(() => alert('[complete]'));
  };

  return (
    <div>
      <button onClick={downloadFiles}>Start</button>
      <p>downloaded {size / 1024 / 1024} MB</p>
      {comments.map((comment, idx) => <p key={idx}>{comment}</p>)}
    </div>
  );
}

render(<App />, document.getElementById('root'));