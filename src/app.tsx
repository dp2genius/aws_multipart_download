import { Downloader } from "./downloader";
import config from "./config";

export default function App() {
  const onClick = () => {
    let downloader = new Downloader({
      credentials: config.credentials,
      Bucket: config.bucketName,
      region: config.region,
      connections: 30
    });

    downloader.download(config.Key);
  };

  return (
    <button onClick={onClick}>Download</button>
  );
}