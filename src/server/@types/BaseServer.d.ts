export type cspSrcNames = "default" | "font" | "frame" | "img" | "media" | "manifest" | "object" | "script" | "style" | "connect"
export type cspSrc = `${cspSrcNames}Src` | "frameAncestors" | "baseUri" | "formAction"
export type SetupCspReturn = Partial<Record<cspSrc, string[]>>
