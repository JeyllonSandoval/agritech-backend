export default {
    schema: "./src/db/schemas/schemas.ts",
    out: "./drizzle",
    dialect: "sqlite",
    driver: "turso",
    dbCredentials: {
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN
    }
};
