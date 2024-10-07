import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const AWS_REGION = process.env.AWS_REGION!;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID!;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY!;
const S3_BUCKET = process.env.S3_BUCKET!;

const s3 = new S3Client({
    region: AWS_REGION, // AWS region, e.g., Mumbai
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
});

export const uploadFile = async (id: string, fileName: string, localFilePath: string) => {
    const fileContent = fs.readFileSync(localFilePath); // Read file content

    // Ensure files are uploaded under the output/ directory
    const uploadParams = {
        Bucket: S3_BUCKET,
        Key: `output/${id}/${fileName}`, // Files will be uploaded under output/id/
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
