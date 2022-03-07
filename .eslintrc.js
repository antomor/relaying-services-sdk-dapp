// a11y rules are disabled because of out-of-scope for this sample app
const a11yOff = Object.keys(require('eslint-plugin-jsx-a11y').rules).reduce(
    (acc, rule) => {
        acc[`jsx-a11y/${rule}`] = 'off';
        return acc;
    },
    {}
);

module.exports = {
    env: {
        browser: true,
        es2021: true
    },
    extends: [
        'plugin:react/recommended',
        'airbnb',
        'airbnb-typescript',
        'prettier'
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaFeatures: {
            jsx: true
        },
        ecmaVersion: 12,
        sourceType: 'module',
        project: './tsconfig.json'
    },
    plugins: ['react', '@typescript-eslint'],
    rules: {
        'react/react-in-jsx-scope': 'off',
        'react/require-default-props': 'off',
        ...a11yOff,
        'no-alert': 'off',
        // TODO: we need to replace the console.log calls with a log library
        'no-console': 'off'
    }
};
