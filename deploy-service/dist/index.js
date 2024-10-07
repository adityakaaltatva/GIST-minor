"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
const aws_1 = require("./aws");
const subscriber = (0, redis_1.createClient)();
async function connectRedis() {
    try {
        await subscriber.connect();
        console.log("Connected to Redis");
    }
    catch (error) {
        console.error("Error connecting to Redis:", error);
        process.exit(1); // Exit if Redis connection fails
    }
}
async function processMessages() {
    while (true) {
        try {
            const res = await subscriber.brPop((0, redis_1.commandOptions)({ isolated: true }), 'build-queue', 0);
            if (res) {
                const id = res.element;
                console.log(`Processing ID: ${id}`);
                await (0, aws_1.downloadS3Folder)(`/output/${id}`);
                console.log(`Downloaded folder for ID: ${id}`);
            }
        }
        catch (error) {
            console.error("Error processing message:", error);
        }
    }
}
async function main() {
    await connectRedis();
    await processMessages();
}
// // Handle graceful shutdown
// process.on('SIGINT', async () => {
//     console.log("Shutting down...");
//     await subscriber.quit();
//     process.exit(0);
// });
main();
