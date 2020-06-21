'use strict';

// Native
const path = require('path');

// misc APIs testing
require(path.resolve(__dirname, 'misc.js'));

// git semver tags testing
require(path.resolve(__dirname, 'mygit.js'));

// --init
require(path.resolve(__dirname, 'init.js'));

// --is-semver
require(path.resolve(__dirname, 'is-semver.js'));

// --message, default commit message rules
require(path.resolve(__dirname, 'commit-def.js'));

// --message, custom commit message rules
require(path.resolve(__dirname, 'commit-usr.js'));

// --changelog, default changelog rules
require(path.resolve(__dirname, 'changelog-def.js'));

// --changelog, custom changelog rules
require(path.resolve(__dirname, 'changelog-usr.js'));
