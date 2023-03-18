import CommonActionSchema from "~common/lib/ActionSchema";
import type SchemaBased from "~client/lib/SchemaBased";

export default class ActionSchema<T extends typeof SchemaBased> extends CommonActionSchema<T> { }
