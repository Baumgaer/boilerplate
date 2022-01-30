/* eslint no-use-before-define: 0 */ // because otherwise we won't be able to declare recursive types
import { UnionToIntersection } from "type-fest";

type MetadataType = IIdentifiedType | IModelType | IMixedType | IArrayType | IUnionOrIntersectionType | ILiteralType | IUnresolvedType;

interface IIdentifiedType {
    identifier: "String" | "Number" | "Boolean" | "Date" | string;
}

interface IModelType {
    identifier: string;
    isModel: boolean;
}

interface IMixedType {
    isMixed: boolean;
}

interface IUnresolvedType {
    isUnresolvedType: true;
}

interface ILiteralType {
    isLiteral: true;
    isStringLiteral: boolean;
    isNumberLiteral: boolean;
    value: string | number;
}

interface IArrayType {
    isArray: boolean;
    subType: UnionToIntersection<MetadataType>;
}

interface IUnionOrIntersectionType {
    isUnion: boolean;
    isIntersection: boolean;
    subTypes: UnionToIntersection<MetadataType>[]
}

export interface IMetadata {
    isRequired: boolean;
    isReadOnly: boolean;
    isInternal: boolean;
    type: UnionToIntersection<MetadataType>;
}
