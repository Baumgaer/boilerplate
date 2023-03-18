import CommonActionSchema from "~common/lib/ActionSchema";
import type SchemaBased from "~server/lib/SchemaBased";

export default class ActionSchema<T extends typeof SchemaBased> extends CommonActionSchema<T> { }
