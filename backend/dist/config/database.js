"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClient = exports.query = exports.pool = void 0;
const pg_1 = require("pg");
const poolConfig = {
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};
exports.pool = new pg_1.Pool(poolConfig);
exports.pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await exports.pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: res.rowCount });
        return res;
    }
    catch (error) {
        console.error('Query error', { text, error });
        throw error;
    }
};
exports.query = query;
const getClient = async () => {
    const client = await exports.pool.connect();
    const originalRelease = client.release.bind(client);
    // Set a timeout of 5 seconds, after which we will log this client's last query
    const timeout = setTimeout(() => {
        console.error('A client has been checked out for more than 5 seconds!');
    }, 5000);
    // Override release to clear timeout
    client.release = () => {
        clearTimeout(timeout);
        originalRelease();
        return undefined;
    };
    return client;
};
exports.getClient = getClient;
