"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const country_1 = require("@/controllers/country");
const countryRoutes = async (fastify) => {
    fastify.get("/countries", country_1.getCountries);
    fastify.post("/countries", country_1.createCountry);
    fastify.get("/countries/:CountryID", country_1.getCountryByID);
};
exports.default = countryRoutes;
