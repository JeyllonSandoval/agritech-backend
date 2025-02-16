import * as Types from '../type/index.mjs';
import { Module } from './runtime.mjs';
/** Parses a TSchema type from TypeScript syntax but does not infer schematics */
// prettier-ignore
export function NoInfer(...args) {
    const withContext = typeof args[0] === 'string' ? false : true;
    const [context, code, options] = withContext ? [args[0], args[1], args[2] || {}] : [{}, args[0], args[1] || {}];
    const type = Module.Parse('Type', code, context)[0];
    return Types.KindGuard.IsSchema(type)
        ? Types.CloneType(type, options)
        : Types.Never(options);
}
/** Parses a TSchema type from TypeScript syntax */
export function Syntax(...args) {
    return NoInfer.apply(null, args);
}
/**
 * Parses a TSchema type from Syntax.
 * @deprecated Use Syntax() function
 */
export function Parse(...args) {
    return NoInfer.apply(null, args);
}
/**
 * Parses a TSchema from TypeScript Syntax
 * @deprecated Use NoInfer() function
 */
export function ParseOnly(...args) {
    return NoInfer.apply(null, args);
}
