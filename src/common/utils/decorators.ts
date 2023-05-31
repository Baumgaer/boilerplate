import ModelClassFactory from "~common/lib/ModelClass";
import ActionSchema from "~env/lib/ActionSchema";
import ArgumentSchema from "~env/lib/ArgumentSchema";
import AttributeSchema from "~env/lib/AttributeSchema";
import MetadataStore from "~env/lib/MetadataStore";
import ModelSchema from "~env/lib/ModelSchema";
import { mergeWith } from "~env/utils/utils";
import type { PartialDeep } from "type-fest";
import type { ActionOptions, ActionOptionsPartialMetadataJson, ActionOptionsWithMetadataJson } from "~env/@types/ActionSchema";
import type { ArgOptions, ArgOptionsPartialMetadataJson, ArgOptionsWithMetadataJson } from "~env/@types/ArgumentSchema";
import type { AttrOptions, AttrOptionsPartialMetadataJson, AttrOptionsWithMetadataJson, AttrObserverTypes } from "~env/@types/AttributeSchema";
import type { IAttrMetadata, IModelMetadata, IDeepTypedMetadata } from "~env/@types/MetadataTypes";
import type { ModelOptions, ModelOptionsPartialMetadataJson, ModelOptionsWithMetadataJson } from "~env/@types/ModelClass";
import type { HttpMethods } from "~env/@types/http";
import type BaseModel from "~env/lib/BaseModel";
import type { AttributeError } from "~env/lib/Errors";
import type SchemaBased from "~env/lib/SchemaBased";

const metadataStore = new MetadataStore();

/**
 * Defines a BaseModel inherited class as a real model which will be stored in
 * the database. It automatically sets the className and collectionName during
 * compile time and creates a ModelSchema depending on the attributes in the
 * class.
 *
 * @template T the model class the future model belongs to (detected automatically)
 * @param options Options based on TypeORM and some additional options
 * @returns a ClassDecorator which invokes the ModelClass which extends the given model and adds basic functions
 */
export function Model<T extends typeof BaseModel>(options: ModelOptions<T> = {}): ClassDecorator {
    const metadata: IModelMetadata = JSON.parse((<ModelOptionsWithMetadataJson<T>>options).metadataJson);
    const metadataOptions: ModelOptionsPartialMetadataJson<T> = mergeWith({}, metadata, <ModelOptionsWithMetadataJson<T>>options);
    delete metadataOptions.metadataJson;

    return (target: any) => {
        // Set the class name and collectionName on prototype to have access to
        // that properties on whole prototype chain
        const options = metadataOptions;
        const proto: typeof BaseModel = Object.getPrototypeOf(target);

        if (target.name !== proto.name) return; // This is a common model which will never be a "real" model

        // @ts-expect-error This is readonly to prevent setting it while normal development
        proto.className = options.className;
        // @ts-expect-error This is readonly to prevent setting it while normal development
        proto.collectionName = options.collectionName;

        const modelClass = ModelClassFactory(target, options);

        const attributeSchemas = metadataStore.getSchemas("Attribute", target);
        for (const attributeSchema of attributeSchemas) attributeSchema.setOwner(modelClass);

        const actionSchemas = metadataStore.getSchemas("Action", target);
        for (const actionSchema of actionSchemas) actionSchema.setOwner(modelClass);

        const modelSchema = new ModelSchema(modelClass, target.className, attributeSchemas, actionSchemas, options);

        metadataStore.setSchema("Model", target, target.className, modelSchema);
        return modelClass;
    };
}

/**
 * Defines a property as an attribute which corresponds to a column in the
 * database when the model is marked as a model for the database by using the
 * @Model() decorator. It also constructs an AttributeSchema with the given
 * options based on TypeORM and some additional options.
 *
 * @template T the model class the attribute belongs to (automatically detected)
 * @param options Options based on TypeORM and some additional options
 * @returns a PropertyDecorator which invokes the attribute
 */
export function Attr<T extends typeof BaseModel>(options: AttrOptions<T> = {}): PropertyDecorator {
    const metadata: IAttrMetadata = JSON.parse((options as AttrOptionsWithMetadataJson<T>).metadataJson);
    const metadataOptions: AttrOptionsPartialMetadataJson<T> = mergeWith({}, metadata, options as AttrOptionsWithMetadataJson<T>);
    delete metadataOptions.metadataJson;

    return (target, propertyName) => {
        // We need to use the constructor to have the correct class type for
        // the AttributeSchema. This has to be corrected when the property
        // decorators of third party tools are used later on. In this case we
        // need the prototype property (not the prototype of the chain)
        // of this constructor
        const theTarget = (target.constructor.prototype === target ? target.constructor : target) as T;
        const attrName = metadataOptions.name as keyof T;
        const options = metadataStore.constructSchemaParams<T, "Attribute">("Attribute", String(attrName), metadataOptions);
        const schema = new AttributeSchema<T>(theTarget, attrName, String(propertyName), options);

        metadataStore.setSchema("Attribute", theTarget, String(attrName), schema);
    };
}

/**
 * Registers a method as a validator method for an attribute specified by the name.
 * This method gets the current value as a parameter and has to return a boolean
 * indicating the correctness of the value of the attribute. This will be called
 * when trying to save the model and the attribute has been modified.
 *
 * @template T the model class the attribute belongs to (automatically detected)
 * @param attributeName the name of the attribute
 * @returns a decorator which registers the method as a validator
 */
export function AttrValidator<T>(attributeName: keyof T) {
    return (target: PartialDeep<T>, _methodName: string | symbol, descriptor: TypedPropertyDescriptor<GeneralHookFunction<T[typeof attributeName], true | AttributeError>>) => {
        Reflect.defineMetadata(`${String(attributeName)}:validator`, descriptor, target as object);
    };
}

/**
 * Registers a method as a getter for the attribute. This method has to return
 * a value which corresponds to the type of the attribute given by its name.
 * This will be called when asking for the value of the attribute.
 *
 * @template T the model class the attribute belongs to (automatically detected)
 * @param attributeName the name of the attribute
 * @returns a decorator which registers the method as a getter
 */
export function AttrGetter<T>(attributeName: keyof T) {
    return (target: PartialDeep<T>, _methodName: string | symbol, descriptor: TypedPropertyDescriptor<() => T[typeof attributeName]>) => {
        Reflect.defineMetadata(`${String(attributeName)}:getter`, descriptor, target as object);
    };
}

/**
 * Registers a method as a setter for the attribute. This method gets the new
 * value and has to return a value which will be set to the attribute where its
 * type has to correspond to the type of the attribute given by its name.
 * This will be called when setting the value of the attribute.
 *
 * @template T the model class the attribute belongs to (automatically detected)
 * @param attributeName the name of the attribute
 * @returns a decorator which registers the method as a setter
 */
export function AttrSetter<T>(attributeName: keyof T) {
    return (target: PartialDeep<T>, _methodName: string | symbol, descriptor: TypedPropertyDescriptor<GeneralHookFunction<T[typeof attributeName], T[typeof attributeName]>>) => {
        Reflect.defineMetadata(`${String(attributeName)}:setter`, descriptor, target as object);
    };
}

/**
 * Registers a method as an observer for an attribute. This method gets the
 * new value as well as the parameters of the change as parameters. This method
 * must not return anything. This will be called when the attributes value has
 * been modified.
 *
 * @template T the model class the attribute belongs to (automatically detected)
 * @param attributeName the name of the attribute
 * @param type the type of the observer
 * @returns a decorator which registers the method as an observer
 */
export function AttrObserver<T>(attributeName: keyof T, type: AttrObserverTypes) {
    return (target: PartialDeep<T>, _methodName: string | symbol, descriptor: TypedPropertyDescriptor<ObserverHookFunction<any>>) => {
        Reflect.defineMetadata(`${String(attributeName)}:observer:${type}`, descriptor, target as object);
    };
}

function action<T extends typeof SchemaBased>(
    metadataOptions: ActionOptionsPartialMetadataJson<T>,
    target: any,
    methodName: string | symbol,
    descriptor: TypedPropertyDescriptor<ActionFunction>,
    defaultMethod: HttpMethods
) {
    const defaultAccessRight = () => false;
    metadataOptions.httpMethod = metadataOptions.httpMethod ?? defaultMethod;
    metadataOptions.accessRight = metadataOptions.accessRight ?? defaultAccessRight;

    const theTarget = (target.constructor.prototype === target ? target.constructor : target) as T;
    const options = metadataStore.constructSchemaParams<T, "Action">("Action", String(methodName), metadataOptions);
    const argumentSchemas = metadataStore.getSchemas("Argument", theTarget, (targetName, schemaName) => targetName === theTarget.name && schemaName === methodName);
    const schema = new ActionSchema(theTarget, options.name, String(methodName), options, argumentSchemas, descriptor);

    metadataStore.setSchema("Action", theTarget, String(methodName), schema);
}

/**
 * Registers a method as a mutation action. This method can have any parameters
 * which also can be marked with @Arg(). The decorated method will always return
 * a promise event if there is no async code.
 *
 * @param options the parameters which control the behavior of the action
 * @returns a decorator which registers the method as a mutation action
 */
export function Mutation<T extends typeof SchemaBased>(options: ActionOptions<T> = {}) {
    const metadata: IDeepTypedMetadata = JSON.parse((options as ActionOptionsWithMetadataJson<T>).metadataJson);
    const metadataOptions: ActionOptionsPartialMetadataJson<T> = mergeWith({}, metadata, options as ActionOptionsWithMetadataJson<T>);
    delete metadataOptions.metadataJson;

    return (target: any, methodName: string | symbol, descriptor: TypedPropertyDescriptor<ActionFunction>) => {
        action(metadataOptions, target, methodName, descriptor, "POST");
    };
}

/**
 * Registers a method as a query action. This method can have any parameters
 * which also can be marked with @Arg(). The decorated method will always return
 * a promise event if there is no async code.
 *
 * @param options the parameters which control the behavior of the action
 * @returns a decorator which registers the method as a query action
 */
export function Query<T extends typeof SchemaBased>(options: ActionOptions<T> = {}) {
    const metadata: IDeepTypedMetadata = JSON.parse((options as ActionOptionsWithMetadataJson<T>).metadataJson);
    const metadataOptions: ActionOptionsPartialMetadataJson<T> = mergeWith({}, metadata, options as ActionOptionsWithMetadataJson<T>);
    delete metadataOptions.metadataJson;

    return (target: any, methodName: string | symbol, descriptor: TypedPropertyDescriptor<ActionFunction>) => {
        action(metadataOptions, target, methodName, descriptor, "GET");
    };
}

/**
 * Registers a parameter as a action parameter. The name of the parameter will be
 * used as the name of the parameter on server / client and will also be sent in
 * the payload / query parameters.
 *
 * @param options the parameters which control the behavior of the parameter
 * @returns a decorator which registers the parameter as an action parameter
 */
export function Arg<T extends typeof SchemaBased>(options: ArgOptions<T> = {}) {
    const metadata: IDeepTypedMetadata = JSON.parse((options as ArgOptionsWithMetadataJson<T>).metadataJson);
    const metadataOptions: ArgOptionsPartialMetadataJson<T> = mergeWith({}, metadata, options as ArgOptionsWithMetadataJson<T>);
    delete metadataOptions.metadataJson;

    return (target: T, methodName: string | symbol, index: number) => {
        metadataOptions.index = metadataOptions.index ?? index;

        const theTarget = (target.constructor.prototype === target ? target.constructor : target) as T;
        const options = metadataStore.constructSchemaParams("Argument", String(methodName), metadataOptions, metadataOptions.name);
        const argumentName = options.name;
        const schema = new ArgumentSchema(theTarget, argumentName, String(methodName), options);

        // Use method name for argument name in metadata store to distinguish between
        // arguments with same name in different methods
        metadataStore.setSchema("Argument", theTarget, String(methodName), schema);
    };
}
