/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/prefer-namespace-keyword */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/consistent-type-imports */

type InternalNames = "className" | "collectionName";
type AllAwaited<T> = { [P in keyof T]: Awaited<T[P]> };

declare type ConstructionParams<T> = Omit<Partial<import("type-fest").ConditionalExcept<AllAwaited<T>, Function>>, InternalNames>;
declare var MODEL_NAME_TO_MODEL_MAP: Record<string, typeof import("~common/lib/BaseModel").default>;

declare type ModuleLike<T> = { [key: string]: T, default: T };

declare type GeneralHookFunction<V, R> = (value: V) => R;
declare type UnspecificHookFunction<T, V, S, R> = (this: T, value: V, parametersOrUser: S) => R;
declare type ObserverHookFunction<T> = (value: T, parameters?: ObserverParameters<T>) => void;
declare type TransformerHookFunction<V, U> = (value: V, user: U) => V;

declare interface ObserverParameters<T> {
    path: (string | symbol)[],

    oldValue: T | undefined
}
