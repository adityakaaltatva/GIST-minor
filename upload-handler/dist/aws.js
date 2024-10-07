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
    region: AWS_REGION, // AWS region, e.g., Mumbai
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
});
const uploadFile = async (id, fileName, localFilePath) => {
    const fileContent = fs_1.default.readFileSync(localFilePath); // Read file content
    // Ensure files are uploaded under the output/ directory
    const uploadParams = {
        Bucket: S3_BUCKET,
        Key: `output/${id}/${fileName}`, // Files will be uploaded under output/id/
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
