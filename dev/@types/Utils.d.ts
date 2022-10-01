import type ts from "typescript";

export type TSNodeNames =
    "Decorator" | "Identifier" | "NamedImports" | "NamedExports" | "NamespaceImport" |

    "TypeNode" | "UnionTypeNode" | "IntersectionTypeNode" | "TypeReferenceNode" |
    "ArrayTypeNode" | "ParenthesizedTypeNode" |

    "ExpressionStatement" | "NewExpression" | "ArrayLiteralExpression" |
    "ObjectLiteralExpression" | "ParenthesizedExpression" |

    "PropertyDeclaration" | "ClassDeclaration" | "InterfaceDeclaration" |
    "ImportDeclaration" | "ExportDeclaration";

export type TypeReturn = ts.Type | undefined;
