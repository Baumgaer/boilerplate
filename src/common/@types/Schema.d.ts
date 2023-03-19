import type { StringKeyOf, ValueOf } from "type-fest";
import type { ActionOptionsPartialMetadataJson } from "~env/@types/ActionSchema";
import type { ArgOptionsPartialMetadataJson } from "~env/@types/ArgumentSchema";
import type { AttrOptionsPartialMetadataJson } from "~env/@types/AttributeSchema";
import type { ModelLike, ModelOptionsPartialMetadataJson } from "~env/@types/ModelClass";
import type ActionSchema from "~env/lib/ActionSchema";
import type ArgumentSchema from "~env/lib/ArgumentSchema";
import type AttributeSchema from "~env/lib/AttributeSchema";
import type BaseAction from "~env/lib/BaseAction";
import type BaseAttribute from "~env/lib/BaseAttribute";
import type ModelSchema from "~env/lib/ModelSchema";
import type SchemaBased from "~env/lib/SchemaBased";

export interface TypeNameTypeMap<T extends typeof SchemaBased> {
    Model: {
        schema: ModelSchema<T>;
        usingInstance: InstanceType<ModelLike>;
        options: ModelOptionsPartialMetadataJson<T>;
        nameType: string
    }
    Attribute: {
        schema: AttributeSchema<T>;
        usingInstance: BaseAttribute<T>;
        options: AttrOptionsPartialMetadataJson<T>;
        nameType: string
    }
    Argument: {
        schema: ArgumentSchema<T>;
        usingInstance: never;
        options: ArgOptionsPartialMetadataJson<T>;
        nameType: string
    }
    Action: {
        schema: ActionSchema<T>;
        usingInstance: BaseAction<T>;
        options: ActionOptionsPartialMetadataJson<T>;
        nameType: string
    }
}

export type SchemaTypeNames<T extends typeof SchemaBased> = StringKeyOf<TypeNameTypeMap<T>>;
export type SchemaTypes<T extends typeof SchemaBased> = ValueOf<TypeNameTypeMap<T>>["schema"];
export type InstanceTypes<T extends typeof SchemaBased> = ValueOf<TypeNameTypeMap<T>>["usingInstance"];
