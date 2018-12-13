'use strict';

module.exports = require('yargs')
    .wrap(90)
    .locale('en')
    .env('STANDARD_RELEASE')
    .pkgConf('standard-release')
    .usage('Usage: $0 [options]')
    .option('init', {
        alias: 'i',
        describe: 'Init standard-release for a git project',
        type: 'string',
        default: '$PWD'
    })
    .option('release', {
        alias: 'r',
        describe: 'Updating changelog, tag, git add & push',
        type: 'string',
        default: ''
    })
    .option('message', {
        alias: 'm',
        describe: 'Validate the given message or file',
        type: 'string',
        requiresArg: true
    })
    .option('changelog', {
        alias: 'l',
        describe: 'Read CHANGELOG from the given file',
        type: 'string',
        default: 'CHANGELOG.md'
    })
    .group([ 'init', 'message', 'release', 'changelog' ], 'Core:')
    .option('semver', {
        alias: 'V',
        describe: "Semantic version of format 'X.Y.Z'",
        requiresArg: true,
        string: true
    })
    .option('pre-release', {
        alias: 'P',
        describe: "pre-release for emantic version",
        string: true,
        default: ''
    })
    .option('build-number', {
        alias: 'B',
        describe: "build number for semantic version",
        string: true,
        default: ''
    })
    .option('semver-keep-major', {
        describe: 'No touch semantic major version',
        type: 'boolean',
        default: false
    })
    .option('semver-keep-minor', {
        describe: 'No touch semantic minor version',
        type: 'boolean',
        default: false
    })
    .option('semver-keep-patch', {
        describe: 'No touch semantic patch version',
        type: 'boolean',
        default: false
    })
    .group([ 'semver', 'pre-release', 'build-number', 'semver-keep-major', 
             'semver-keep-minor',  'semver-keep-patch' ], 'Semantic Version:')
    .option('sign', {
        alias: 'S',
        describe: 'Should the commit and tag be signed',
        type: 'boolean',
        default: true
    })
    .option('auto-tag', {
        alias: 'T',
        type: 'boolean',
        describe: 'do `git tag vX.Y.Z-...+...`',
        default: true
    })
    .option('auto-push', {
        alias: 'P',
        type: 'boolean',
        describe: 'do `git push --tags`',
        default: true
    })
    .option('auto-commit', {
        alias: 'C',
        type: 'boolean',
        describe: "do `git commit -m 'chore(release): %s'`",
        default: true
    })
    .option('no-verify', {
        alias: 'N',
        describe: 'Skip pre-commit and commit-msg hooks',
        type: 'boolean',
        default: false
    })
    .group([ 'auto-tag', 'sign', 'auto-push', 'auto-commit', 'no-verify' ], 
        'Git Related(for -r only):')
    .hide('dev')
    .option('dev', {
        describe: 'For standard-release developer',
        type: 'boolean',
        default: false
    })
    .option('silent', {
        alias: 'x',
        describe: 'Do not print logs',
        type: 'boolean',
        default: false
    })
    .help()
    .alias('help', 'h')
    .version()
    .alias('version', 'v')
    .example('$0', 'Same as -r, except git part')
    .example('$0 -m "build: x ... x"', 'Is it a validate message')
    .example('$0 -r "build: v1.0.0"', 'git commit -m "build: v1.0.0"')
    .example('$0 -r "v1.0.0-0"', 'git commit -m "chore(release): v1.0.0-0"');
