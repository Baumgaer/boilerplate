/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/prefer-namespace-keyword */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/consistent-type-imports */

type internalNames = "className" | "collectionName";
type AllAwaited<T> = { [P in keyof T]: Awaited<T[P]> };

declare type ConstructionParams<T> = Omit<Partial<import("type-fest").ConditionalExcept<AllAwaited<T>, Function>>, internalNames>;
declare var MODEL_NAME_TO_MODEL_MAP: Record<string, typeof import("~common/lib/BaseModel").default>;
