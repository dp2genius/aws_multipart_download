import { DownloadHelper, Downloader } from "./downloader";
import config from "./config";
import { useState } from "react";

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

export default function App() {
  const [progress, setProgress] = useState({} as object);

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

  const onCancel = (key: string) => () => { };

  const onPause = (key: string) => () => { };

  const onResume = (key: string) => () => { };

  return (
    <table>
      <tbody>
        <tr>
          <td>Colttaine.zip</td>
          <td><button onClick={onClick("Colttaine.zip")}>Download</button></td>
          <td><button onClick={onCancel("Colttaine.zip")}>Cancel</button><br /></td>
          <td><button onClick={onPause("Colttaine.zip")}>Pause</button><br /></td>
          <td><button onClick={onResume("Colttaine.zip")}>Resume</button></td>
          <td>{
            // @ts-ignore
            progress["Colttaine.zip"]
          }</td>
        </tr>
      </tbody>
    </table>
  );
}