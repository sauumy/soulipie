const AWS = require('aws-sdk');
const sharp = require('sharp');
const { promisify } = require('util');
const multer = require('multer');
const path = require('path');
const uploadVideoStory = multer();

const s3 = new AWS.S3({
  accessKeyId: 'AKIA4QQEYOZ2PG7KBFO4',
  secretAccessKey: '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',
  region: 'ap-south-1'
});

const compressVideoStroy = async (req, res, next) => {
  try {
    const originalBucketName = 'soulipieappbucket1';
    const compressedBucketName = 'soulipieappbucket2';

    const originalFiles = req.files;
    const compressedFiles = [];

    for (const originalFile of originalFiles) {
      const originalKey = `videos/${originalFile.fieldname}_${Date.now()}${path.extname(originalFile.originalname)}`;

      const uploadParams = {
        Bucket: originalBucketName,
        Key: originalKey,
        Body: originalFile.buffer,
        ContentType: originalFile.mimetype,
      };
      const originalUploadResult = await s3.upload(uploadParams).promise();
      const originalMediaPath = originalUploadResult.Key.replace('videos/', '');

      let outputBuffer;
      let contentType;

      if (originalFile.mimetype.startsWith('video/') && !originalFile.mimetype.endsWith('mp4')) {
        outputBuffer = await sharp(originalFile.buffer).resize({ height: 720 }).toFormat('mp4').toBuffer();
        contentType = 'video/mp4';
      } else {
        outputBuffer = originalFile.buffer;
        contentType = originalFile.mimetype;
      }

      const compressedKey = `${originalKey}`;
      const compressedParams = {
        Bucket: compressedBucketName,
        Key: compressedKey,
        Body: outputBuffer,
        ContentType: contentType,
      };
      await s3.upload(compressedParams).promise();
      compressedFiles.push(compressedKey.replace('videos/', ''));
    }

    req.compressedFiles = compressedFiles;
    req.files.forEach((file, index) => file.filename = compressedFiles[index].replace('videos/', ''));
    next();
  } catch (error) {
    next();
    console.log(error);
  }
};
module.exports = { uploadVideoStory, compressVideoStroy };