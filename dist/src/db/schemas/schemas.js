"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolesTable = exports.filesTable = exports.countryTable = exports.chatTable = exports.messageTable = exports.usersTable = void 0;
const usersSchema_1 = __importDefault(require("./usersSchema"));
exports.usersTable = usersSchema_1.default;
const messageSchema_1 = __importDefault(require("./messageSchema"));
exports.messageTable = messageSchema_1.default;
const chatSchema_1 = __importDefault(require("./chatSchema"));
exports.chatTable = chatSchema_1.default;
const countrySchema_1 = __importDefault(require("./countrySchema"));
exports.countryTable = countrySchema_1.default;
const filesScema_1 = __importDefault(require("./filesScema"));
exports.filesTable = filesScema_1.default;
const rolesSchema_1 = __importDefault(require("./rolesSchema"));
exports.rolesTable = rolesSchema_1.default;
