"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.NoInfer = NoInfer;
exports.Syntax = Syntax;
exports.Parse = Parse;
exports.ParseOnly = ParseOnly;
const Types = require("../type/index");
const runtime_1 = require("./runtime");
/** Parses a TSchema type from TypeScript syntax but does not infer schematics */
// prettier-ignore
function NoInfer(...args) {
    const withContext = typeof args[0] === 'string' ? false : true;
    const [context, code, options] = withContext ? [args[0], args[1], args[2] || {}] : [{}, args[0], args[1] || {}];
    const type = runtime_1.Module.Parse('Type', code, context)[0];
    return Types.KindGuard.IsSchema(type)
        ? Types.CloneType(type, options)
        : Types.Never(options);
}
/** Parses a TSchema type from TypeScript syntax */
function Syntax(...args) {
    return NoInfer.apply(null, args);
}
/**
 * Parses a TSchema type from Syntax.
 * @deprecated Use Syntax() function
 */
function Parse(...args) {
    return NoInfer.apply(null, args);
}
/**
 * Parses a TSchema from TypeScript Syntax
 * @deprecated Use NoInfer() function
 */
function ParseOnly(...args) {
    return NoInfer.apply(null, args);
}
