import { isTupleType as isArrayTupleType, isObjectType as isObjType, isTypeReference, isInterfaceType as isInterType } from "tsutils";
import * as ts from "typescript";

export function isType(value: unknown): value is ts.Type {
    return Boolean(value && "flags" in value && "objectFlags" in value);
}

export function isStringType(type?: ts.Type): type is ts.StringLiteralType {
    return Boolean(type && (type.flags & ts.TypeFlags.String) === ts.TypeFlags.String || isStringLiteralType(type));
}

export function isNumberType(type?: ts.Type): type is ts.NumberLiteralType {
    return Boolean(type && (type.flags & ts.TypeFlags.Number) === ts.TypeFlags.Number || isNumberLiteralType(type));
}

export function isBooleanType(type?: ts.Type) {
    return Boolean(type && (type.flags & ts.TypeFlags.Boolean) === ts.TypeFlags.Boolean || isBooleanLiteralType(type));
}

export function isBigIntType(type?: ts.Type): type is ts.BigIntLiteralType {
    return Boolean(type && (type.flags & ts.TypeFlags.BigInt) === ts.TypeFlags.BigInt || isBigIntLiteralType(type));
}

export function isLiteralType(type?: ts.Type): type is ts.LiteralType {
    return isStringLiteralType(type) || isNumberLiteralType(type) || isBooleanLiteralType(type) || isBigIntLiteralType(type);
}

export function isStringLiteralType(type?: ts.Type): type is ts.StringLiteralType {
    return Boolean(type && (type.flags & ts.TypeFlags.StringLiteral) === ts.TypeFlags.StringLiteral);
}

export function isNumberLiteralType(type?: ts.Type): type is ts.NumberLiteralType {
    return Boolean(type && (type.flags & ts.TypeFlags.NumberLiteral) === ts.TypeFlags.NumberLiteral);
}

export function isBooleanLiteralType(type?: ts.Type) {
    return Boolean(type && (type.flags & ts.TypeFlags.BooleanLiteral) === ts.TypeFlags.BooleanLiteral);
}

export function isBigIntLiteralType(type?: ts.Type): type is ts.BigIntLiteralType {
    return Boolean(type && (type.flags & ts.TypeFlags.BigIntLiteral) === ts.TypeFlags.BigIntLiteral);
}

export function isNullType(type?: ts.Type) {
    return Boolean(type && (type.flags & ts.TypeFlags.Null) === ts.TypeFlags.Null);
}

export function isUndefinedType(type?: ts.Type) {
    return Boolean(type && (type.flags & ts.TypeFlags.Undefined) === ts.TypeFlags.Undefined);
}

export function isObjectType(type?: ts.Type): type is ts.ObjectType {
    return Boolean(type && isObjType(type));
}

export function isInterfaceType(type?: ts.Type): type is ts.InterfaceType {
    return Boolean(type && isInterType(type));
}

export function isClassType(type?: ts.Type) {
    if (!isObjectType(type)) return false;
    return Boolean(type && ((type.objectFlags & ts.ObjectFlags.Class) === ts.ObjectFlags.Class || type.isClass()));
}

export function isModelType(type?: ts.Type) {
    if (!isObjectType(type) && (!isAnyType(type) || !isClassType(type)) || isInterfaceType(type)) return false;
    const symbol = type?.aliasSymbol;
    if (symbol) return (symbol.flags & ts.SymbolFlags.Alias) === ts.SymbolFlags.Alias;
    return true;
}

export function isTupleType(type?: ts.Type): type is ts.TupleType {
    return Boolean(type && isArrayTupleType(type));
}

export function isReferenceType(type?: ts.Type): type is ts.TypeReference {
    return Boolean(type && isTypeReference(type));
}

export function isUnionOrIntersectionType(type?: ts.Type): type is ts.UnionOrIntersectionType {
    return Boolean(type && ((type.flags & ts.TypeFlags.UnionOrIntersection) === ts.TypeFlags.UnionOrIntersection || type.isUnionOrIntersection()));
}

export function isUnionType(type?: ts.Type): type is ts.UnionType {
    return Boolean(type && ((type.flags & ts.TypeFlags.Union) === ts.TypeFlags.Union || type.isUnion()));
}

export function isIntersectionType(type?: ts.Type): type is ts.IntersectionType {
    return Boolean(type && ((type.flags & ts.TypeFlags.Intersection) === ts.TypeFlags.Intersection || type.isIntersection()));
}

export function isAnyType(type?: ts.Type) {
    return Boolean(type && (type.flags & ts.TypeFlags.Any) === ts.TypeFlags.Any);
}
