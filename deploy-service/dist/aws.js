"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadS3Folder = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const stream_1 = require("stream");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = process.env;
if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION) {
    throw new Error("AWS credentials and region must be set in environment variables.");
}
const s3 = new client_s3_1.S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
});
const downloadS3Folder = async (folderPath) => {
    try {
        const bucketName = 'gist-deploy';
        const command = new client_s3_1.ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: folderPath,
        });
        const response = await s3.send(command);
        // Check if any objects were found
        if (response.Contents) {
            console.log("Found objects:", response.Contents); // Log found objects
            const localDirectory = path_1.default.join(__dirname, folderPath);
            fs_1.default.mkdirSync(localDirectory, { recursive: true });
            for (const object of response.Contents) {
                if (object.Key) {
                    const fileName = path_1.default.basename(object.Key);
                    const localFilePath = path_1.default.join(localDirectory, fileName);
                    const getObjectCommand = new client_s3_1.GetObjectCommand({
                        Bucket: bucketName,
                        Key: object.Key,
                    });
                    const fileStream = await s3.send(getObjectCommand);
                    if (fileStream.Body && fileStream.Body instanceof stream_1.Readable) {
                        const writeStream = fs_1.default.createWriteStream(localFilePath);
                        fileStream.Body.pipe(writeStream);
                        writeStream.on('finish', () => {
                            console.log(`Downloaded: ${fileName}`);
                        });
                        writeStream.on('error', (err) => {
                            console.error(`Error writing file ${fileName}:`, err);
                        });
                    }
                    else {
                        console.error(`No body found for ${object.Key}`);
                    }
                }
            }
        }
        else {
            console.log('No files found in the specified S3 folder.');
        }
    }
    catch (error) {
        console.error('Error downloading S3 folder:', error);
        throw new Error(`Download failed for folder ${folderPath}`);
    }
};
exports.downloadS3Folder = downloadS3Folder;
