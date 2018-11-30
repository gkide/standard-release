#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const helper = require('../helper');

helper.cmdParser.argv


console.log("standard-release %s", __dirname);
console.log(chalk.blue('Hello world!'));
