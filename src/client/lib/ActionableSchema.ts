import CommonActionableSchema from "~common/lib/ActionableSchema";
import type SchemaBased from "~client/lib/SchemaBased";

/**
 * @see CommonActionableSchema
 */
export default abstract class ActionableSchema<T extends typeof SchemaBased> extends CommonActionableSchema<T> { }
