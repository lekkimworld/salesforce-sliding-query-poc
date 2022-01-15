// read environment
import { config as dotenv_config } from "dotenv";
dotenv_config();

import getSalesforceConnection from "./salesforce";
import getRedisClient from "./redis";
import moment from "moment";
import { EventEmitter } from "stream";
import { RECORD_QUEUE } from "./constants";

const eventEmitter = new EventEmitter();
const INCREMENT_DAYS = process.env.INCREMENT_DAYS ? Number.parseInt(process.env.INCREMENT_DAYS) : 30; 
const MAX_DURATION = process.env.MAX_DURATION_MINUTES ? Number.parseInt(process.env.MAX_DURATION_MINUTES) : 24 * 60;
console.log(`MAX_DURATION: ${MAX_DURATION}`);
const serverStartTime = moment();
const redis = getRedisClient();

const doWork = async (): Promise<void> => {
    // ensure total runtime hasn't lapsed
    const now = moment();
    const diff = now.diff(serverStartTime, "minute");
    if (diff >= MAX_DURATION) {
        eventEmitter.emit("maxDurationLapsed");
        return Promise.resolve();
    }

    // ensure redis connected
    if (!redis.isOpen) {
        await redis.connect();
    }

    // read start dt from redis
    const START_DT = (await redis.get("START_DT")) || "2000-01-01T00:00:00.000Z";

    // read from and to
    const startDt = moment.utc(START_DT, moment.ISO_8601);
    const endDt = startDt.clone().add(INCREMENT_DAYS, "days");
    console.log(`Querying from <${startDt}> to <${endDt}}>`);

    // query from salesforce
    const con = await getSalesforceConnection();
    con.bulk
        .query(
            `SELECT Id, Name FROM Account WHERE LastModifiedDate >= ${startDt.toISOString()} AND LastModifiedDate < ${endDt.toISOString()}`
        )
        .on("record", async (rec: any) => {
            redis.rPush(RECORD_QUEUE, JSON.stringify(rec));
        })
        .on("finish", async () => {
            await redis.set("START_DT", endDt.toISOString());
            eventEmitter.emit("finish");
        })
        .on("error", async (err: Error) => {
            eventEmitter.emit("error", err);
        });
};

eventEmitter.on("maxDurationLapsed", (...args: any[]) => {
    console.log("Time lapsed...");
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
