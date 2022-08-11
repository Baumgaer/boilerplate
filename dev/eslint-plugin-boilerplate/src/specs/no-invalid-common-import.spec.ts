import { ESLintUtils } from '@typescript-eslint/utils';
import { NoInvalidCommonImport } from "../rules/no-invalid-common-import";

const ruleTester = new ESLintUtils.RuleTester({
    parser: '@typescript-eslint/parser'
});

ruleTester.run('no-invalid-common-import', NoInvalidCommonImport, {
    valid: [{
        filename: "TestFile.ts",
        code: 'import anything from "~common/any/TestFile";'
    }],
    invalid: [{
        filename: "TestFile.ts",
        code: 'import anything from "~common/any/TestFiles";',
        // we can use messageId from the rule object
        errors: [{ messageId: 'noInvalidCommonImport' }]
    }]
});
