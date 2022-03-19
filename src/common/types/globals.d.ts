/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/prefer-namespace-keyword */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/consistent-type-imports */

type InternalNames = "className" | "collectionName";
type AllAwaited<T> = { [P in keyof T]: Awaited<T[P]> };

declare type ConstructionParams<T> = Omit<Partial<import("type-fest").ConditionalExcept<AllAwaited<T>, Function>>, InternalNames>;
declare var MODEL_NAME_TO_MODEL_MAP: Record<string, typeof import("~common/lib/BaseModel").default>;

declare interface ObserverParameters<T> {
    path: (string | symbol)[],

    oldValue: T | undefined
}
