# standard-release

![node-min-version](https://img.shields.io/node/v/v.svg)
![npm-version](https://img.shields.io/npm/v/@gkide/standard-release.svg)
![top-language-rate](https://img.shields.io/github/languages/top/gkide/standard-release.svg)
![languages-count](https://img.shields.io/github/languages/count/gkide/standard-release.svg)
![code-size](https://img.shields.io/github/languages/code-size/gkide/standard-release.svg)
![downloads-count](https://img.shields.io/github/downloads/gkide/standard-release/total.svg)
![open-issues](https://img.shields.io/github/issues/gkide/standard-release.svg)
![open-pull-requests](https://img.shields.io/github/issues-pr/gkide/standard-release.svg)

## Init and Config

`standard-release -i` will generated **.standard-release** directory.

- Generated `CHANGELOG.md` at the repo root directory with default logs.
- The `spec.*.js` is the example file, modify & rename to `*.js` for custom config.
- `spec.changelog.js` the default rules for changelog updating.
- `spec.commit.js` the default rules for commit message style checking.
- `spec.semver.js` the same as ``-X``, ``-Y``, ``-Z``, ``-P`` and ``-B``,
   but cmd-line have high priority.


## Changelog Updating

`standard-release -c` will update change log if the repo commit
following the [Conventional Commits](https://conventionalcommits.org).

- If no argument, updating `CHANGELOG.md`, else updating the given file.
- It will keep all **unknown** groups of `[Unrelease]` if it has.
- The **unknown** groups can be user config using `changelog.js` and `commit.js`.
- It will guess the next version shoulb be used base on the git log history.
- The update changelog get commit logs start from the previous release tag if has.
- The update changelog filter base on the setting of `changelog.js` and `commit.js`.
  * Auto update changelog default [Conventional Commits](https://github.com/gkide/githooks/blob/master/Conventional.md) rules.
