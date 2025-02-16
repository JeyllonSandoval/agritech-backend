import { FastifyRequest, FastifyReply } from "fastify";
import db from "@/db/db";
import countriesTable from "@/db/schemas/countrySchema";
import { v4 as uuidv4 } from "uuid";
import { z, ZodError } from "zod";

const getCountries = async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
        const allCountries = await db.select().from(countriesTable);
        return reply.status(200).send(allCountries);
    } catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Missing Failed: could not get all countries" });
    }
};

const createCountrySchema = z.object({
    countryname: z.string().min(2, { message: "Country name must be at least 2 characters long" }),
});

const createCountry = async (
    req: FastifyRequest<{ Body: z.infer<typeof createCountrySchema> }>, 
    reply: FastifyReply
    ) => {
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

        const countryID = uuidv4();

        const newCountry = await db
            .insert(countriesTable)
            .values({ CountryID: countryID, countryname: result.data.countryname, status: "active" })
            .returning();

        return reply.status(201).send({ messege: "The country was successfully registered", newCountry });
    } catch (error) {
        console.error(error);

        if (error instanceof ZodError) {
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
}

export { getCountries, createCountry };