# standard-release

## Init and Config

`standard-release -i` will generated **.standard-release** directory.

-  Commit message checking rules `commit.js`, affect ``standard-release -m``
- `commit.example.js` the default rules for commit message style checking.
- `semver.example.js` the same as ``-X``, ``-Y``, ``-Z``, ``-P`` and ``-B``,
   but cmd-line have high priority.

## Generated Changelog

`standard-release -c` will generated change-log if the repo
commit following the [Conventional Commits]((https://conventionalcommits.org)).
It also guess the next version shoulb be used base on the git log history
which begins with the previous release tag if the commit following
the default settings.

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

- `fix` A bug fix
- `feat` Introduce or modify the codebase features
- `break` User interface breaking changes
- `ci` CI configuration changes
- `docs` Documentation changes
- `test` Adding new or correcting existing tests
- `build` Changes that do affect the build system
- `perf` Code changes that improves the performance
- `style` Changes that do not affect the code meaning
- `chore` Other changes that don't modify src or test files
- `revert` Revert a previous commit
- `refactor` Changes that neither fixes a bug nor adds a feature
- `wip` Something which is working in process

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
