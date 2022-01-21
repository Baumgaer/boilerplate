import { SchemaTypeOptions } from "mongoose";
import BaseModel from "~common/lib/BaseModel";
import { getType } from "tst-reflect";

type allowedAttrFields = "alias" | "cast" | "select" | "index" | "unique" |
    "sparse" | "text" | "subtype" | "min" | "max" |
    "expires" | "excludeIndexes" | "match" | "lowercase" |
    "uppercase" | "trim" | "minlength" | "maxlength";

/**
 * @reflectDecorator
 */
export function Model<T>(): ClassDecorator {
    const theType = getType<T>();
    console.log(theType);

    return (target) => {
        const schemaDefinition = Reflect.getMetadata("schemaDefinition", target.prototype);
        console.log(schemaDefinition);
    };
}

export function Attr<T extends BaseModel>(options: Pick<SchemaTypeOptions<keyof T> & ThisType<T>, allowedAttrFields> = {}): PropertyDecorator {
    // TODO:
    //      1. Make immutable on readonly
    //      2. Make enum on union types? Or maybe build own custom validator
    //      3. Make required if not optional
    //      4. Determine "ref" in case of Model
    //      5. Determine "of" in case of Map
    return (target, attributeName) => {
        let schemaDefinition = Reflect.getMetadata("schemaDefinition", target);
        if (!schemaDefinition) {
            schemaDefinition = {};
            Reflect.defineMetadata("schemaDefinition", schemaDefinition, target);
        }
        if (schemaDefinition[attributeName]) throw new Error(`Attribute "${attributeName.toString()}" is already defined`);
        schemaDefinition[attributeName] = options;
    };
}

export function AttrValidator(): MethodDecorator {
    return (_target, _propertyName, _descriptor) => {
        // pass
    };
}

export function AttrGetter(): MethodDecorator {
    return (_target, _propertyName, _descriptor) => {
        // pass
    };
}

export function AttrSetter(): MethodDecorator {
    return (_target, _propertyName, _descriptor) => {
        // pass
    };
}

export function AttrTransformer(): MethodDecorator {
    return (_target, _propertyName, _descriptor) => {
        // pass
    };
}
