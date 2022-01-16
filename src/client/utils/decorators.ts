import {
    Prop as PropDecorator,
    Options as OptionsDecorator,
    Watch as WatchDecorator,
    Emit as EmitDecorator,
    Inject as InjectDecorator,
    Provide as ProvideDecorator,
    Model as ModelDecorator,
    Ref as RefDecorator
} from "vue-property-decorator";
export { Model, Attr } from "~common/utils/decorators";


/**
 * Marks a Class as a Controller for a Component
 *
 * @export
 * @param options The Vue component options. See documentation of Vue
 * @returns A component controller as Vue instance
 */
export function Controller(...options: Partial<Parameters<typeof OptionsDecorator>>): ReturnType<typeof OptionsDecorator> {
    const [opts] = options;
    return OptionsDecorator(opts || {});
}

/**
 * Marks a class field as a Vue property which can only be passed to a child
 * component and can only be changed by the parent component
 *
 * @export
 * @param options Options to define requirement, type and default value
 * @returns A Vue property instance
 */
export function Prop(...options: Parameters<typeof PropDecorator>): ReturnType<typeof PropDecorator> {
    return PropDecorator(...options);
}

/**
 * Creates a property which will be reflected if its value changes
 *
 * @export
 * @param options Options to provide an event name and the type
 * @returns
 */
export function Reflected(...options: Parameters<typeof ModelDecorator>): ReturnType<typeof ModelDecorator> {
    return ModelDecorator(...options);
}

/**
 * Marks a class method as a change listener for a class field.
 * The decorated method gets the new value as the first parameter and
 * the old value as the second parameter.
 *
 * @export
 * @param options Options to define the class field to listen to and other behavior options
 * @returns A watch handler instance
 */
export function Watch(...options: Parameters<typeof WatchDecorator>): ReturnType<typeof WatchDecorator> {
    return WatchDecorator(...options);
}

/**
 * Adds an event emitter to the end of the decorated class method.
 * The event name will be transformed to kebab case instead of camel case.
 * All parameters of the method will be used as the event value in same order.
 * If the method has a return value, this will also be emitted as an event
 * value but on first position followed by the parameters.
 *
 * @export
 * @param options The name of the event in camelCase
 * @returns A Vue event instance
 */
export function Emit(...options: Parameters<typeof EmitDecorator>): ReturnType<typeof EmitDecorator> {
    return EmitDecorator(...options);
}

/**
 * Creates an data attribute which gets the value of the same data attribute or property
 * of the parent component if the parent component provides it. This can only be used
 * if the parent component uses the provide decorator.
 *
 * @export
 * @param options Options to define the name of the data attribute which should be used
 * @returns A vue data attribute instance
 */
export function Inject(...options: Parameters<typeof InjectDecorator>): ReturnType<typeof InjectDecorator> {
    return InjectDecorator(...options);
}

/**
 * Provides the value of the decorated property to all child components which inject the asked property
 *
 * @export
 * @param options Options to change the name and value of the property
 * @returns A Vue property instance
 */
export function Provide(...options: Parameters<typeof ProvideDecorator>): ReturnType<typeof ProvideDecorator> {
    return ProvideDecorator(...options);
}

/**
 * Marks a class field as a template ref
 *
 * @export
 * @param options Options to define the name of the reference
 * @returns A Vue reference instance
 */
export function Ref(...options: Parameters<typeof RefDecorator>): ReturnType<typeof RefDecorator> {
    return RefDecorator(...options);
}
