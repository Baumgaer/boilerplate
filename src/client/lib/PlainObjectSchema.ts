import CommonPlainObjectSchema from "~common/lib/PlainObjectSchema";
import type SchemaBased from "~client/lib/SchemaBased";

export default abstract class PlainObjectSchema<T extends typeof SchemaBased> extends CommonPlainObjectSchema<T> { }
