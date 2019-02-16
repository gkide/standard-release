'use strict';

// Native
const path = require('path');

// Run testing: misc APIs testing
require(path.resolve(__dirname, 'misc.js'));

// Run testing: git semver tags package
require(path.resolve(__dirname, 'mygit.js'));

// Run testing: standard-release -i
require(path.resolve(__dirname, 'init.js'));

// Run testing: standard-release --is-semver
require(path.resolve(__dirname, 'is-semver.js'));

// Run testing: standard-release -m, default rules
require(path.resolve(__dirname, 'commit-def.js'));

// Run testing: standard-release -m, custom rules
require(path.resolve(__dirname, 'commit-usr.js'));
