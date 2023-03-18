import CommonDeepTypedSchema from "~common/lib/DeepTypedSchema";
import type SchemaBased from "~env/lib/SchemaBased";

/**
 * @see CommonDeepTypedSchema
 */
export default abstract class DeepTypedSchema<T extends typeof SchemaBased> extends CommonDeepTypedSchema<T> { }
