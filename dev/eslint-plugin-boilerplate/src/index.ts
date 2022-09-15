import { NoInvalidCommonImport } from "./rules/no-invalid-common-import";
import { PreferEnvImports } from "./rules/prefer-env-import";

export const rules = {
    'no-invalid-common-import': NoInvalidCommonImport,
    'prefer-env-import': PreferEnvImports
};
