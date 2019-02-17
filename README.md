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

- If no argument, to update `CHANGELOG.md` by default; if has, then update the given file.
- It will keep all **unknown** groups of `[Unrelease]` if it has.
- The **unknown** groups can be user config using `changelog.js` and `commit.js`.
- It will guess the next version shoulb be used base on the git log history.
- The update changelog start from the previous release tag if has.
- The update changelog filter base on the setting of `changelog.js` and `commit.js`.
  * Auto update Changelog [Conventional Commits](https://github.com/gkide/githooks/blob/master/Conventional.md)

### Conventional Commits

```
<type>(<scope>): <subject>
<HERE-SHOULD-BE-ONE-BLANK-LINE>
<body>
<HERE-SHOULD-BE-ONE-BLANK-LINE>
<footer>
```

- `<type>` & `<subject>` are expected, others are optional
- All message lines prefer not being longer than 100 characters

### `<type>` should be one of

> Version Major

- **Incompatible**: `major` for explicit bump major verion.
- **Incompatible**: `break` for make any incompatible changes.
- **Incompatible**: `breaking` for make any incompatible changes.
- **Security**: `security` for anything related with vulnerabilities and security.
- **Deprecated**: `deprecated` for functionality or API which are soon-to-be removed.

> Version Minor

- **Features**: `minor` for explicit bump minor verion.
- **Features**: `feat` for new or modify features in backwards-compatible manner.
- **Features**: `feature` for new or modify features in backwards-compatible manner.

> Version Patch

- **Fixed**: `fix` for any bug fixes.
- **Fixed**: `patch` for any bug fixes.
- **Fixed**: `bugfix` for any bug fixes.

> Version Tweak

- **Changed**: `perf` for changes that improves the performance.
- **Changed**: `revert` for revert to a previous commit.
- **Changed**: `refactor` for neither bugfix nor feature changes.

- **Preview**: `wip` for something which is working in process or perview.
- **Preview**: `preview` for something which is working in process or perview.

- **Dependencies**: `deps` for any external dependencies changes.
- **Dependencies**: `build` for changes that affect the build system.

> Version Unrelated

- `ci` CI configuration changes.
- `docs` Documentation changes.
- `test` Adding new or correcting existing tests.
- `style` Changes that do not affect the code meaning.
- `chore` Other changes that don't modify src or test files.
- `skip` Skip commit style checking for some reason.

### `<scope>` is optional

If any, it should be one word for further supplement, for example:

- Use `*` when the change affects more than a single scope
- **compile** changes has relation with compilation
- **network** for changes that related to a module, like network

### `<subject>` should be a short line of succinct description for the changes

The subject should following the rules:

- no dot `.` at the end of line
- do not capitalize the first letter
- use the imperative, present tense: "change" not "changed" nor "changes"

### `<body>` is optional

If any, it should include motivation for the change and following the rules:

- what this commit changes, and why?
- use the imperative, present tense: "change" not "changed" nor "changes"

### `<footer>` is optional

If any, it should be one of the following ones:

- Closed Issues, the format is:
```
[CLOSE] a short description message for the closed issue
- more details information
```
or

```
[CLOSE#1] a short description message for the closed issue
- more details information
[CLOSE#2] a short description message for the closed issue
- more details information
```

- Known Issue, the format is:
```
[KNOWN ISSUE] a short description message for the known issue
- more details information
```
or

```
[KNOWN ISSUE#1] a short description message for the known issue
- more details information
[KNOWN ISSUE#2] a short description message for the known issue
- more details information
```

- Breaking Changes, the format is:
```
[BREAKING CHANGES] A short description message for the breaking changes
- more details information
```
or

```
[BREAKING CHANGES#1] A short description message for the breaking changes
- more details information
[BREAKING CHANGES#2] A short description message for the breaking changes
- more details information
```

## Reference

- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://github.com/conventional-commits/conventionalcommits.org)
- [Change Log Style](https://codingart.readthedocs.io/en/latest/ChangeLog.html)
- [Ideal Change Log](https://github.com/gkide/coding-style/blob/master/data/CHANGELOG.md)
