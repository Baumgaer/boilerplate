import { Forbidden as HttpForbidden, InternalServerError as HttpInternalServerError, NotAcceptable as HttpNotAcceptable, NotFound as HttpNotFound } from "http-errors";
import { upperFirst } from "~env/utils/utils";
import type { PascalCase } from "type-fest";
import type { TypedKinds } from "~env/@types/Errors";

export class BaseError extends Error {

    public override readonly name: string = "UnknownError";

    public readonly status: number = 500;

    public readonly statusCode: number = 500;

    public readonly expose: boolean = true;

    public constructor(message: string) {
        super(message);
    }
}

export class TypeError extends BaseError {

    public override readonly name: string = "TyeError";

    public override readonly status: number = 400;

    public override readonly statusCode: number = 400;

    public readonly kind: string = "unknown";

    public readonly path: (string | number)[];

    public readonly value?: unknown;

    public constructor(message: string, kind: TypedKinds, path: (string | number)[], value?: unknown) {
        super(message);
        this.kind = kind;
        this.path = path;
        this.value = value;
    }

}

export class AttributeError extends TypeError {

    public override readonly name: `${Capitalize<TypedKinds>}Error`;

    public readonly attribute: string;

    public constructor(attributeName: string, kind: TypedKinds, path: (string | number)[], value: unknown) {
        const errorName = <PascalCase<TypedKinds>>upperFirst(kind);
        super(`attribute "${attributeName}" is invalid: ${errorName}`, kind, path, value);
        this.attribute = attributeName;
        this.name = `${errorName}Error`;
    }
}

export class ParameterError extends TypeError {

    public override readonly name: `${Capitalize<TypedKinds>}Error`;

    public readonly parameter: string;

    public constructor(attributeName: string, kind: TypedKinds, path: (string | number)[], value: unknown) {
        const errorName = <PascalCase<TypedKinds>>upperFirst(kind);
        super(`parameter "${attributeName}" is invalid: ${errorName}`, kind, path, value);
        this.parameter = attributeName;
        this.name = `${errorName}Error`;
    }
}

export class Forbidden extends HttpForbidden { }

export class InternalServerError extends HttpInternalServerError { }

export class NotAcceptable extends HttpNotAcceptable { }

export class NotFound extends HttpNotFound { }
