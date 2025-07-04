import { FastifyInstance } from "fastify";
import { getCountries, createCountry, getCountryByID } from "@/controllers/country";

const countryRoutes = async (fastify: FastifyInstance) => {
    fastify.get("/countries", getCountries);
    fastify.post("/countries", createCountry);
    fastify.get("/countries/:CountryID", getCountryByID);
};

export default countryRoutes;