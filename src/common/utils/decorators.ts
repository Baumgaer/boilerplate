import type BaseModel from "~common/lib/BaseModel";
import ModelClassFactory from "~common/lib/ModelClass";
import { merge } from "lodash";
import type { AttrOptions, AttrOptionsWithMetadataJson, AttrOptionsPartialMetadataJson } from "~common/types/Decorators";
import type { IMetadata } from "~common/types/MetadataTypes";

export function Model(className: string, collection: string): ClassDecorator {
    return (target: any) => {
        target.className = className;
        target.collection = collection;
        return <any>ModelClassFactory(<any>target);
    };
}

export function Attr<T extends BaseModel>(options: AttrOptions<T> = {}): PropertyDecorator {
    const metadata: IMetadata = JSON.parse((<AttrOptionsWithMetadataJson<T>>options).metadataJson);
    const metadataOptions: AttrOptionsPartialMetadataJson<T> = merge({}, metadata, <AttrOptionsWithMetadataJson<T>>options);
    delete metadataOptions.metadataJson;

    return (target, attributeName) => {
        const attributeString = attributeName.toString();
        let schemaDefinition = Reflect.getMetadata(`${target.constructor.name}:schemaDefinition`, target);
        if (!schemaDefinition) {
            schemaDefinition = {};
            Reflect.defineMetadata(`${target.constructor.name}:schemaDefinition`, schemaDefinition, target);
        }
        schemaDefinition[attributeString] = metadataOptions;
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
