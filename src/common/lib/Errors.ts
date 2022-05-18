import { upperFirst } from "~common/utils/utils";
import type { PascalCase } from "type-fest";
import type { AttributeKinds } from "~common/@types/Errors";
import type BaseModel from "~common/lib/BaseModel";

export class BaseError extends Error {

    public override name: string = "UnknownError";

    public constructor(message: string) {
        super(message);
    }
}

export class ValidationError extends BaseError {

    public errors: (AttributeError | AggregateError)[];

    public constructor(errors: (AttributeError | AggregateError)[], model: BaseModel) {
        super(`Validation of Model ${model.className}:${model.getId()} failed`);
        this.errors = errors;
    }
}

export class AttributeError extends BaseError {

    public override name: `${Capitalize<AttributeKinds>}Error`;

    public attribute: string;

    public path: (string | number)[];

    public value: unknown;

    public constructor(attributeName: string, kind: AttributeKinds, path: (string | number)[], value: unknown) {
        const errorName = <PascalCase<AttributeKinds>>upperFirst(kind);
        super(`attribute "${attributeName}" is invalid: ${errorName}`);
        this.attribute = attributeName;
        this.name = `${errorName}Error`;
        this.path = path;
        this.value = value;
    }
}
