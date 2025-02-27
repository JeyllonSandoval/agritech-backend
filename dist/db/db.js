"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const libsql_1 = require("drizzle-orm/libsql");
const client_1 = require("@libsql/client");
const { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN } = process.env;
if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
    throw new Error('Missing required environment variables: TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
}
const client = (0, client_1.createClient)({
    url: TURSO_DATABASE_URL,
    authToken: TURSO_AUTH_TOKEN
});
const db = (0, libsql_1.drizzle)({ client });
exports.default = db;
