"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// it creates a subscriber
const redis_1 = require("redis");
// import { copyFinalDist, downloadS3Folder } from "./aws";
// import { buildProject } from "./utils";
const subscriber = (0, redis_1.createClient)();
subscriber.connect();
async function main() {
    while (1) {
        const res = await subscriber.brPop(//rpop is done
        (0, redis_1.commandOptions)({ isolated: true }), 'build-queue', 0);
        console.log(express_1.response);
    }
}
main();
// this is coming from local redis , cache 
