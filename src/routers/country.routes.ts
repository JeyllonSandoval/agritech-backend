import { FastifyInstance } from "fastify";
import { getCountries, createCountry } from "@/controllers/country";

const countryRoutes = async (fastify: FastifyInstance) => {
    fastify.get("/countries", getCountries);
    fastify.post("/countries", createCountry);
};

export default countryRoutes;