import CommonBaseAction from "~common/lib/BaseAction";
import type SchemaBased from "~server/lib/SchemaBased";

export default abstract class BaseAction<T extends typeof SchemaBased> extends CommonBaseAction<T> { }
