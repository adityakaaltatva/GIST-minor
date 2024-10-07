"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const AWS_REGION = process.env.AWS_REGION;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const S3_BUCKET = process.env.S3_BUCKET;
const s3 = new client_s3_1.S3Client({
    region: AWS_REGION, // aws region mumbai
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
});
const uploadFile = async (id, fileName, localFilePath) => {
    const fileContent = fs_1.default.readFileSync(localFilePath);
    const uploadParams = {
        Bucket: S3_BUCKET,
        Key: `${id}/${fileName}`,
        Body: fileContent,
    };
    console.log(`Uploading ${uploadParams.Key} to S3...`); // Log the start of the upload
    try {
        const command = new client_s3_1.PutObjectCommand(uploadParams);
        const response = await s3.send(command);
        console.log(`File uploaded successfully: ${uploadParams.Key}`); // Log success message
        console.log('Response:', response); //
    }
    catch (error) {
        console.error("Error uploading file:", error);
        throw new Error(`File upload failed for ${uploadParams.Key}`);
    }
};
exports.uploadFile = uploadFile;
