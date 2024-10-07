"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyFinalDist = exports.uploadFile = exports.downloadS3Folder = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const stream_1 = require("stream");
const util_1 = require("util");
dotenv_1.default.config();
const AWS_REGION = process.env.AWS_REGION;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const S3_BUCKET = process.env.S3_BUCKET;
const s3 = new client_s3_1.S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
});
const pipe = (0, util_1.promisify)(stream_1.pipeline);
// Function to download an S3 folder
const downloadS3Folder = async (prefix) => {
    const listParams = {
        Bucket: S3_BUCKET,
        Prefix: prefix,
    };
    try {
        const data = await s3.send(new client_s3_1.ListObjectsV2Command(listParams));
        if (!data.Contents) {
            console.log("No files found to download.");
            return;
        }
        const downloadPromises = data.Contents.map(async (item) => {
            if (!item.Key)
                return;
            const getObjectParams = {
                Bucket: S3_BUCKET,
                Key: item.Key,
            };
            const outputFilePath = path_1.default.join(__dirname, item.Key);
            const dirName = path_1.default.dirname(outputFilePath);
            if (!fs_1.default.existsSync(dirName)) {
                fs_1.default.mkdirSync(dirName, { recursive: true });
            }
            const response = await s3.send(new client_s3_1.GetObjectCommand(getObjectParams));
            const stream = response.Body;
            await pipe(stream, fs_1.default.createWriteStream(outputFilePath));
            console.log(`File downloaded: ${item.Key}`);
        });
        await Promise.all(downloadPromises);
        console.log("All files downloaded successfully.");
    }
    catch (error) {
        console.error("Error downloading files from S3:", error);
        throw new Error("Download failed.");
    }
};
exports.downloadS3Folder = downloadS3Folder;
// Function to upload files from a local directory to S3
const uploadFile = async (id, fileName, localFilePath) => {
    const fileContent = fs_1.default.readFileSync(localFilePath);
    const uploadParams = {
        Bucket: S3_BUCKET,
        Key: `output/${id}/${fileName}`,
        Body: fileContent,
    };
    console.log(`Uploading ${uploadParams.Key} to S3...`);
    try {
        const command = new client_s3_1.PutObjectCommand(uploadParams);
        const response = await s3.send(command);
        console.log(`File uploaded successfully: ${uploadParams.Key}`);
        console.log('Response:', response);
    }
    catch (error) {
        console.error("Error uploading file:", error);
        throw new Error(`File upload failed for ${uploadParams.Key}`);
    }
};
exports.uploadFile = uploadFile;
// Function to recursively get all files from a local folder
const getAllFiles = (folderPath) => {
    let response = [];
    const allFilesAndFolders = fs_1.default.readdirSync(folderPath);
    allFilesAndFolders.forEach(file => {
        const fullFilePath = path_1.default.join(folderPath, file);
        if (fs_1.default.statSync(fullFilePath).isDirectory()) {
            response = response.concat(getAllFiles(fullFilePath));
        }
        else {
            response.push(fullFilePath);
        }
    });
    return response;
};
const copyFinalDist = (id) => {
    const folderPath = path_1.default.join(__dirname, `output/${id}/dist`);
    const allFiles = getAllFiles(folderPath);
    allFiles.forEach(file => {
        const fileName = file.slice(folderPath.length + 1); // get relative path for the file
        (0, exports.uploadFile)(id, fileName, file);
    });
};
exports.copyFinalDist = copyFinalDist;
