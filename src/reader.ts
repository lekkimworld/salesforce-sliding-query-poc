// read environment
import { config as dotenv_config } from "dotenv";
dotenv_config();

import getSalesforceConnection from "./salesforce";
import getRedisClient from "./redis";
import moment from "moment";
import { EventEmitter } from "stream";
import { DEFAULT_START_DT, INCREMENT_DAYS, READER_MAX_RUNTIME_MINUTES, RECORD_QUEUE, SOQL_QUERY } from "./constants";
import { getSOQLQuery } from "./util";

const eventEmitter = new EventEmitter();
console.log(`Running for a mamimum of <${READER_MAX_RUNTIME_MINUTES}> minutes`);
const serverStartTime = moment();
const redis = getRedisClient();

const doWork = async (): Promise<void> => {
    // ensure total runtime hasn't lapsed
    const now = moment();
    const diff = now.diff(serverStartTime, "minute");
    if (diff >= READER_MAX_RUNTIME_MINUTES) {
        eventEmitter.emit("maxDurationLapsed");
        return Promise.resolve();
    }

    // ensure redis connected
    if (!redis.isOpen) {
        await redis.connect();
    }

    // read start dt from redis
    const START_DT = (await redis.get("START_DT")) || DEFAULT_START_DT;

    // read from and to
    const startDt = moment.utc(START_DT, moment.ISO_8601);
    const endDt = startDt.clone().add(INCREMENT_DAYS, "days");
    console.log(`Querying from <${startDt}> to <${endDt}}>`);

    // query from salesforce
    const con = await getSalesforceConnection();
    const str_query = getSOQLQuery(startDt, endDt);
    con.bulk
        .query(str_query)
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
