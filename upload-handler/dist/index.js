"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const simple_git_1 = __importDefault(require("simple-git"));
const utils_1 = require("./utils");
const file_1 = require("./file");
const path_1 = __importDefault(require("path"));
const aws_1 = require("./aws");
const redis_1 = require("redis");
// Initialized a  Redis clients for publisher and subscriber
const publisher = (0, redis_1.createClient)();
const subscriber = (0, redis_1.createClient)();
publisher.connect();
subscriber.connect();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.post("/deploy", async (req, res) => {
    const repoUrl = req.body.repoUrl; // e.g., github.com/adityaKaaltatva
    const id = (0, utils_1.generate)();
    try {
        console.log("Starting the cloning process...");
        await (0, simple_git_1.default)().clone(repoUrl, path_1.default.join(__dirname, `output/${id}`)); // Cloning
        console.log("Repository cloned successfully.");
        const files = (0, file_1.getAllFiles)(path_1.default.join(__dirname, `output/${id}`)); // Get all files from cloned repo
        console.log("Files found in repository:", files);
        await Promise.all(files.map(file => {
            const relativeFilePath = file.slice(__dirname.length + 1);
            return (0, aws_1.uploadFile)(id, relativeFilePath, file);
        }));
        console.log("All files uploaded successfully.");
        // Push the deployment ID to the Redis queue
        await publisher.lPush("build-queue", id);
        // Store the deployment status as uploaded in Redis
        await publisher.hSet("status", id, "uploaded");
        res.json({
            id: id,
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        console.error("Error during deployment process:", errorMessage);
        res.status(500).json({ error: "Failed to deploy repository", details: errorMessage });
    }
});
// Endpoint to check the status of a deployment
app.get("/status", async (req, res) => {
    const id = req.query.id;
    const response = await subscriber.hGet("status", id);
    res.json({
        status: response,
    });
});
app.listen(3000, () => {
    console.log("Server running on port 3000");
});
