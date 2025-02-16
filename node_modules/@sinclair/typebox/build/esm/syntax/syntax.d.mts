import * as Types from '../type/index.mjs';
import { Static } from '../parser/index.mjs';
import { Type } from './static.mjs';
/** Parses a TSchema type from TypeScript syntax but does not infer schematics */
export declare function NoInfer<Context extends Record<PropertyKey, Types.TSchema>, Code extends string>(context: Context, code: Code, options?: Types.SchemaOptions): Types.TSchema | undefined;
/** Parses a TSchema type from TypeScript syntax but does not infer schematics */
export declare function NoInfer<Code extends string>(code: Code, options?: Types.SchemaOptions): Types.TSchema | undefined;
/** Infers a TSchema type from TypeScript syntax. */
export type TSyntax<Context extends Record<PropertyKey, Types.TSchema>, Code extends string> = (Static.Parse<Type, Code, Context> extends [infer Type extends Types.TSchema, string] ? Type : Types.TNever);
/** Parses a TSchema type from TypeScript syntax */
export declare function Syntax<Context extends Record<PropertyKey, Types.TSchema>, Code extends string>(context: Context, code: Code, options?: Types.SchemaOptions): TSyntax<Context, Code>;
/** Parses a TSchema type from TypeScript syntax */
export declare function Syntax<Code extends string>(code: Code, options?: Types.SchemaOptions): TSyntax<{}, Code>;
/**
 * Parses a TSchema type from Syntax.
 * @deprecated Use Syntax() function
 */
export declare function Parse<Context extends Record<PropertyKey, Types.TSchema>, Code extends string>(context: Context, code: Code, options?: Types.SchemaOptions): TSyntax<Context, Code>;
/**
 * Parses a TSchema type from Syntax.
 * @deprecated Use Syntax() function
 */
export declare function Parse<Code extends string>(code: Code, options?: Types.SchemaOptions): TSyntax<{}, Code>;
/**
 * Parses a TSchema from TypeScript Syntax
 * @deprecated Use NoInfer() function
 */
export declare function ParseOnly<Context extends Record<PropertyKey, Types.TSchema>, Code extends string>(context: Context, code: Code, options?: Types.SchemaOptions): Types.TSchema | undefined;
/**
 * Parses a TSchema from TypeScript Syntax
 * @deprecated Use NoInfer() function
 */
export declare function ParseOnly<Code extends string>(code: Code, options?: Types.SchemaOptions): Types.TSchema | undefined;
