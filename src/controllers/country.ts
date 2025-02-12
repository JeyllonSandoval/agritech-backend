import { FastifyRequest, FastifyReply } from "fastify";
import db from "@/db/db";
import countriesTable from "@/db/schemas/countrySchema";
import { v4 as uuidv4 } from "uuid";

const getCountries = async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
        const allCountries = await db.select().from(countriesTable);
        return reply.status(200).send(allCountries);
    } catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Missing Failed: could not get all countries" });
    }
};

const createCountry = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const { countryname } = req.body as { countryname: string };

        if (!countryname) {
            return reply.status(400).send({ error: "The CountryName field is required" });
        }

        const countryID = uuidv4();

        const newCountry = await db
            .insert(countriesTable)
            .values({ CountryID: countryID, countryname, status: "active" })
            .returning();

        return reply.status(201).send({ messege: "The country was successfully registered", newCountry });
    } catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Mission Failed: Failed to register country" });
    }
}

export { getCountries, createCountry };