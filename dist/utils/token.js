"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET must be defined in environment variables');
}
const generateToken = (user) => {
    try {
        return (0, jsonwebtoken_1.sign)({
            UserID: user.UserID,
            Email: user.Email,
            RoleID: user.RoleID,
            emailVerified: user.emailVerified
        }, JWT_SECRET, {
            expiresIn: '24h',
        });
    }
    catch (error) {
        console.log(error);
        throw new Error("Failed to generate token");
    }
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    try {
        const decoded = (0, jsonwebtoken_1.verify)(token, JWT_SECRET);
        return {
            UserID: decoded.UserID,
            Email: decoded.Email,
            RoleID: decoded.RoleID,
            emailVerified: decoded.emailVerified
        };
    }
    catch (error) {
        console.log(error);
        throw new Error("Mision Failed: Token no created");
    }
};
exports.verifyToken = verifyToken;
