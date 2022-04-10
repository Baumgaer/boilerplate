/* eslint-disable @typescript-eslint/consistent-type-imports */

// How to use custom types
// =======================
//
// To write a custom type, declare a new type as usual and give it a JSDoc comment.
// In this comment you can use different JSDoc tag which have effect on type reflection.
//
// Example:
//
// /**
//  * A normal description text for the type which should contain the
//  * functionality in ORM and API.
//  *
//  * @alias <name> The name of the type at runtime (optional)
//  * @property {<value or variable>} <name> A Property which will be includes into the @Attr() parameters (e.g. isLazy).
//                                           If a variable is given it has to be equal with a type parameter, otherwise it is a value.
//  * @emits <parameter name> The name of the parameter which should be used as runtime type
//  */
// declare type varchar<Length> = import("type-fest").Opaque<string, Length>;
// HINT: DO NOT REMOVE THE NEXT LINE!
type EndOfExplanation = string;

/**
 * This type makes attribute lazy which means that this attribute is only
 * loaded from database when it's used.
 *
 * @property {true} isLazy causes that this type will only be loaded when it's used
 * @emits T Will use the type given to the parameter T at runtime
 */
declare type Lazy<T> = Promise<T> | T;

/**
 * A standard database type for strings to safe memory
 *
 * @property {Length} length The maximum length of the string
 * @property {validateVarchar} validator The check function to ensure type safety at runtime
 */
declare type varchar<Length> = import("type-fest").Opaque<string, Length>;
