/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/prefer-namespace-keyword */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/consistent-type-imports */

type InternalNames = "className" | "collectionName" | "unProxyfiedObject" | "dummyId" | "isBaseModel";
type AllAwaited<T> = { [P in keyof T]: Awaited<T[P]> };

declare type RealConstructionParams<T> = Omit<import("type-fest").ConditionalExcept<AllAwaited<T>, Function>, InternalNames>;
declare type ConstructionParams<T> = Partial<RealConstructionParams<T>>;
declare var MODEL_NAME_TO_MODEL_MAP: Record<string, typeof import("~env/lib/BaseModel").default>;
declare var COLLECTION_NAME_TO_MODEL_MAP: Record<string, typeof import("~env/lib/BaseModel").default>;

declare type ModuleLike<T> = { [key: string]: T, default: T };

declare type GeneralHookFunction<V, R> = (value: V) => R;
declare type ActionFunction = (...value: any[]) => Promise<any>;
declare type UnspecificHookFunction<T, V, S, R> = (this: T, value: V, parametersOrUser: S) => R;
declare type ObserverHookFunction<T> = (value: T, parameters?: ObserverParameters<T>) => void;

declare interface ObserverParameters<T> {
    path: (string | symbol)[],

    oldValue: T | undefined
}
