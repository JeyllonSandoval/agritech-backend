"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolesTable = exports.filesTable = exports.countryTable = exports.chatTable = exports.messageTable = exports.usersTable = void 0;
const usersSchema_1 = __importDefault(require("../schemas/usersSchema"));
exports.usersTable = usersSchema_1.default;
const messageSchema_1 = __importDefault(require("../schemas/messageSchema"));
exports.messageTable = messageSchema_1.default;
const chatSchema_1 = __importDefault(require("../schemas/chatSchema"));
exports.chatTable = chatSchema_1.default;
const countrySchema_1 = __importDefault(require("../schemas/countrySchema"));
exports.countryTable = countrySchema_1.default;
const filesSchema_1 = __importDefault(require("../schemas/filesSchema"));
exports.filesTable = filesSchema_1.default;
const rolesSchema_1 = __importDefault(require("../schemas/rolesSchema"));
exports.rolesTable = rolesSchema_1.default;
