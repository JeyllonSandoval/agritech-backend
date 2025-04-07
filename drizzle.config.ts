export default {
    schema: "./src/db/schemas/schemas.ts",
    out: "./drizzle",
    dialect: "sqlite",
    driver: "turso",
    dbCredentials: {
        url: "https://agritech-db-jey-slon.turso.io",
        authToken: `eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Mzg5NzYzMzIsImlkIjoiNTRkODlmOTYtNmI4MS00ZGQwLWJjODYtMjkzOGIzODI0ODBkIn0.uIJrtK-01UzV_j_NbQbOaPeqwIuCQMLbli6NXmvmZbscKFh9KKCmx8q13HLPzKJqHiqNYgZxoYul6fsrpwtpDw`
    }
};
