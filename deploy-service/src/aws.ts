import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { pipeline } from 'stream';
import { promisify } from 'util';

dotenv.config();

const AWS_REGION = process.env.AWS_REGION!;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID!;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY!;
const S3_BUCKET = process.env.S3_BUCKET!;

const s3 = new S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
});

const pipe = promisify(pipeline);

// Function to download an S3 folder
export const downloadS3Folder = async (prefix: string) => {
    const listParams = {
        Bucket: S3_BUCKET,
        Prefix: prefix,
    };

    try {
        const data = await s3.send(new ListObjectsV2Command(listParams));
        if (!data.Contents) {
            console.log("No files found to download.");
            return;
        }

        const downloadPromises = data.Contents.map(async (item) => {
            if (!item.Key) return;

            const getObjectParams = {
                Bucket: S3_BUCKET,
                Key: item.Key,
            };

            const outputFilePath = path.join(__dirname, item.Key);
            const dirName = path.dirname(outputFilePath);
            if (!fs.existsSync(dirName)) {
                fs.mkdirSync(dirName, { recursive: true });
            }

            const response = await s3.send(new GetObjectCommand(getObjectParams));
            const stream = response.Body as NodeJS.ReadableStream;

            await pipe(stream, fs.createWriteStream(outputFilePath));
            console.log(`File downloaded: ${item.Key}`);
        });

        await Promise.all(downloadPromises);
        console.log("All files downloaded successfully.");
    } catch (error) {
        console.error("Error downloading files from S3:", error);
        throw new Error("Download failed.");
    }
};

// Function to upload files from a local directory to S3
export const uploadFile = async (id: string, fileName: string, localFilePath: string) => {
    const fileContent = fs.readFileSync(localFilePath);

    const uploadParams = {
        Bucket: S3_BUCKET,
        Key: `output/${id}/${fileName}`,
        Body: fileContent,
    };

    console.log(`Uploading ${uploadParams.Key} to S3...`);

    try {
        const command = new PutObjectCommand(uploadParams);
        const response = await s3.send(command);

        console.log(`File uploaded successfully: ${uploadParams.Key}`);
        console.log('Response:', response);
    } catch (error) {
        console.error("Error uploading file:", error);
        throw new Error(`File upload failed for ${uploadParams.Key}`);
    }
};

// Function to recursively get all files from a local folder
const getAllFiles = (folderPath: string): string[] => {
    let response: string[] = [];

    const allFilesAndFolders = fs.readdirSync(folderPath);
    allFilesAndFolders.forEach(file => {
        const fullFilePath = path.join(folderPath, file);
        if (fs.statSync(fullFilePath).isDirectory()) {
            response = response.concat(getAllFiles(fullFilePath));
        } else {
            response.push(fullFilePath);
        }
    });

    return response;
};

export const copyFinalDist = (id: string) => {
    const folderPath = path.join(__dirname, `output/${id}/dist`);
    const allFiles = getAllFiles(folderPath);
    allFiles.forEach(file => {
        const fileName = file.slice(folderPath.length + 1); // get relative path for the file
        uploadFile(id, fileName, file);
    });
};
