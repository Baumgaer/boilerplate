import type { LiteralUnion } from "type-fest";

type MetadataType = IIdentifiedType | INullType | IUndefinedType | IModelType | IMixedType | IArrayType | IUnionOrIntersectionType | ILiteralType | IUnresolvedType | IInterfaceType | ITupleType | IOptionalType;

export type CombinedDataType<T> = T | IUnionOrIntersectionType<T> | IArrayType<T> | ITupleType<T>
export type ObjectLikeDataType = IInterfaceType | IUnionOrIntersectionType | IModelType | CombinedDataType<ObjectLikeDataType>;

export interface IIdentifiedType<T = LiteralUnion<"String" | "Number" | "Boolean" | "Date", string>> {
    identifier: T;
}

export interface INullType {
    isNull: true;
}

export interface IUndefinedType {
    isUndefined: true;
}

export interface IModelType {
    identifier: IIdentifiedType["identifier"];
    isModel: true;
}

export interface IMixedType {
    isMixed: true;
}

export interface IInterfaceType {
    isInterface: true,
    members: Record<string, IAttrMetadata>
}

export interface IUnresolvedType {
    isUnresolvedType: true;
}

export interface ILiteralType<T = string | number> {
    isLiteral?: true;
    isStringLiteral?: T extends string ? true : never;
    isNumberLiteral?: T extends number ? true : never;
    value: T;
}

export interface IArrayType<T = MetadataType> {
    isArray: true;
    subType: T;
}

export interface IUnionOrIntersectionType<T = MetadataType> {
    isUnion?: boolean;
    isIntersection?: boolean;
    subTypes: T[]
}

export interface IUnionType<T = MetadataType> extends Omit<IUnionOrIntersectionType<T>, "isIntersection"> {
    isUnion: true;
}

export interface IIntersectionType<T = MetadataType> extends Omit<IUnionOrIntersectionType<T>, "isUnion"> {
    isIntersection: true;
}

export interface IOptionalType {
    isOptional: true;
    subType: MetadataType
}

export interface ITupleType<T = MetadataType> {
    isTuple: true;
    subTypes: T[]
}

export interface IModelMetadata {
    className: string;
    collectionName: string;
    isAbstract: boolean;
}

export interface IAttrMetadata {
    name: string;
    isInternal: boolean;
    isReadOnly: boolean;
    isRequired: boolean;
    isLazy: boolean;
    type: MetadataType;
}
