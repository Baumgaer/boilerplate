import CommonArgumentSchema from "~common/lib/ArgumentSchema";
import type SchemaBased from "~client/lib/SchemaBased";

/**
 * @see CommonArgumentSchema
 */
export default class ArgumentSchema<T extends typeof SchemaBased> extends CommonArgumentSchema<T> { }
