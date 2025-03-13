"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const country_1 = require("../controllers/country");
const countryRoutes = async (fastify) => {
    fastify.get("/countries", country_1.getCountries);
    fastify.post("/countries", country_1.createCountry);
};
exports.default = countryRoutes;
