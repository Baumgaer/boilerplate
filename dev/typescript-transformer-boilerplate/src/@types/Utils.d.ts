import type ts from "typescript";

export type TSNodeNames =
    "Decorator" | "Identifier" | "NamedImports" | "NamedExports" | "NamespaceImport" |

    "TypeNode" | "UnionTypeNode" | "IntersectionTypeNode" | "TypeReferenceNode" |
    "ArrayTypeNode" | "TupleTypeNode" | "ParenthesizedTypeNode" | "OptionalTypeNode" |
    "LiteralTypeNode" | "ThisTypeNode" |

    "ExpressionStatement" | "NewExpression" | "ArrayLiteralExpression" |
    "ObjectLiteralExpression" | "ParenthesizedExpression" |

    "PropertyDeclaration" | "ClassDeclaration" | "InterfaceDeclaration" |
    "ImportDeclaration" | "ExportDeclaration" | "TypeAliasDeclaration" |
    "MethodDeclaration" |

    "PropertySignature" | "Parameter";

export type TypeReturn = ts.Type | undefined;
