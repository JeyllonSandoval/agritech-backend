"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
const db_1 = __importDefault(require("@/db/db"));
const usersSchema_1 = __importDefault(require("@/db/schemas/usersSchema"));
const bcrypt = __importStar(require("bcrypt"));
const uuid_1 = require("uuid");
const token_1 = require("@/utils/token");
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const registerUserSchema = zod_1.z.object({
    RoleID: zod_1.z.string().uuid({ message: "Invalid role ID" }),
    imageUser: zod_1.z.string().url({ message: "Invalid image URL" }).optional(),
    FirstName: zod_1.z.string().min(2, { message: "First name must be at least 2 characters long" }),
    LastName: zod_1.z.string().min(2, { message: "Last name must be at least 2 characters long" }),
    CountryID: zod_1.z.string().uuid({ message: "Invalid country ID" }),
    Email: zod_1.z.string().email({ message: "Invalid email address" }),
    password: zod_1.z.string().min(6, { message: "Password must be at least 6 characters long" }),
});
const loginUserSchema = zod_1.z.object({
    Email: zod_1.z.string().email({ message: "Invalid email address" }),
    password: zod_1.z.string().min(6, { message: "Password is invalid" }),
});
const registerUser = (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cleanedData = Object.assign(Object.assign({}, req.body), { FirstName: req.body.FirstName.trim(), LastName: req.body.LastName.trim(), Email: req.body.Email.trim(), password: req.body.password.trim() });
        const result = registerUserSchema.safeParse(cleanedData);
        if (!result.success) {
            return reply.status(400).send({
                error: "Validation error",
                details: result.error.format()
            });
        }
        const UserID = (0, uuid_1.v4)();
        const hashedPassword = yield bcrypt.hash(result.data.password, 8);
        const [newUser] = yield db_1.default
            .insert(usersSchema_1.default)
            .values({
            UserID,
            RoleID: result.data.RoleID,
            imageUser: result.data.imageUser || '',
            FirstName: result.data.FirstName,
            LastName: result.data.LastName,
            CountryID: result.data.CountryID,
            Email: result.data.Email,
            password: hashedPassword,
            status: "active"
        })
            .returning();
        const token = (0, token_1.generateToken)({
            UserID: UserID,
            Email: result.data.Email,
            RoleID: result.data.RoleID
        });
        return reply.status(201).send({
            message: "User successfully registered",
            user: newUser,
            token
        });
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
            error: "Internal server error",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
});
exports.registerUser = registerUser;
const loginUser = (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cleanedData = Object.assign(Object.assign({}, req.body), { Email: req.body.Email.trim(), password: req.body.password.trim() });
        const result = loginUserSchema.safeParse(cleanedData);
        if (!result.success) {
            return reply.status(400).send({
                error: "Validation error",
                details: result.error.format()
            });
        }
        const { Email, password } = result.data;
        const user = yield db_1.default
            .select()
            .from(usersSchema_1.default)
            .where((0, drizzle_orm_1.eq)(usersSchema_1.default.Email, Email))
            .get();
        if (!user) {
            return reply.status(401).send({ error: "Invalid email or password" });
        }
        const isPasswordValid = yield bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return reply.status(401).send({ error: "Invalid email or password" });
        }
        const token = (0, token_1.generateToken)({
            UserID: user.UserID,
            Email: user.Email,
            RoleID: user.RoleID
        });
        return reply.status(200).send({
            message: "Login successful",
            user: {
                UserID: user.UserID,
                Email: user.Email,
                FirstName: user.FirstName,
                LastName: user.LastName,
                RoleID: user.RoleID,
                imageUser: user.imageUser,
                CountryID: user.CountryID,
                status: user.status
            },
            token
        });
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
            error: "Internal server error",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
});
exports.loginUser = loginUser;
