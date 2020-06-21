'use strict';

// Packages
module.exports = require('yargs')
  .wrap(100)
  .locale('en')
  .env('STANDARD_RELEASE')
  .pkgConf('standard-release')
  .usage('Usage: $0 [Core] [Semver] [Options]')
  .option('init', {
    alias: 'i',
    describe: 'Init for a git repo, default is "$PWD"',
    type: 'string'
  })
  .option('message', {
    alias: 'm',
    describe: 'Validate the given message or file as commit message',
    type: 'string',
    requiresArg: true
  })
  .option('changelog', {
    alias: 'c',
    describe: 'Update the given changelog file, default is "CHANGELOG.md"',
    type: 'string'
  })
  .option('changelog-template', {
    alias: 't',
    describe: 'Insert "Unreleased" template to changelog file',
    type: 'string'
  })
  .option('changelog-greed', {
    alias: 'g',
    describe: 'Keep unknown "Unreleased" groups when updating changelog',
    type: 'boolean'
  })
  .option('changelog-release', {
    alias: 'r',
    describe: 'Changelog "Released", default "Unreleased" for changelog',
    type: 'boolean'
  })
  .option('changelog-from', {
    alias: 'f',
    describe: 'Set history start point to get logs, can be Tag or SHA1',
    type: 'string'
  })
  .group([ 'init', 'message', 'changelog', 'changelog-from', 'changelog-template',
       'changelog-greed', 'changelog-release' ], 'Core:')
  .option('major', {
    alias: 'X',
    describe: 'Semantic version major, which is [0-9]',
    type: 'number',
    requiresArg: true
  })
  .option('minor', {
    alias: 'Y',
    describe: 'Semantic version minor, which is [0-9]',
    type: 'number',
    requiresArg: true
  })
  .option('patch', {
    alias: 'Z',
    describe: 'Semantic version patch, which is [0-9]',
    type: 'number',
    requiresArg: true
  })
  .option('pre-release', {
    alias: 'P',
    describe: "Semantic version pre-release",
    type: 'string'
  })
  .option('build-number', {
    alias: 'B',
    describe: "Semantic version build number",
    type: 'string'
  })
  .option('is-semver', {
    describe: 'Validate if the given string is semver',
    type: 'string',
    requiresArg: true
  })
  .option('newest-tag', {
    describe: 'Get repo semver tag: true for newest, otherwise for earliest',
    type: 'boolean',
    requiresArg: true
  })
  .group([
    'major', 'minor', 'patch', 'pre-release',
    'build-number', 'is-semver', 'newest-tag'
    ], 'SemVer:'
  )
  .option('silent', {
    alias: 'x',
    describe: 'Keep silent',
    type: 'boolean',
    default: false
  })
  .hide('dev')
  .option('dev', {
    describe: 'standard-release developers',
    type: 'boolean',
    default: false
  })
  .strict(true)
  .help()
  .alias('help', 'h')
  .version()
  .alias('version', 'v');
