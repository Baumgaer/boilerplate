import { SchemaTypeOptions } from "mongoose";
import { Vue } from "vue-class-component";

export function Model(): ClassDecorator {
    return (_target) => {
        // pass
    };
}

export function Attr<T extends Vue>(_options: Omit<SchemaTypeOptions<T> & ThisType<T>, "default">): PropertyDecorator {
    // TODO:
    //      1. Make immutable on readonly
    //      2. Make enum on union types? Or maybe build own custom validator
    //      3. Make required if not optional
    return (_target, _propertyName) => {
        // pass
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
