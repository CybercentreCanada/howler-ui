/* eslint-disable no-useless-escape */
import type { languages } from 'monaco-editor';

const TOKEN_PROVIDER: languages.IMonarchLanguage = {
  defaultToken: 'invalid',
  includeLF: true,

  operators: ['-', '||', '&&', ':'],

  keywords: ['AND', 'OR', 'NOT'],

  regexpctl: /[(){}\[\]\$\^|\-*+?\.]/,
  regexpesc: /\\(?:[bBdDfnrstvwWn0\\\/]|@regexpctl|c[A-Z]|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4})/,

  tokenizer: {
    root: [
      // TODO: Match this to valid field names in ES
      [
        /[a-zA-Z_*]+/,
        {
          cases: {
            '@keywords': 'operator',
            '@default': 'key'
          },
          log: 'key: $0'
        }
      ],
      [/\./, { token: 'dot' }],
      [/: */, { token: 'operator', next: '@value' }],
      [/-/, { token: 'operator' }],

      // parens
      [/\(/, { token: 'bracket', bracket: '@open', next: '@parens_root' }],

      // whitespace
      [/[ \t\r\n]+/, { token: 'whitespace' }],

      { include: 'common' }
    ],

    boolean: [[/true|false/, 'boolean']],

    common: [
      // regular expression: ensure it is terminated before beginning (otherwise it is an opeator)
      [
        /\/(?=([^\\\/]|\\.)+\/([gimsuy]*)(\s*)(\.|;|\/|,|\)|\]|\}|$))/,
        { token: 'regexp', bracket: '@open', next: '@regexp' }
      ],

      // strings
      [/"([^"\\]|\\.)*$/, { token: 'string.invalid' }], // non-teminated string
      [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],

      // comments
      [/#.*\n/, { token: 'comment' }],

      // numbers
      [/\d*\.\d+([eE][-+]?\d+)?/, 'number.float'],
      [/0[xX][0-9a-fA-F]+/, 'number.hex'],
      [/\d+/, 'number']
    ],

    parens_root: [{ include: '@root' }, [/\)/, { token: 'bracket', next: '@pop' }]],

    parens_value: [
      // whitespace
      [/[ \t\r\n]+/, { token: 'whitespace' }],
      { include: '@value' },
      [/\)/, { token: 'bracket', next: '@pop', bracket: '@close' }]
    ],

    string: [
      [/[^"']+/, { token: 'string' }],
      [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
    ],

    value: [
      { include: 'boolean' },

      [
        /([0-9a-zA-Z_*.-]*[a-zA-Z_*-]+[0-9a-zA-Z_*.-]*)/,
        {
          cases: {
            '@keywords': 'operator',
            '@default': 'constant'
          },
          log: 'value: $0'
        }
      ],

      // start parens
      [/\(/, { token: 'bracket', log: 'open paren value', bracket: '@open', next: '@parens_value' }],

      // end
      [/[ \t\r\n]+/, { token: 'whitespace', next: '@pop', log: 'end value' }],

      [/\)/, { token: 'bracket', next: '@pop' }],

      { include: 'common' }
    ],

    regexp: [
      [/(\{)(\d+(?:,\d*)?)(\})/, ['regexp.escape.control', 'regexp.escape.control', 'regexp.escape.control']],
      [
        /(\[)(\^?)(?=(?:[^\]\\\/]|\\.)+)/,
        ['regexp.escape.control', { token: 'regexp.escape.control', next: '@regexrange' }]
      ],
      [/(\()(\?:|\?=|\?!)/, ['regexp.escape.control', 'regexp.escape.control']],
      [/[()]/, 'regexp.escape.control'],
      [/@regexpctl/, 'regexp.escape.control'],
      [/[^\\\/]/, 'regexp'],
      [/@regexpesc/, 'regexp.escape'],
      [/\\\./, 'regexp.invalid'],
      [/(\/)([gimsuy]*)/, [{ token: 'regexp', bracket: '@close', next: '@pop' }, 'keyword.other']]
    ],

    regexrange: [
      [/-/, 'regexp.escape.control'],
      [/\^/, 'regexp.invalid'],
      [/@regexpesc/, 'regexp.escape'],
      [/[^\]]/, 'regexp'],
      [/\]/, { token: 'regexp.escape.control', next: '@pop', bracket: '@close' }]
    ]
  }
};

export default TOKEN_PROVIDER;
