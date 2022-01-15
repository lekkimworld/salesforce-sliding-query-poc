import { URL } from "url";
import { createClient as createRedisClient } from "redis";

const CONNECTION_TIMEOUT = process.env.REDIS_CONNECTION_TIMEOUT
    ? Number.parseInt(process.env.REDIS_CONNECTION_TIMEOUT)
    : 20000;

const client = (function () {
    const redis_uri = process.env.REDIS_TLS_URL
        ? new URL(process.env.REDIS_TLS_URL as string)
        : process.env.REDIS_URL
        ? new URL(process.env.REDIS_URL as string)
        : undefined;
    if (process.env.REDIS_URL && redis_uri && redis_uri.protocol!.indexOf("rediss") === 0) {
        return createRedisClient({
            socket: {
                port: Number.parseInt(redis_uri.port!),
                host: redis_uri.hostname!,
                connectTimeout: CONNECTION_TIMEOUT,
                rejectUnauthorized: false,
                requestCert: true,
            },
            password: redis_uri.password,
        });
    } else {
        return createRedisClient({
            url: process.env.REDIS_URL as string,
            socket: {
                connectTimeout: CONNECTION_TIMEOUT,
            }
        });
    }
})();

export default () => {
    return client;
}
