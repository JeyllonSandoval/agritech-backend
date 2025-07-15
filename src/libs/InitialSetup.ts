import db from "@/db/db";
import rolesSchema from "@/db/schemas/rolesSchema";
import countryTable from "@/db/schemas/countrySchema";
import { countriesData } from "@/db/data/countries";
import { v4 as uuidv4 } from "uuid";

const createRoles = async () => {
    try {
        const count = await db.select().from(rolesSchema);

        if (count.length > 0) {
    
            return;
        }

        const roles = [
            { rolename: "public", status: "active" },
            { rolename: "admin", status: "active" }
        ].map(role => ({ ...role, RoleID: uuidv4() }));

        await db.insert(rolesSchema).values(roles);


    } catch (error) {
        console.error("Missing Falling created roles ❌:", error);
    }
};

const createCountries = async () => {
    try {
        const count = await db.select().from(countryTable);

        if (count.length > 0) {
    
            return;
        }

        await db.insert(countryTable).values(countriesData.countriesData.map(country => ({
            ...country,
            CountryID: uuidv4(),
            createdAt: new Date().toISOString(),
            status: "active",
            countryname: country.countryName
        })));
        


    } catch (error) {
        console.error("Missing Falling created countries ❌:", error);
    }
}

export { createRoles, createCountries };
