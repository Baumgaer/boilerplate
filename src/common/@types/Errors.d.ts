type ranges = `range${"Overflow" | "Underflow"}`;
type constraints = "type" | "required" | "immutable" | "format" | "unique";
type access = "inexistent" | "forbidden";

export type AttributeKinds = constraints | ranges | access;
