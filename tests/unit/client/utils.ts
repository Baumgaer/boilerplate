import type { IAttrMetadata } from "~client/@types/MetadataTypes";

export const className = "TestModel";
export const collectionName = "TestModels";

export const typeMap: Record<string, IAttrMetadata["type"]> = {
    aBoolean: { identifier: "Boolean" },
    aString: { identifier: "String" },
    aNumber: { identifier: "Number" },
    aDate: { identifier: "Date" },
    anUnion: {
        isObjectType: true,
        isUnion: true,
        subTypes: [
            { isLiteral: true, identifier: "String", value: "Test" },
            { isLiteral: true, identifier: "Number", value: 42 }
        ]
    },
    anIntersection: {
        isObjectType: true,
        isIntersection: true,
        subTypes: [{
            isModel: true,
            identifier: "TestMyTestModel"
        }, {
            isModel: true,
            identifier: "TestMyTesterModel"
        }]
    },
    aTuple: {
        isObjectType: true,
        isArray: true,
        isTuple: true,
        subTypes: [
            { isPrimitive: true, identifier: "Undefined" },
            { isPrimitive: true, identifier: "Null" },
            { isOptional: true, subType: { identifier: "Boolean" } }
        ]
    },
    anInterface: {
        isObjectType: true,
        isInterface: true,
        members: {
            prop1: {
                isInternal: false,
                isLazy: false,
                isReadOnly: false,
                isRequired: true,
                name: "prop1",
                type: { identifier: "String" }
            },
            prop2: {
                isInternal: false,
                isLazy: false,
                isReadOnly: false,
                isRequired: false,
                name: "prop2",
                type: { isOptional: true, subType: { identifier: "Number" } }
            }
        }
    },
    anArray: {
        isObjectType: true,
        isArray: true,
        subType: { identifier: "String" }
    }
};

export function createMetadataJson(name: keyof typeof typeMap, isRequired = false, isInternal = false, isReadOnly = false, isLazy = false) {
    return JSON.stringify({ name, isInternal, isReadOnly, isRequired, isLazy, type: typeMap[name] });
}
