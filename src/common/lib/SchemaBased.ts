import type Schema from "~env/lib/Schema";

export default abstract class SchemaBased {

    public static readonly unProxyfiedObject: typeof SchemaBased;

    public abstract unProxyfiedObject: this;

    public constructor(_params?: ConstructionParams<SchemaBased>) {
        // Nothing to do here. This is just an interface to match the type
    }

    public abstract getSchema(): Schema<any> | null;

    public abstract getActionSchema(name: string): Schema<any> | null;
}
