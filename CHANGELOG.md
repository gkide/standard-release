# Change Log

- ALL NOTABLE CHANGES WILL BE DOCUMENTED HERE.
- PROJECT VERSIONS ADHERE TO [SEMANTIC VERSIONING](http://semver.org).
- REPOSITORY COMMITS ADHERE TO [CONVENTIONAL COMMITS](https://conventionalcommits.org).


## 2020-06-21 22:18:01 +0800 Release [v0.2.3](https://github.com/gkide/standard-release/releases/tag/v0.2.3)

[[☀](#v_Fixed_202006212218010800)]
comparing with [v0.2.2](https://github.com/gkide/standard-release/compare/v0.2.2...v0.2.3)

<span id = "v_Fixed_202006212218010800"></span>
### ☀ Fixed
- **fix**: do not install test/* for npm install ([82815b0](https://github.com/gkide/standard-release/commit/82815b0))

## 2019-05-21 19:06:08 +0800 Release [v0.2.2](https://github.com/gkide/standard-release/releases/tag/v0.2.2)

[[☕](#v_Features_201905211906080800)]
[[☀](#v_Fixed_201905211906080800)]
comparing with [v0.2.1](https://github.com/gkide/standard-release/compare/v0.2.1...v0.2.2)

<span id = "v_Features_201905211906080800"></span>
### ☕ Features
- **feat**: new args for getting newest/earliest semver-tag ([9f768a3](https://github.com/gkide/standard-release/commit/9f768a3))

<span id = "v_Fixed_201905211906080800"></span>
### ☀ Fixed
- **fix**: release quick nav links for mark down ([2c53505](https://github.com/gkide/standard-release/commit/2c53505))
- **fix**: return 'NO-TAGS-FOUND' when do not found semver tags ([3ae1f93](https://github.com/gkide/standard-release/commit/3ae1f93))

## 2019-03-05 04:14:58 +0800 Release [v0.2.1](https://github.com/gkide/standard-release/releases/tag/v0.2.1)

[[☕](#v_Features_201903050414580800)]
[[☀](#v_Fixed_201903050414580800)]
comparing with [v0.2.0](https://github.com/gkide/standard-release/compare/v0.2.0...v0.2.1)

<span id = "v_Features_201903050414580800"></span>
### ☕ Features
- **feat**: auto add git repo hash when update changelog for UNRELEASE ([df8c12e](https://github.com/gkide/standard-release/commit/df8c12e))

<span id = "v_Fixed_201903050414580800"></span>
### ☀ Fixed
- **fix**: release use tag if it has previous semver tag ([63614d6](https://github.com/gkide/standard-release/commit/63614d6))

## 2019-02-20 22:47:24 +0800 Release [v0.2.0](https://github.com/gkide/standard-release/releases/tag/v0.2.0)

[[☣](#v_Incompatible_201902202247240800)]
[[☕](#v_Features_201902202247240800)]
[[⛭](#v_Changed_201902202247240800)]
comparing with [v0.1.3-rc.1](https://github.com/gkide/standard-release/compare/v0.1.3-rc.1...v0.2.0)

<span id = "v_Incompatible_201902202247240800"></span>
### ☣ Incompatible
- **config**: refactor the config file to make it more clear
- **config**: new add config file `.standard-release/spec.changelog.js`
- **config**: `.standard-release/commit.example.js` => `.standard-release/spec.commit.js`
- **config**: `.standard-release/semver.example.js` => `.standard-release/spec.semver.js`

<span id = "v_Features_201902202247240800"></span>
### ☕ Features
- changelog release title: `YYYY-MM-DD HH:MM:SS ZZZZZ Release [TAG](URL)`
- fit to coding-style rules of [changelog](https://codingart.readthedocs.io/en/latest/ChangeLog.html)
- add **skip** header type and fix validate commit testing ([49e2fc0](https://github.com/gkide/standard-release/commit/49e2fc0))
- add changelog group symbols ([806ad5f](https://github.com/gkide/standard-release/commit/806ad5f))
- add commit group for changelog ([fb1bf43](https://github.com/gkide/standard-release/commit/fb1bf43))

- init creat template changelog ([6bb2914](https://github.com/gkide/standard-release/commit/6bb2914))
- init create specimen configuration file ([80ac924](https://github.com/gkide/standard-release/commit/80ac924))

- add args: **--changelog-from**, to set start point for raw logs
  * if not set, then to use the pervious tag by default
  * it can be set to tag or SHA1, set to SKIP or skip to skip all raw logs.
- add args: **--changelog-greed**, keep `[Unreleased]` unknown group
  * it is true for `standard-release -c` if not set
  * it is false for `standard-release -c --changelog-release` if not set
- add args: **--changelog-release**, use `YYYY-MM-DD HH:MM:SS ZZZZZ Release ...`
  * it is false if not set, then the top title use `[Unreleased]`
- add args: **--changelog-template**, add `[Unreleased]` template to changelog default is,
  * `## [Unreleased]`
  * `### ☠ Security`
  * `### ☕ Features`
  * `### ⚠ Deprecated`
  * `### ☣ Incompatible`
  * `### ☀ Fixed`
  * `### ⛭ Changed`
  * `### ⚑ Preview`
  * `### ☂ Dependencies`

<span id = "v_Changed_201902202247240800"></span>
### ⛭ Changed
- **test**: testing more, bugfix, and more
- **perf**: remove unused runtime log stuff ([3bffcf8](https://github.com/gkide/standard-release/commit/3bffcf8))
- **build**: remove unused deps packages ([7aa825d](https://github.com/gkide/standard-release/commit/7aa825d))


## 2019-01-05 22:17:07 +0800 Release [v0.1.3-rc.1](https://github.com/gkide/standard-release/releases/tag/v0.1.3-rc.1)
### BugFixes
- fix: cmd args no default & reasonal & readable, auto creat not error ([47b7128](https://github.com/gkide/standard-release/commit/47b7128))


## 2019-01-03 Release [v0.1.2](https://github.com/gkide/standard-release/releases/tag/v0.1.2)
### Style
- style: WIP => wip ([71b8c52](https://github.com/gkide/standard-release/commit/12383b2))
### BugFixes
- fix: commit object parse ([71b8c52](https://github.com/gkide/standard-release/commit/71b8c52))


## 2018-11-21 Release [v0.1.0](https://github.com/gkide/standard-release/releases/tag/v0.1.0)
### Features
- feat: check if it is a semver ([c8e9c7c](https://github.com/gkide/standard-release/commit/c8e9c7c))


## 2018-11-20 Release [v0.0.6](https://github.com/gkide/standard-release/releases/tag/v0.0.6)
### BugFixes
- fix: stupid init bugs ([20273bb](https://github.com/gkide/standard-release/commit/20273bb))


## 2018-11-17 Release [v0.0.5](https://github.com/gkide/standard-release/releases/tag/v0.0.5)
### BugFixes
- fix: default footer checking & testing ([1359a7b](https://github.com/gkide/standard-release/commit/1359a7b))


## 2018-11-17 Release [v0.0.4](https://github.com/gkide/standard-release/releases/tag/v0.0.4)
### BugFixes
- fix: default footer checking invalid line ([42d7358](https://github.com/gkide/standard-release/commit/42d7358))


## 2018-11-17 Release [v0.0.3](https://github.com/gkide/standard-release/releases/tag/v0.0.3)
### BugFixes
- fix: changlog update from latest tag to HEAD ([4094e42](https://github.com/gkide/standard-release/commit/4094e42))
- fix: skip # comments lines for header/body/footer ([d4d7507](https://github.com/gkide/standard-release/commit/d4d7507))


## 2018-11-17 Release [v0.0.2](https://github.com/gkide/standard-release/releases/tag/v0.0.2)
### Features
- feat: changelog automatic updating init ([47eeff1](https://github.com/gkide/standard-release/commit/47eeff1))
- feat: init add example file for semver.js ([3cbb87b](https://github.com/gkide/standard-release/commit/3cbb87b))
- feat: modify command line options ([f564f49](https://github.com/gkide/standard-release/commit/f564f49))
- feat: get git raw commit array ([235ba77](https://github.com/gkide/standard-release/commit/235ba77))
- feat: semantic git tags ([399da8b](https://github.com/gkide/standard-release/commit/399da8b))
- feat: footer checking & testing ([7d12604](https://github.com/gkide/standard-release/commit/7d12604))
- feature: get increment object init & and add some testing file ([affc5d8](https://github.com/gkide/standard-release/commit/affc5d8))
- feature: init --changelog/-l ([90c54e2](https://github.com/gkide/standard-release/commit/90c54e2))
- feature: init --first/-f ([91e474d](https://github.com/gkide/standard-release/commit/91e474d))
- feature(WIP): checking body & footer message ([799d9c9](https://github.com/gkide/standard-release/commit/799d9c9))
- feature: user config for commit message validating ([22f2d59](https://github.com/gkide/standard-release/commit/22f2d59))
- feature: env prefix: STANDARD_RELEASE_... & --config-file, -u option ([9fcdc24](https://github.com/gkide/standard-release/commit/9fcdc24))
- feature: init command: --init, -i ([e70c0c9](https://github.com/gkide/standard-release/commit/e70c0c9))
- feature: valid commit message init ([085c053](https://github.com/gkide/standard-release/commit/085c053))
- feature: init user interface ([fd3ff46](https://github.com/gkide/standard-release/commit/fd3ff46))

### BugFixes
- fix: skip signed-off-by for checking footer ([7a640e5](https://github.com/gkide/standard-release/commit/7a640e5))
- fix: git raw commit data ([18e5684](https://github.com/gkide/standard-release/commit/18e5684))
- fix: fix bug for footer checking & related testings ([bc1cf30](https://github.com/gkide/standard-release/commit/bc1cf30))
- fix: config file parsing bug fix ([144df11](https://github.com/gkide/standard-release/commit/144df11))
- fix: if scope is missing, just ignore it ([b03548b](https://github.com/gkide/standard-release/commit/b03548b))
- fix: runtime log write bug fix ([dd048c8](https://github.com/gkide/standard-release/commit/dd048c8))
