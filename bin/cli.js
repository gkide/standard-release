#!/usr/bin/env node

'use strict';

if(process.version.match(/v(\d+)\./)[1] < 6) {
    console.error('Node v6 or greater is required. standard-release exit.')
}

const helper = require('../helper');
helper.standardRelease();
