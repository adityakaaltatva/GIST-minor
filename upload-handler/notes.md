indeex.ts without sns queue 




import express from"express";

import cors from"cors";

import simpleGit from"simple-git";

import { generate } from"./utils";

import { getAllFiles } from"./file";

import path from"path";

import { uploadFile } from"./aws";

const app = express();

app.use(cors());

app.use(express.json());

app.post("/deploy", async (req, res) => {

    const repoUrl = req.body.repoUrl; // e.g., github.com/adityaKaaltatva

    const id = generate(); // Unique identifier for this deployment

    try {

    console.log("Starting the cloning process...");

    await simpleGit().clone(repoUrl, path.join(__dirname,`output/${id}`)); // Clone the repository

    console.log("Repository cloned successfully.");

    const files = getAllFiles(path.join(__dirname,`output/${id}`)); // Get all files from cloned repo

    console.log("Files found in repository:", files);

    await Promise.all(files.map(file => {

    const relativeFilePath = file.slice(__dirname.length + 1);

    return uploadFile(id, relativeFilePath, file);

    }));

    console.log("All files uploaded successfully.");

    res.json({

    id: id

    });

    } catch (error: unknown) {

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    console.error("Error during deployment process:", errorMessage);

    res.status(500).json({ error: 'Failed to deploy repository', details: errorMessage });

    }

});

app.listen(3000, () => {

    console.log("Server running on port 3000");

});
