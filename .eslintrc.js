module.exports = {
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    parserOptions: {
        parser: '@typescript-eslint/parser',
        ecmaFeatures: {
            legacyDecorators: true
        }
    },
    rules: {
        'no-extra-semi': 'off',
        'no-undef': 'warn',
        'no-unused-vars': 'warn',
        'no-console': 'warn',
        'no-case-declarations': 'warn',
        'no-unreachable': 'warn',
        semi: ['error', 'always'],
        strict: 'warn',
        quotes: ['error', 'single'],
        'space-in-parens': ['error', 'always'],
        'keyword-spacing': ['error', { before: true, after: true }],
        'space-before-blocks': ['error', 'always'],
        "@typescript-eslint/no-use-before-define": ["warn", { "functions": false, "classes": false }],
        "@typescript-eslint/no-namespace": "warn",
        "@typescript-eslint/no-var-requires": "warn",
        '@typescript-eslint/indent': ['error', 2],
        '@typescript-eslint/camelcase': 'off',
        //'prefer-const': 'off',
        //'no-constant-condition': 'off',
        //'@typescript-eslint/ban-ts-ignore': 'off',
        //'@typescript-eslint/no-inferrable-types': 'off',
        //'@typescript-eslint/member-delimiter-style': 'off',
    }
};
