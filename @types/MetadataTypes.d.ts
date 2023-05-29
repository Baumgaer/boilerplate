import type { ColumnType } from "typeorm";

export type CombinedDataType<T> = T | IUnionOrIntersectionType<T>;

export type LiteralTypes = string | number | bigint | boolean | undefined | symbol | null;
export type LiteralTypeNames = "String" | "Number" | "Bigint" | "Boolean" | "Undefined" | "Symbol" | "Null";

export type MetadataType = IMixedType | IUnresolvedType | IOptionalType | IIdentifiedType<string> | ICustomType | IPrimitiveType | ILiteralType | IObjectType | IThisType | INamedObject | IArrayType | ITupleType | IInterfaceType | IModelType | IUnionType | IIntersectionType | IRecordType;

export interface IMixedType {
    isMixed: boolean;
}

export interface IUnresolvedType {
    isUnresolved: boolean;
}

export interface IOptionalType {
    isOptional: boolean;
    subType: MetadataType;
}

export interface IIdentifiedType<T extends string> {
    identifier: T;
}

export interface ICustomType<T = ColumnType> extends IIdentifiedType<T> {
    isCustomType: boolean;
}

export interface IPrimitiveType<T = LiteralTypeNames> extends IIdentifiedType<T> {
    isPrimitive: boolean;
}

export interface ILiteralType<T = LiteralTypes, N = LiteralTypeNames> extends IPrimitiveType<N> {
    isLiteral: boolean;
    value: T
}

export interface IObjectType {
    isObjectType: boolean;
}

export interface IThisType {
    isThisType: boolean;
}

export interface INamedObject<T = string> extends IObjectType, IIdentifiedType<T> {
    isNamedObject: boolean;
}

export interface IArrayType<T = MetadataType> extends IObjectType {
    isArray: boolean;
    subType: T;
}

export interface ITupleType<T = MetadataType> extends Omit<IArrayType<T>, "subType"> {
    isTuple: true;
    subTypes: T[];
}

export interface IInterfaceType extends IObjectType {
    isInterface: boolean;
    members: Record<string, IAttrMetadata>;
}

export interface IRecordType extends IObjectType {
    isRecord: boolean;
    typeArguments: [MetadataType, MetadataType];
}

export interface IModelType extends IIdentifiedType<string>, IObjectType {
    isModel: boolean;
}

export interface IUnionOrIntersectionType<T = MetadataType> extends IObjectType {
    isUnionOrIntersection: boolean;
    subTypes: T[];
}

export interface IUnionType extends IUnionOrIntersectionType {
    isUnion: boolean;
}

export interface IIntersectionType extends IUnionOrIntersectionType {
    isIntersection: boolean;
}

export interface IModelMetadata {
    className: string;
    collectionName: string;
    isAbstract: boolean;
}

export interface IDeepTypedMetadata {
    type: MetadataType;

    name: string;
    isRequired: boolean;
    isLazy: boolean;
    isEager: boolean;
}

export interface IAttrMetadata extends IDeepTypedMetadata {
    isInternal: boolean;
    isReadOnly: boolean;
}

export interface IRouteMetadata {
    name: string;
}
