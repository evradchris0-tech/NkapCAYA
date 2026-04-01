/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Types autorisés
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'refactor', 'test', 'docs', 'chore', 'perf', 'ci', 'revert'],
    ],
    // Scopes autorisés (modules du projet)
    'scope-enum': [
      1, // warning (pas bloquant) pour laisser de la flexibilité
      'always',
      [
        'auth',
        'config',
        'members',
        'fiscal-year',
        'sessions',
        'savings',
        'loans',
        'rescue-fund',
        'beneficiaries',
        'cassation',
        'reports',
        'notifications',
        'database',
        'web',
        'mobile',
        'ci',
        'deps',
      ],
    ],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
    'subject-max-length': [2, 'always', 100],
    'body-max-line-length': [1, 'always', 120],
  },
};
