import db from "../db/db";
import rolesSchema from "../db/schemas/rolesSchema";
import { v4 as uuidv4 } from "uuid";

const createRoles = async () => {
    try {
        const count = await db.select().from(rolesSchema);

        if (count.length > 0) {
            console.log("Roles already exist in the database ✅");
            return;
        }

        const roles = [
            { rolename: "public", status: "active" },
            { rolename: "admin", status: "active" }
        ].map(role => ({ ...role, RoleID: uuidv4() }));

        await db.insert(rolesSchema).values(roles);

        console.log("Created roles successfully ✅");
    } catch (error) {
        console.error("Missing Falling created roles ❌:", error);
    }
};

export default createRoles;
