import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream'; 
import dotenv from 'dotenv';

dotenv.config(); 

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = process.env;

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION) {
    throw new Error("AWS credentials and region must be set in environment variables.");
}

const s3 = new S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
});

export const downloadS3Folder = async (folderPath: string) => {
    try {
        const bucketName = 'gist-deploy'; 
        const command = new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: folderPath, 
        });

        const response = await s3.send(command);

        // Check if any objects were found
if (response.Contents) {
    console.log("Found objects:", response.Contents); // Log found objects

    const localDirectory = path.join(__dirname, folderPath);
    fs.mkdirSync(localDirectory, { recursive: true });

    for (const object of response.Contents) {
        if (object.Key) {
            const fileName = path.basename(object.Key);
            const localFilePath = path.join(localDirectory, fileName);
            const getObjectCommand = new GetObjectCommand({
                Bucket: bucketName,
                Key: object.Key,
            });

            const fileStream = await s3.send(getObjectCommand);

            if (fileStream.Body && fileStream.Body instanceof Readable) {
                const writeStream = fs.createWriteStream(localFilePath);

                fileStream.Body.pipe(writeStream);

                writeStream.on('finish', () => {
                    console.log(`Downloaded: ${fileName}`);
                });

                writeStream.on('error', (err) => {
                    console.error(`Error writing file ${fileName}:`, err);
                });
            } else {
                console.error(`No body found for ${object.Key}`);
            }
        }
    }
} else {
    console.log('No files found in the specified S3 folder.');
}

    } catch (error) {
        console.error('Error downloading S3 folder:', error);
        throw new Error(`Download failed for folder ${folderPath}`);
    }
};
