import { DownloadHelper, Downloader } from "./downloader";
import config from "./config";

export default function App() {
  const onClick = async () => {

    const downloadHelper = new DownloadHelper({
      credentials: config.credentials,
      Bucket: config.bucketName,
      region: config.region
    });

    const downloader = new Downloader(downloadHelper, {
      connections: 15,
      chunkSize: 167772
    });

    /////////////////////////////////////////////////

    downloader.download(config.Key);

    console.log(downloader);


  };

  return (
    <button onClick={onClick}>Download</button>
  );
}