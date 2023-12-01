import { DownloadHelper, Downloader } from "./downloader";
import config from "./config";
import { useState, useEffect } from "react";

const downloadHelper = new DownloadHelper({
  credentials: config.credentials,
  Bucket: config.bucketName,
  region: config.region
});

const downloader = new Downloader(downloadHelper, {
  connections: 25,
  chunkSize: 3145728 // 16777216
});

// Colttaine.zip into Colttaine.1.zip & Colttaine.2.zip & Colttaine.3.zip

// Dev
// @ts-ignore
window.fails = {};
// @ts-ignore
window.downloader = downloader;
// End Dev

let keys = ["Colttaine.zip"];

export default function App() {
  const [progress, setProgress] = useState({} as object);
  const [status, setStatus] = useState({} as object);

  useEffect(() => {
    setInterval(() => {
      setStatus(status => ({
        ...status,
        [keys[0]]: downloader.getStatus(keys[0])
      }));
      // @ts-ignore
      // window.status = status;
    }, 500);
  }, []);

  useEffect(() => {
    console.log(status);
  }, [status]);

  const onClick = (key: string) => () => {
    downloader.download(key);

    downloader.on('progress', (key: string, value: number) => {
      setProgress((progress: object) => ({
        ...progress,
        [key]: value
      }));
    });

    downloader.on('complete', (key: string) => {
      console.log(`[Complete] - ${key}`);
    });

    downloader.on('error', (key: string, err: any) => {
      console.log(`[error] - ${key}`, err);
    });
  };

  const onCancel = (key: string) => () => {
    downloader.abort(key);
  };

  const onPause = (key: string) => () => {
    downloader.pause(key);
  };

  const onResume = (key: string) => () => {
    downloader.resume(key);
  };

  const onReset = () => {
    downloader.reset();
  };

  return (
    <div>
      <button onClick={onReset}>Reset</button>
      <table>
        <tbody>
          <tr>
            <td>{keys[0]}</td>
            <td><button onClick={onClick(keys[0])}>Download</button></td>
            <td><button onClick={onCancel(keys[0])}>Cancel</button><br /></td>
            <td><button onClick={onPause(keys[0])}>Pause</button><br /></td>
            <td><button onClick={onResume(keys[0])}>Resume</button></td>
            <td>{" | "}</td>
            <td>{
              // @ts-ignore
              progress[keys[0]]
            }</td>
            <td>{" | "}</td>
            <td>{
              // @ts-ignore
              status[keys[0]]
            }</td>
            <td>{" | "}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}