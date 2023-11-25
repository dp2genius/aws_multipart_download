const AWS = require('aws-sdk');
import config from "./config";

export const s3 = new AWS.S3({
  credentials: config.credentials,
  region: config.region
});

/** Get file size of a given Bucken and Key */
export const getS3FileSize = async ({ Bucket, Key }) => {
  return s3.headObject({ Key, Bucket }).promise().then(res => res.ContentLength);
};

/** Sleep for a given period */
function sleep(time) {
  return new Promise(res => {
    setTimeout(res, time);
  });
}

/**
 * Get a given range of file
 * @returns {Pomise<ArrayBuffer>} the binary data
 */
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
