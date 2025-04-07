"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCountryByID = exports.createCountry = exports.getCountries = void 0;
const db_1 = __importDefault(require("../db/db"));
const countrySchema_1 = __importDefault(require("../db/schemas/countrySchema"));
const uuid_1 = require("uuid");
const zod_1 = require("zod");
const drizzle_orm_1 = require("drizzle-orm");
const getCountries = async (_req, reply) => {
    try {
        const allCountries = await db_1.default.select().from(countrySchema_1.default);
        return reply.status(200).send(allCountries);
    }
    catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Missing Failed: could not get all countries" });
    }
};
exports.getCountries = getCountries;
const createCountrySchema = zod_1.z.object({
    countryname: zod_1.z.string().min(2, { message: "Country name must be at least 2 characters long" }),
});
const createCountry = async (req, reply) => {
    try {
        const cleanedData = {
            ...req.body,
            countryname: req.body.countryname.trim()
        };
        const result = createCountrySchema.safeParse(cleanedData);
        if (!result.success) {
            return reply.status(400).send({
                error: "Validation error",
                details: result.error.format()
            });
        }
        const countryID = (0, uuid_1.v4)();
        const newCountry = await db_1.default
            .insert(countrySchema_1.default)
            .values({ CountryID: countryID, countryname: result.data.countryname, status: "active" })
            .returning();
        return reply.status(201).send({ messege: "The country was successfully registered", newCountry });
    }
    catch (error) {
        console.error(error);
        if (error instanceof zod_1.ZodError) {
            return reply.status(400).send({
                error: "Validation error",
                details: error.format()
            });
        }
        return reply.status(500).send({
            error: "Mission Failed: Failed to register country",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
exports.createCountry = createCountry;
const getCountryByID = async (req, reply) => {
    try {
        const { CountryID } = req.params;
        const country = await db_1.default.select().from(countrySchema_1.default).where((0, drizzle_orm_1.eq)(countrySchema_1.default.CountryID, CountryID));
        if (!country) {
            return reply.status(404).send({ error: "Country not found" });
        }
        return reply.status(200).send({ countryname: country[0].countryname });
    }
    catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Missing Failed: could not get country by ID" });
    }
};
exports.getCountryByID = getCountryByID;
//# sourceMappingURL=country.js.map