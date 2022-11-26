import type { BaseError } from "~env/lib/Errors";

type ranges = `range${"Overflow" | "Underflow"}`;
type constraints = "type" | "required" | "immutable" | "format" | "unique";
type access = "inexistent" | "forbidden";

export type TypedKinds = "unknown" | constraints | ranges | access;

export interface ValidationResult {
    success: boolean;

    errors: BaseError[]
}
