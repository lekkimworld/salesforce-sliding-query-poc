export const RECORD_QUEUE = process.env.QUEUE_NAME || "recordQueue";
export const WRITER_TIMEOUT_SECS = process.env.WRITER_TIMEOUT_SECS ? Number.parseInt(process.env.WRITER_TIMEOUT_SECS) : 120;
export const INCREMENT_DAYS = process.env.INCREMENT_DAYS ? Number.parseInt(process.env.INCREMENT_DAYS) : 30;
export const READER_MAX_RUNTIME_MINUTES = process.env.READER_MAX_RUNTIME_MINUTES
    ? Number.parseInt(process.env.READER_MAX_RUNTIME_MINUTES)
    : 24 * 60;
export const DEFAULT_START_DT = process.env.DEFAULT_START_DT || "2000-01-01T00:00:00.000Z";
export const SOQL_QUERY = process.env.SOQL_QUERY || "SELECT Id, Name FROM Account";