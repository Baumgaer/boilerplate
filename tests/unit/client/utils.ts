import type { IAttrMetadata } from "~client/@types/MetadataTypes";

export interface IMyInterface {
    prop1: string;
    prop2?: number;
}

export const className = "TestModel";
export const collectionName = "TestModels";

export const typeMap: Record<string, IAttrMetadata["type"]> = {
    aBoolean: { identifier: "Boolean" },
    aString: { identifier: "String" },
    aNumber: { identifier: "Number" },
    aDate: { identifier: "Date" },
    anUnion: {
        isUnion: true,
        subTypes: [
            { isLiteral: true, isStringLiteral: true, value: "Test" },
            { isLiteral: true, isNumberLiteral: true, value: 42 }
        ]
    },
    anIntersection: {
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
        isTuple: true,
        subTypes: [
            { isUndefined: true },
            { isNull: true },
            { isOptional: true, subType: { identifier: "Boolean" } }
        ]
    },
    anInterface: {
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
        isArray: true,
        subType: { identifier: "String" }
    }
};

export function createMetadataJson(name: keyof typeof typeMap, isRequired = false, isInternal = false, isReadOnly = false, isLazy = false) {
    return JSON.stringify({ name, isInternal, isReadOnly, isRequired, isLazy, type: typeMap[name] });
}
