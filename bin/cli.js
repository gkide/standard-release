#!/usr/bin/env node

'use strict';

// Native
const path = require('path');

if(process.version.match(/v(\d+)\./)[1] < 6) {
  console.error('Node v6 or greater is required. standard-release exit.');
  process.exit(1);
}

require(path.join(__dirname, '..', 'helper')).standardRelease();
