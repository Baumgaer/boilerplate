type internalNames = "className" | "collection"

// eslint-disable-next-line @typescript-eslint/consistent-type-imports, @typescript-eslint/ban-types
declare type ConstructionParams<T> = Omit<Partial<import("type-fest").ConditionalExcept<T, Function>>, internalNames>;
