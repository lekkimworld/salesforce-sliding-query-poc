// read environment
import { config as dotenv_config } from "dotenv";
dotenv_config();

import { EventEmitter } from "stream";
import getRedisClient from "./redis";
import { RECORD_QUEUE, WRITER_TIMEOUT_SECS } from "./constants";

const redisClient = getRedisClient();
const eventEmitter = new EventEmitter();


const doWork = async (): Promise<void> => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
    const str_record = await redisClient.blPop(RECORD_QUEUE, WRITER_TIMEOUT_SECS);
    if (!str_record) {
        eventEmitter.emit("noRecords");
        return Promise.resolve();
    }
    const body = JSON.parse(str_record.element);
    console.log(body);

    eventEmitter.emit("finish");
};

eventEmitter.on("noRecords", (...args: any[]) => {
    console.log("No records - exiting...");
    process.exit(0);
});
eventEmitter.on("finish", (...args: any[]) => {
    doWork();
});

(function wait() {
    setTimeout(wait, 1000);
})();

// start
doWork();
