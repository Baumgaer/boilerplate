import type ts from "typescript";

export type TSNodeNames =
    "Decorator" | "Identifier" | "NamedImports" | "NamedExports" | "TypeNode" | "UnionTypeNode" |
    "IntersectionTypeNode" | "TypeReferenceNode" | "ArrayTypeNode" |
    "ParenthesizedTypeNode" | "NewExpression" | "ArrayLiteralExpression" |
    "ObjectLiteralExpression" | "ParenthesizedExpression" | "PropertyDeclaration" | "ClassDeclaration" |
    "InterfaceDeclaration" | "ImportDeclaration" | "ExportDeclaration" | "NamespaceImport";

export type TypeReturn = ts.Type | undefined;
