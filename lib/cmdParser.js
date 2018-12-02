'use strict';

const path = require('path');
const perconfig = require(path.join(__dirname, 'perconfig'))

module.exports = require('yargs')
    .wrap(90)
    .locale('en')
    .env('STANDARD_RELEASE')
    .pkgConf('standard-release')
    .usage('Usage: $0 [options]')
    .option('as', {
        alias: 'a',
        describe: 'Specify release type',
        requiresArg: true,
        choices: ['major', 'minor', 'patch'],
        string: true
    })
    .option('pre', {
        alias: 'p',
        describe: 'Make a pre-release with optional value as tag id',
        string: true
    })
    .option('init', {
        alias: 'i',
        describe: 'Init standard-release for a git project',
        string: true,
        default: '$PWD'
    })
    .option('tag-prefix', {
        alias: 't',
        describe: 'Set a prefix for the tag to be created',
        type: 'string',
        default: perconfig.tagPrefix
    })
    .option('changelog', {
        alias: 'r',
        describe: 'Read CHANGELOG from the given file',
        type: 'string',
        default: perconfig.loadChangelog
    })
    .option('message', {
        alias: 'm',
        describe: 'Do normal standard release',
        type: 'string',
        default: perconfig.message
    })
    .option('config-file', {
        alias: 'u',
        describe: 'Usr config file',
        type: 'string',
        requiresArg: true,
        default: path.join('$PWD', '.standard-release', 'config.js')
    })
    .option('validate', {
        alias: 'V',
        describe: 'Validate the given commit message',
        requiresArg: true,
        string: true
    })
    .option('hooks', {
        alias: 'H',
        describe: 'Events hooks to execute, like prebump, precommit, ...',
        default: perconfig.usrHooks
    })
    .group([ 'as', 'pre', 'init', 'hooks', 'message',
            'changelog', 'tag-prefix', 'config-file', 'validate'], 'Config:')
    .option('sign', {
        alias: 's',
        describe: 'Should the commit and tag be signed',
        type: 'boolean',
        default: perconfig.sign
    })
    .option('auto-commit', {
        alias: 'c',
        describe: 'Add all and commit staged changes',
        type: 'boolean',
        default: perconfig.doCommit
    })
    .option('first', {
        alias: 'f',
        describe: 'Is this the first release',
        type: 'boolean',
        default: perconfig.firstRelease
    })
    .option('silent', {
        alias: 'x',
        describe: 'Do not print logs and except errors',
        type: 'boolean',
        default: perconfig.silent
    })
    .option('dry-run', {
        alias: 'd',
        type: 'boolean',
        describe: 'Make standard-release dry run',
        default: perconfig.dryRun
    })
    .option('no-verify', {
        alias: 'n',
        describe: 'Skip pre-commit or commit-msg hooks',
        type: 'boolean',
        default: perconfig.noVerify
    })
    .version()
    .alias('version', 'v')
    .help()
    .alias('help', 'h')
    .example('$0', 'Release by updating changelog and tagging')
    .example('$0 -m "version v1.0.5"', 'Normal release with custom commit message');
