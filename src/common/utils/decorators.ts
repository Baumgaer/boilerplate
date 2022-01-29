import BaseModel from "~common/lib/BaseModel";
import Attribute from "~common/lib/Attribute";
import { merge } from "lodash";
import type { AttrOptions, AttrOptionsWithMetadataJson, AttrOptionsPartialMetadataJson } from "~common/types/decorators";
import type { IMetadata } from "~common/types/metadataTypes";

export function Model(): ClassDecorator {
    return (target) => {
        const schemaDefinition = Reflect.getMetadata("schemaDefinition", target.prototype);
        console.log(schemaDefinition);
    };
}

export function Attr<T extends BaseModel>(options: AttrOptions<T> = {}): PropertyDecorator {
    const metadata: IMetadata = JSON.parse((<AttrOptionsWithMetadataJson<T>>options).metadataJson);
    const metadataOptions: AttrOptionsPartialMetadataJson<T> = merge({}, metadata, <AttrOptionsWithMetadataJson<T>>options);
    delete metadataOptions.metadataJson;

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
        schemaDefinition[attributeName] = new Attribute<T>(metadataOptions);
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
