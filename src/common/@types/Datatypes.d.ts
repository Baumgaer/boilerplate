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
//  * @alias <name> The name of the type in database (must match ColumnType of TypeORM) (can not be used with @emit)
//  * @property {<value or variable>} <name> A Property which will be included into the @Attr() parameters (e.g. isLazy).
//                                           If a variable is given it has to be equal with a type parameter, otherwise it is a value.
//  * @emits <parameter name> The name of the parameter which should be used as runtime type (can not be used with @alias)
//  */
// declare type varchar<Length> = import("type-fest").Opaque<string, Length>;
// HINT: DO NOT REMOVE THE NEXT LINE!
type EndOfExplanation = string;

/**
 * This type makes attribute lazy which means that this attribute is only
 * loaded from database when it's used.
 *
 * @emits T Will use the type given to the parameter T at runtime
 * @property {true} isLazy causes that this type will only be loaded when it's used
 */
declare type Lazy<T> = Promise<T> | T;

/**
 * A standard database type for strings to safe memory that has to be at least
 * 0 characters and at most <Length>. Length can be at most 65535
 *
 * @alias varchar
 * @property {0} min The minimum length of the string
 * @property {Length} max The maximum length of the string
 * @property {"Varchar"} validator The check function to ensure type safety at runtime
 */
declare type Varchar<Length extends number> = import("type-fest").Opaque<string, `Varchar${Length}`>;

/**
 * A number that has to be between Min and Max (inclusive).
 * <Min> and <Max> can be Infinity or -Infinity
 *
 * @alias float
 * @property {Min} min The minimum length of the string
 * @property {Max} max The maximum length of the string
 * @property {"NumberRange"} validator The check function to ensure type safety at runtime
 */
declare type NumberRange<Min extends number, Max extends number> = import("type-fest").Opaque<number, `NumberRange${Min}_${Max}`>;

/**
 * A string that has to be at least <Min> characters and at most <Max> characters.
 * <Min> and <Max> can be Infinity or -Infinity
 *
 * @alias text
 * @property {Min} min The minimum length of the string
 * @property {Max} max The maximum length of the string
 * @property {"TextRange"} validator The check function to ensure type safety at runtime
 */
declare type TextRange<Min extends number, Max extends number> = import("type-fest").Opaque<string, `TextRange${Min}_${Max}`>;

/**
 * A string that represents an email
 *
 * @alias varchar
 * @property {"Email"} validator The check function to ensure type safety at runtime
 */
declare type Email = import("type-fest").Opaque<string, `Email`>;

/**
 * A string that represents an UUID
 *
 * @alias varchar
 * @property {"UUID"} validator The check function to ensure type safety at runtime
 */
declare type UUID = import("type-fest").Opaque<string, `UUID`>;

/**
 * Marks an attribute as unique
 *
 * @emits T
 * @property {true} unique The property has to be unique
 * @property {"unique"} validator The check function to ensure type safety at runtime
 */
declare type Unique<T> = T;
