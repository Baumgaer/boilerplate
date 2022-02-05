module.exports = {
    root: true,
    env: {
        node: true
    },
    'extends': [
        'plugin:vue/vue3-essential',
        'eslint:recommended',
        '@vue/typescript/recommended'
    ],
    parserOptions: {
        ecmaVersion: 2020
    },
    rules: {
        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'vue/no-deprecated-slot-attribute': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': ["warn", {
            "argsIgnorePattern": "^_"
        }],
        '@typescript-eslint/no-inferrable-types': "off",
        '@typescript-eslint/explicit-member-accessibility': "error",
        '@typescript-eslint/consistent-type-imports': ["error", { "prefer": "type-imports" }],
        "vue/html-indent": [
            "error",
            4,
            {
                "attribute": 1,
                "baseIndent": 1,
                "closeBracket": 0,
                "alignAttributesVertically": true,
                "ignores": []
            }
        ],
        "@typescript-eslint/indent": ["error", 4],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "curly": [
            "error",
            "multi-line"
        ],
        "semi": [
            "error",
            "always"
        ],
        "vue/comma-dangle": [
            "error",
            "never"
        ],
        "comma-dangle": [
            "error",
            "never"
        ],
        "no-trailing-spaces": "error",
        "semi-spacing": [
            "error",
            {
                "before": false,
                "after": true
            }
        ],
        "arrow-spacing": [
            "error",
            {
                "before": true,
                "after": true
            }
        ],
        "no-use-before-define": [
            "error",
            {
                "functions": false,
                "classes": false,
                "variables": true
            }
        ],
        "guard-for-in": "error",
        "strict": [
            "error",
            "global"
        ],
        "camelcase": "error",
        "dot-notation": "error"
    },
    overrides: [
        {
            files: [
                '**/__tests__/*.{j,t}s?(x)',
                '**/tests/unit/**/*.spec.{j,t}s?(x)'
            ],
            env: {
                jest: true
            }
        }
    ]
};
