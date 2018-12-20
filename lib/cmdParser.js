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
    .option('message', {
        alias: 'm',
        describe: 'Validate the given message or file',
        type: 'string',
        requiresArg: true
    })
    .option('changelog', {
        alias: 'c',
        describe: 'Read CHANGELOG from the given file',
        type: 'string',
        default: 'CHANGELOG.md'
    })
    .group([ 'init', 'message', 'changelog' ], 'Core:')
    .option('major', {
        alias: 'X',
        describe: 'Semantic version major',
        type: 'number',
        requiresArg: true
    })
    .option('minor', {
        alias: 'Y',
        describe: 'Semantic version minor',
        type: 'number',
        requiresArg: true
    })
    .option('patch', {
        alias: 'Z',
        describe: 'Semantic version patch',
        type: 'number',
        requiresArg: true
    })
    .option('pre-release', {
        alias: 'P',
        describe: "semantic version pre-release",
        type: 'string',
        default: ''
    })
    .option('build-number', {
        alias: 'B',
        describe: "semantic version build number",
        type: 'string',
        default: ''
    })
    .option('is-semver', {
        describe: 'validate if it is semver',
        type: 'string',
        requiresArg: true
    })
    .group([ 'major', 'minor', 'patch', 'pre-release',
             'build-number', 'is-semver' ], 'Semantic Version:')
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
    .strict(true)
    .help()
    .alias('help', 'h')
    .version()
    .alias('version', 'v');
