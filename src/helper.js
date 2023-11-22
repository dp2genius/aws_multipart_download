var AWS = require('aws-sdk');
import cfg from "./config";

export var s3 = new AWS.S3({
  credentials: cfg.credentials,
  region: cfg.region
});

export const getMetadata = async ({ Bucket, Key }) => {
  return s3.headObject({ Key, Bucket }).promise().then(res => res.ContentLength);
};

function sleep(time) {
  return new Promise(res => {
    setTimeout(res, time);
  });
}

export const getObject = async (Bucket, Key, Range, retry = false, time = 1000) => {
  try {
    // console.log(Range);
    let result = await s3.getObject({ Bucket, Key, Range }).promise().then(res => res.Body);
    if (retry === true) {
      console.log("[Success]", Range);
    }
    return result;
  } catch {
    console.log(`[Failed => Retry after ${time / 1000}s]`, Range);
    await sleep(time);
    return await getObject(Bucket, Key, Range, true, Math.min(time + 1000, 3000));
  }
};

export async function getSignedUrls({ bucket, key, CHUNKSIZE }) {
  let SIZE = await getMetadata({ Bucket: bucket, Key: key });
  console.log("[file size]", SIZE);

  let start = 0;
  let end = CHUNKSIZE - 1;
  let signedUrls = [];

  while (start < SIZE) {
    const params = {
      Bucket: bucket,
      Key: key,
      Range: `bytes=${start}-${end}` // Specify the byte range here
    };

    signedUrls.push(s3.getSignedUrl('getObject', params));

    start = end + 1;
    end = Math.min(end + CHUNKSIZE, SIZE - 1);
  }

  console.log(signedUrls);
  return [];

  return signedUrls;
};