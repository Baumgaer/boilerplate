export type LiteralTypes = string | number | bigint | boolean | undefined | symbol | null;

export type MetadataType = IMixedType | IUnresolvedType | IOptionalType | IIdentifiedType | IPrimitiveType | ILiteralType | IObjectType | IArrayType | ITupleType | IInterfaceType | IModelType | IUnionType | IIntersectionType;

export interface IMixedType {
    isMixed: boolean;
}

export interface IUnresolvedType {
    isUnresolved: boolean;
}

export interface IOptionalType {
    isOptional: true;
    subType: MetadataType
}

export interface IIdentifiedType {
    identifier: string;
}

export interface IPrimitiveType {
    identifier: "String" | "Number" | "Bigint" | "Boolean" | "Undefined" | "Symbol" | "Null";
    isPrimitive: boolean;
}

export interface ILiteralType extends IPrimitiveType {
    isLiteral: boolean;
    value: LiteralTypes
}

export interface IObjectType {
    isObjectType: boolean;
}

export interface IArrayType<T = MetadataType> extends IObjectType {
    isArray: boolean;
    subType: T;
}

export interface ITupleType<T = MetadataType> extends Omit<IArrayType<T>, "subType"> {
    isTuple: true;
    subTypes: T[]
}

export interface IInterfaceType extends IObjectType {
    isInterface: boolean;
    members: Record<string, IAttrMetadata>;
}

export interface IModelType extends IIdentifiedType, IObjectType {
    isModel: boolean;
}

export interface IUnionOrIntersectionType<T = MetadataType> {
    isUnionOrIntersection: boolean;
    subTypes: T[];
}

export interface IUnionType extends IUnionOrIntersectionType {
    isUnion: boolean;
}

export interface IIntersectionType extends IUnionOrIntersectionType {
    isIntersection: boolean;
}

export interface IAttrMetadata {
    name: string;
    isInternal: boolean;
    isReadOnly: boolean;
    isRequired: boolean;
    isLazy: boolean;
    type: MetadataType;
}
