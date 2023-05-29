import AttributeSchemaBased from "~env/lib/AttributeSchemaBased";

export default abstract class ModelSchemaBased extends AttributeSchemaBased {

    /**
     * The name of the class after compile time. This will be set by the
     * @Model() decorator which will receive this value by a developer or
     * by the reflectionTransformer.
     */
    public static readonly className: string;

    /**
     * The name of the collection where the model is stored in after compile time.
     * This will be set by the @Model() decorator which will receive this value
     * by a developer or by the reflectionTransformer. The naming strategy is
     * to add an "s" at the end because we assume that a collection always
     * contains several models of this type.
     */
    public static readonly collectionName: string;

    /**
     * This gives access to the model (instance | class) without proxy around.
     * This enables to change an attribute without causing
     * changes and also gives the ability to improve performance.
     */
    public static override readonly unProxyfiedObject: typeof ModelSchemaBased;


    /**
     * @see ModelSchemaBased.className
     */
    public readonly className!: string;

    /**
     * @see ModelSchemaBased.collectionName
     */
    public readonly collectionName!: string;

    /**
     * @see ModelSchemaBased.unProxyfiedObject
     */
    public readonly unProxyfiedObject!: this;

    public constructor(params?: Record<string, any>) {
        super(params);
    }

    public isNew() {
        return true;
    }

    public getId(): UUID {
        return "" as UUID;
    }
}
