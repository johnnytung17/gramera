const aws = require('aws-sdk')
const multer = require('multer')
const multerS3 = require('multer-s3');
const path = require('path');

const s3Config = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    Bucket: process.env.AWS_BUCKET_NAME
});

const avatarS3Config = multerS3({
    s3: s3Config,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: 'public-read',
    metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, "profiles/" + file.fieldname + '_' + uniqueSuffix + path.extname(file.originalname))
    }
});

const postS3Config = multerS3({
    s3: s3Config,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: 'public-read',
    metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, "posts/" + file.fieldname + '_' + uniqueSuffix + path.extname(file.originalname))
    }
});

exports.uploadAvatar = multer({
    storage: avatarS3Config,
    limits: {
        fileSize: 1024 * 1024 * 50 // 50MB limit
    }
});

exports.uploadPost = multer({
    storage: postS3Config,
    limits: {
        fileSize: 1024 * 1024 * 50 // 50MB limit
    }
});

exports.deleteFile = async (fileuri) => {
    const fileKey = fileuri.split('/').slice(-2).join("/");
    return await s3Config.deleteObject({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey
    }).promise();
}