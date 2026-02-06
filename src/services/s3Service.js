const AWS = require('aws-sdk');

// Force the region before creating S3 instance
const REGION = 'eu-north-1';
process.env.AWS_REGION = REGION;

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: REGION,
  signatureVersion: 'v4',
  endpoint: new AWS.Endpoint(`https://s3.${REGION}.amazonaws.com`)
});

const uploadToS3 = (fileBuffer, key, mimeType) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      ACL: 'private'
    };

    console.log('📝 S3 Upload Params:', {
      Bucket: params.Bucket,
      Key: params.Key,
      ContentType: params.ContentType,
      Size: fileBuffer.length,
      Region: s3.config.region
    });

    s3.putObject(params, (err, data) => {
      if (err) {
        console.error('❌ S3 putObject Error:', {
          message: err.message,
          code: err.code,
          statusCode: err.statusCode
        });
        reject(new Error(`S3 Upload Error: ${err.message}`));
      } else {
        console.log('✅ S3 putObject Success:', {
          ETag: data.ETag,
          Location: `s3://${params.Bucket}/${params.Key}`
        });
        resolve(data);
      }
    });
  });
};

const deleteFromS3 = (key) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key
    };

    s3.deleteObject(params, (err, data) => {
      if (err) {
        reject(new Error(`S3 Delete Error: ${err.message}`));
      } else {
        resolve(true);
      }
    });
  });
};

const getS3ObjectUrl = (key, expiresIn = 3600, forceDownload = true) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    Expires: expiresIn
  };

  // Force download instead of opening in browser
  if (forceDownload) {
    params.ResponseContentDisposition = 'attachment';
  }

  return s3.getSignedUrl('getObject', params);
};

const getS3ObjectStream = (key) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key
  };

  return s3.getObject(params).createReadStream();
};

module.exports = {
  uploadToS3,
  deleteFromS3,
  getS3ObjectUrl,
  getS3ObjectStream
};
