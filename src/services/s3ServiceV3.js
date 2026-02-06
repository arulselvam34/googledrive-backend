const { S3Client, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { GetObjectCommand } = require('@aws-sdk/client-s3');

// Create S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const uploadToS3 = async (fileBuffer, key, mimeType) => {
  try {
    console.log('📝 S3 Upload Params:', {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      ContentType: mimeType,
      Size: fileBuffer.length,
      Region: process.env.AWS_REGION
    });

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      ACL: 'private'
    });

    const result = await s3Client.send(command);
    
    console.log('✅ S3 Upload Success:', {
      ETag: result.ETag,
      Location: `s3://${process.env.AWS_S3_BUCKET_NAME}/${key}`
    });

    return result;
  } catch (error) {
    console.error('❌ S3 Upload Error:', {
      message: error.message,
      code: error.name,
      statusCode: error.$metadata?.httpStatusCode
    });
    throw new Error(`S3 Upload Error: ${error.message}`);
  }
};

const deleteFromS3 = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    throw new Error(`S3 Delete Error: ${error.message}`);
  }
};

const getS3ObjectUrl = async (key, expiresIn = 3600, forceDownload = true) => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      ...(forceDownload && { ResponseContentDisposition: 'attachment' })
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    throw new Error(`S3 Signed URL Error: ${error.message}`);
  }
};

const testS3Connection = async () => {
  try {
    const command = new HeadBucketCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME
    });

    await s3Client.send(command);
    return { status: 'Connected', bucket: process.env.AWS_S3_BUCKET_NAME };
  } catch (error) {
    return { status: 'Error', error: error.message };
  }
};

module.exports = {
  uploadToS3,
  deleteFromS3,
  getS3ObjectUrl,
  testS3Connection
};