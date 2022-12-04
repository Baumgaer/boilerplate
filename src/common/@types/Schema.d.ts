import type { StringKeyOf, ValueOf } from "type-fest";
import type { ActionOptionsPartialMetadataJson } from "~env/@types/ActionSchema";
import type { ArgOptionsPartialMetadataJson } from "~env/@types/ArgumentSchema";
import type { AttrOptionsPartialMetadataJson } from "~env/@types/AttributeSchema";
import type { ModelLike, ModelOptionsPartialMetadataJson } from "~env/@types/ModelClass";
import type ActionSchema from "~env/lib/ActionSchema";
import type AttributeSchema from "~env/lib/AttributeSchema";
import type BaseAttribute from "~env/lib/BaseAttribute";
import type ModelSchema from "~env/lib/ModelSchema";

export interface TypeNameTypeMap<T extends ModelLike> {
    Model: {
        schema: ModelSchema<T>;
        usingInstance: InstanceType<ModelLike>;
        options: ModelOptionsPartialMetadataJson<T>;
    }
    Attribute: {
        schema: AttributeSchema<T>;
        usingInstance: BaseAttribute<T>;
        options: AttrOptionsPartialMetadataJson<T>;
    }
    Argument: {
        schema: ArgumentSchema<T>;
        usingInstance: never;
        options: ArgOptionsPartialMetadataJson<T>;
    }
    Action: {
        schema: ActionSchema<T>;
        usingInstance: never;
        options: ActionOptionsPartialMetadataJson<T>;
    }
}

export type SchemaTypeNames<T extends ModelLike> = StringKeyOf<TypeNameTypeMap<T>>;
export type SchemaTypes<T extends ModelLike> = ValueOf<TypeNameTypeMap<T>>["schema"];
export type InstanceTypes<T extends ModelLike> = ValueOf<TypeNameTypeMap<T>>["usingInstance"];
