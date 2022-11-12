import MetadataStore from "~common/lib/MetadataStore";
import ModelClassFactory from "~common/lib/ModelClass";
import AttributeSchema from "~env/lib/AttributeSchema";
import ModelSchema from "~env/lib/ModelSchema";
import { mergeWith } from "~env/utils/utils";
import type { AttrOptions, AttrOptionsWithMetadataJson, AttrOptionsPartialMetadataJson, AttrObserverTypes } from "~env/@types/AttributeSchema";
import type { IAttrMetadata, IModelMetadata } from "~env/@types/MetadataTypes";
import type { ModelOptions, ModelOptionsPartialMetadataJson, ModelOptionsWithMetadataJson, ActionParameters, ArgParameters } from "~env/@types/ModelClass";
import type BaseModel from "~env/lib/BaseModel";
import type { AttributeError } from "~env/lib/Errors";

/**
 * Defines a BaseModel inherited class as a real model which will be stored in
 * the database. It automatically sets the className and collectionName during
 * compile time and creates a ModelSchema depending on the attributes in the
 * class.
 *
 * @template T the model class the future model belongs to (detected automatically)
 * @param [options={}] Options based on TypeORM and some additional options
 * @returns a ClassDecorator which invokes the ModelClass which extends the given model and adds basic functions
 */
export function Model<T extends typeof BaseModel>(options?: ModelOptions<T>): ClassDecorator {
    const metadataStore = new MetadataStore();
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
        const attributeDefinitions = metadataStore.getAttributeSchemas(target);
        for (const attributeDefinition of attributeDefinitions) attributeDefinition.setOwner(modelClass);
        const modelSchema = new ModelSchema(modelClass, target.className, attributeDefinitions, options);
        metadataStore.setModelSchema(target, target.className, modelSchema);
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
 * @param [options={}] Options based on TypeORM and some additional options
 * @returns a PropertyDecorator which invokes the attribute
 */
export function Attr<T extends typeof BaseModel>(options?: AttrOptions<T>): PropertyDecorator {
    const metadataStore = new MetadataStore();
    const metadata: IAttrMetadata = JSON.parse((<AttrOptionsWithMetadataJson<T>>options).metadataJson);
    const metadataOptions: AttrOptionsPartialMetadataJson<T> = mergeWith({}, metadata, <AttrOptionsWithMetadataJson<T>>options);
    delete metadataOptions.metadataJson;

    return (target) => {
        // We need to use the constructor to have the correct class type for
        // the AttributeSchema. This has to be corrected when the property
        // decorators of third party tools are used later on. In this case we
        // need the prototype property (not the prototype of the chain)
        // of this constructor
        const theTarget = <T>target.constructor;
        const attrName = <keyof T>metadataOptions.name.toString();
        const options = metadataStore.constructAttributeSchemaParams<T>(attrName, metadataOptions);
        const attributeDefinition = new AttributeSchema<T>(theTarget, attrName, options);
        metadataStore.setAttributeSchema(theTarget, attrName, attributeDefinition);
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
    return (target: Partial<T>, _methodName: string | symbol, descriptor: TypedPropertyDescriptor<GeneralHookFunction<T[typeof attributeName], true | AttributeError>>) => {
        Reflect.defineMetadata(`${String(attributeName)}:validator`, descriptor, target);
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
    return (target: Partial<T>, _methodName: string | symbol, descriptor: TypedPropertyDescriptor<() => T[typeof attributeName]>) => {
        Reflect.defineMetadata(`${String(attributeName)}:getter`, descriptor, target);
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
    return (target: Partial<T>, _methodName: string | symbol, descriptor: TypedPropertyDescriptor<GeneralHookFunction<T[typeof attributeName], T[typeof attributeName]>>) => {
        Reflect.defineMetadata(`${String(attributeName)}:setter`, descriptor, target);
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
    return (target: Partial<T>, _methodName: string | symbol, descriptor: TypedPropertyDescriptor<ObserverHookFunction<any>>) => {
        Reflect.defineMetadata(`${String(attributeName)}:observer:${type}`, descriptor, target);
    };
}

/**
 * Registers a method as a mutation action. This method can have any parameters
 * which also can be marked with @Arg(). The decorated method will always return
 * a promise event if there is no async code.
 *
 * @param params the parameters which control the behavior of the action
 * @returns a decorator which registers the method as a mutation action
 */
export function Mutation(params: ActionParameters) {
    return (target: any, methodName: string | symbol, descriptor: TypedPropertyDescriptor<ActionFunction>) => {
        const defaultAccessRight = () => false;
        params.httpMethod = params.httpMethod ?? "POST";
        params.accessRight = params.accessRight ?? defaultAccessRight;

        const args = Reflect.getOwnMetadata("arguments", target, methodName);
        const metadataStore = new MetadataStore();
        metadataStore.setAction(target, String(methodName), { params, descriptor, args });
    };
}

/**
 * Registers a method as a query action. This method can have any parameters
 * which also can be marked with @Arg(). The decorated method will always return
 * a promise event if there is no async code.
 *
 * @param params the parameters which control the behavior of the action
 * @returns a decorator which registers the method as a query action
 */
export function Query(params: ActionParameters) {
    return (target: any, methodName: string | symbol, descriptor: TypedPropertyDescriptor<ActionFunction>) => {
        const defaultAccessRight = () => false;
        params.httpMethod = params.httpMethod ?? "GET";
        params.accessRight = params.accessRight ?? defaultAccessRight;

        const args = Reflect.getOwnMetadata("arguments", target, methodName);
        const metadataStore = new MetadataStore();
        metadataStore.setAction(target, String(methodName), { params, descriptor, args });
    };
}

/**
 * Registers a parameter as a action parameter. The name of the parameter will be
 * used as the name of the parameter on server / client and will also be sent in
 * the payload / query parameters.
 *
 * @param params the parameters which control the behavior of the parameter
 * @returns a decorator which registers the parameter as an action parameter
 */
export function Arg<T>(params: ArgParameters) {
    return (target: Partial<T>, methodName: string | symbol, index: number) => {
        const args = Reflect.getOwnMetadata("arguments", target, methodName) || {};
        args[params.name || ""] = { index, isId: Boolean(params.isId) };
        Reflect.defineMetadata(`arguments`, args, target, methodName);
    };
}
