module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    'plugin:vue/essential',
    'plugin:prettier/recommended',
    'eslint:recommended'
  ],
  rules: {
    'prettier/prettier': [
      'warn',
      {
        singleQuote: true,
        semi: false,
        trailingComma: 'none'
      }
    ],
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'linebreak-style': 0,
    quotes: ['error', 'single'],
    semi: ['error', 'never'],
    'no-extra-parens': ['error', 'all'],
    'no-template-curly-in-string': 'error',
    'array-callback-return': 'error',
    curly: ['error', 'multi-line'],
    'dot-notation': 'error',
    'no-else-return': 'error',
    'no-eval': 'error',
    'no-iterator': 'error',
    'no-loop-func': 'error',
    'no-multi-spaces': 'error',
    'no-multiple-empty-lines': 'error',
    'no-new-func': 'error',
    'no-new-wrappers': 'error',
    yoda: 'error',
    'wrap-iife': 'error',
    'require-await': 'error',
    'no-useless-return': 'error',
    'no-useless-concat': 'error',
    'no-return-await': 'error',
    'no-restricted-properties': 'error',
    'no-param-reassign': 'error',
    'no-prototype-builtins': 'error',
    'no-restricted-globals': 'error',
    'array-bracket-newline': ['error', 'consistent'],
    'array-bracket-spacing': ['error', 'never'],
    'array-element-newline': ['error', 'consistent'],
    'block-spacing': 'error',
    'comma-dangle': ['error', 'never'],
    'comma-spacing': 'error',
    'comma-style': ['error', 'last'],
    'computed-property-spacing': 'error',
    'func-call-spacing': 'error',
    'func-style': 'error',
    'function-paren-newline': ['error', 'never'],
    'implicit-arrow-linebreak': 'error',
    'key-spacing': 'error',
    'lines-between-class-members': 'error',
    'newline-per-chained-call': ['error', { ignoreChainWithDepth: 4 }],
    'no-lonely-if': 'error',
    'no-trailing-spaces': 'error',
    'no-unneeded-ternary': 'error',
    'nonblock-statement-body-position': ['error', 'beside'],
    'one-var': ['error', 'never'],
    'padded-blocks': ['error', 'never'],
    'padding-line-between-statements': 'error',
    'prefer-spread': 'error',
    'prefer-object-spread': 'error',
    'space-before-function-paren': [
      'error',
      {
        anonymous: 'never',
        named: 'never',
        asyncArrow: 'always'
      }
    ],
    'keyword-spacing': 'error',
    'space-in-parens': ['error', 'never'],
    'space-unary-ops': 'error',
    'space-infix-ops': 'error',
    'spaced-comment': 'error',
    'wrap-regex': 'error',
    'no-duplicate-imports': 'error',
    'arrow-parens': ['error', 'as-needed'],
    'arrow-spacing': 'error',
    'template-curly-spacing': 'error',
    'rest-spread-spacing': 'error',
    'prefer-template': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    'object-shorthand': 'error',
    'no-var': 'error'
  },
  parserOptions: {
    parser: '@typescript-eslint/parser', // the typescript-parser for eslint, instead of tslint
    sourceType: 'module', // allow the use of imports statements
    ecmaVersion: 2018 // allow the parsing of modern ecmascript
  }
}
