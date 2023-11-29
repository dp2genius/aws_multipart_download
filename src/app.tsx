import { DownloadHelper, Downloader } from "./downloader";
import config from "./config";

const downloadHelper = new DownloadHelper({
  credentials: config.credentials,
  Bucket: config.bucketName,
  region: config.region
});

const downloader = new Downloader(downloadHelper, {
  connections: 15,
  chunkSize: 16777216
});

export default function App() {
  const onClick = async () => {
    downloader.download(config.Key);

    downloader.on('progress', (key: string, value: number) => {
      console.log(`[progress] - ${key} - ${value}`);
    });

    downloader.on('complete', (key: string) => {
      console.log(`[Complete] - ${key}`);
    });

    downloader.on('error', (key: string, err: any) => {
      console.log(`[error] - ${key}`, err);
    });
  };

  const onCancel = async () => {
    downloader.abortAll();
  };

  const pauseAll = () => {
    downloader.pauseAll();
  }

  const resumeAll = () => {
    downloader.resumeAll();
  }

  return (
    <div>
    <button onClick={onClick}>Download</button><br/>
    <button onClick={onCancel}>cancelAll</button><br/>
    <button onClick={pauseAll}>pauseAll</button><br/>
    <button onClick={resumeAll}>resumeAll</button>
    </div>
  );
}