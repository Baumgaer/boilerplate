import type { LiteralUnion } from "type-fest";

type MetadataType = IIdentifiedType & IModelType & IMixedType & IArrayType & IUnionOrIntersectionType & ILiteralType & IUnresolvedType & IInterfaceType & ITupleType & IOptionalType;

export interface IIdentifiedType {
    identifier: LiteralUnion<"String" | "Number" | "Boolean" | "Date", string>;
}

export interface IModelType {
    identifier: IIdentifiedType["identifier"];
    isModel: boolean;
}

export interface IMixedType {
    isMixed: boolean;
}

export interface IInterfaceType {
    isInterface: boolean,
    members: Record<string, MetadataType>
}

export interface IUnresolvedType {
    isUnresolvedType: true;
}

export interface ILiteralType {
    isLiteral?: true;
    isStringLiteral?: boolean;
    isNumberLiteral?: boolean;
    value: string | number;
}

export interface IArrayType {
    isArray: boolean;
    subType: MetadataType;
}

export interface IUnionOrIntersectionType {
    isUnion?: boolean;
    isIntersection?: boolean;
    subTypes: MetadataType[]
}

export interface IOptionalType {
    isOptional: boolean;
    subType: MetadataType
}

export interface ITupleType {
    isTuple: boolean;
    subTypes: MetadataType[]
}

export interface IMetadata {
    name: string;
    isInternal: boolean;
    isReadOnly: boolean;
    isRequired: boolean;
    isLazy: boolean;
    type: MetadataType;
}
