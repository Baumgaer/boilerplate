import ts, { SymbolFlags, SyntaxKind } from "typescript";
import type { TSNodeNames } from "../@types/Utils";

export function isDecoratorNode(node?: ts.Node): node is ts.Decorator {
    return isNode("Decorator", node);
}

export function isIdentifierNode(node?: ts.Node): node is ts.Identifier {
    return isNode("Identifier", node);
}

export function isTypeNode(node?: ts.Node): node is ts.TypeNode {
    return isNode("TypeNode", node);
}

export function isThisTypeNode(node?: ts.Node): node is ts.ThisTypeNode {
    return isNode("ThisTypeNode", node);
}

export function isUnionTypeNode(node?: ts.Node): node is ts.UnionTypeNode {
    return isNode("UnionTypeNode", node);
}

export function isIntersectionTypeNode(node?: ts.Node): node is ts.IntersectionTypeNode {
    return isNode("IntersectionTypeNode", node);
}

export function isLiteralTypeNode(node?: ts.Node): node is ts.LiteralTypeNode {
    return isNode("LiteralTypeNode", node);
}

export function isTypeReferenceNode(node?: ts.Node): node is ts.TypeReferenceNode {
    return isNode("TypeReferenceNode", node);
}

export function isArrayTypeNode(node?: ts.Node): node is ts.ArrayTypeNode {
    return isNode("ArrayTypeNode", node);
}

export function isTupleTypeNode(node?: ts.Node): node is ts.TupleTypeNode {
    return isNode("TupleTypeNode", node);
}

export function isParenthesizedTypeNode(node?: ts.Node): node is ts.ParenthesizedTypeNode {
    return isNode("ParenthesizedTypeNode", node);
}

export function isOptionalTypeNode(node?: ts.Node): node is ts.OptionalTypeNode {
    return isNode("OptionalTypeNode", node);
}

export function isNamespaceImportNode(node?: ts.Node): node is ts.NamespaceImport {
    return isNode("NamespaceImport", node);
}

export function isNamedImportsNode(node?: ts.Node): node is ts.NamedImports {
    return isNode("NamedImports", node);
}

export function isNamedExportsNode(node?: ts.Node): node is ts.NamedExports {
    return isNode("NamedExports", node);
}

export function isExpressionStatement(node?: ts.Node): node is ts.ExpressionStatement {
    return isNode("ExpressionStatement", node);
}

export function isNewExpression(node?: ts.Node): node is ts.NewExpression {
    return isNode("NewExpression", node);
}

export function isArrayLiteralExpression(node?: ts.Node): node is ts.ArrayLiteralExpression {
    return isNode("ArrayLiteralExpression", node);
}

export function isObjectLiteralExpression(node?: ts.Node): node is ts.ObjectLiteralExpression {
    return isNode("ObjectLiteralExpression", node);
}

export function isParenthesizedExpression(node?: ts.Node): node is ts.ParenthesizedExpression {
    return isNode("ParenthesizedExpression", node);
}

export function isPropertyDeclaration(node?: ts.Node): node is ts.PropertyDeclaration {
    return isNode("PropertyDeclaration", node);
}

export function isParameter(node?: ts.Node): node is ts.ParameterDeclaration {
    return isNode("Parameter", node);
}

export function isClassDeclaration(node?: ts.Node): node is ts.ClassDeclaration {
    return isNode("ClassDeclaration", node);
}

export function isMethodDeclaration(node?: ts.Node): node is ts.MethodDeclaration {
    return isNode("MethodDeclaration", node);
}

export function isInterfaceDeclaration(node?: ts.Node): node is ts.InterfaceDeclaration {
    return isNode("InterfaceDeclaration", node);
}

export function isImportDeclaration(node?: ts.Node): node is ts.ImportDeclaration {
    return isNode("ImportDeclaration", node);
}

export function isExportDeclaration(node?: ts.Node): node is ts.ExportDeclaration {
    return isNode("ExportDeclaration", node);
}

export function isPropertySignature(node?: ts.Node): node is ts.PropertySignature {
    return isNode("PropertySignature", node);
}

export function isDefaultKeyword(node?: ts.Node): node is ts.DefaultKeyword {
    return Boolean(node && (node.kind & SyntaxKind.DefaultKeyword) === SyntaxKind.DefaultKeyword);
}

export function isPublicKeyword(node?: ts.Node): node is ts.PublicKeyword {
    return Boolean(node && (node.kind & SyntaxKind.PublicKeyword) === SyntaxKind.PublicKeyword);
}

export function isProtectedKeyword(node?: ts.Node): node is ts.ProtectedKeyword {
    return Boolean(node && (node.kind & SyntaxKind.ProtectedKeyword) === SyntaxKind.ProtectedKeyword);
}

export function isPrivateKeyword(node?: ts.Node): node is ts.PrivateKeyword {
    return Boolean(node && (node.kind & SyntaxKind.PrivateKeyword) === SyntaxKind.PrivateKeyword);
}

export function isExportKeyword(node?: ts.Node): node is ts.ExportKeyword {
    return Boolean(node && (node.kind & SyntaxKind.ExportKeyword) === SyntaxKind.ExportKeyword);
}

export function isAbstractKeyword(node?: ts.Node): node is ts.AbstractKeyword {
    return Boolean(node && (node.kind & SyntaxKind.AbstractKeyword) === SyntaxKind.AbstractKeyword);
}

export function isReadonlyKeyword(node?: ts.Node): node is ts.ReadonlyKeyword {
    return Boolean(node && (node.kind & SyntaxKind.ReadonlyKeyword) === SyntaxKind.ReadonlyKeyword);
}

export function isVoidKeyword(node?: ts.Node): node is ts.VoidExpression {
    return Boolean(node && (node.kind & SyntaxKind.VoidKeyword) === SyntaxKind.VoidKeyword);
}

export function isOverrideKeyword(node?: ts.Node): node is ts.OverrideKeyword {
    return Boolean(node && (node.kind & SyntaxKind.OverrideKeyword) === SyntaxKind.OverrideKeyword);
}

export function isPromiseTypeNode(checker: ts.TypeChecker, node?: ts.Node) {
    if (!node || !isTypeNode(node) || !isTypeReferenceNode(node)) return false;
    const symbol = checker.getSymbolAtLocation(node.typeName);
    if (!symbol) return false;
    const isFunctionScopedVariable = (symbol.flags & SymbolFlags.FunctionScopedVariable) === SymbolFlags.FunctionScopedVariable;
    return isFunctionScopedVariable && symbol.escapedName === "Promise";
}

export function isDateTypeNode(checker: ts.TypeChecker, node?: ts.Node): node is ts.TypeReferenceNode {
    if (!node || !isTypeNode(node) || !isTypeReferenceNode(node)) return false;
    const symbol = checker.getSymbolAtLocation(node.typeName);
    if (!symbol) return false;
    const isFunctionScopedVariable = (symbol.flags & SymbolFlags.FunctionScopedVariable) === SymbolFlags.FunctionScopedVariable;
    return isFunctionScopedVariable && symbol.escapedName === "Date";
}

export function isNode(kind: TSNodeNames, node?: ts.Node) {
    if (!node) return false;
    try {
        return ts[`is${kind}`](node);
    } catch (error) {
        return false;
    }
}
