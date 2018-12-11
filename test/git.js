'use strict';

const shell = require('shelljs');

function tag(tag, msg) {
    shell.exec('git tag -a ' + tag + ' -m "' + msg + '"');
}

function branch(branch) {
    shell.exec('git branch ' + branch);
}

function checkout(branch) {
    shell.exec('git checkout ' + branch);
}

function commit(msg) {
    shell.exec('git commit --allow-empty -m"' + msg + '"');
}

function merge(msg, branch) {
    shell.exec('git merge --no-ff -m"' + msg + '" ' + branch);
}

exports.tag = tag;
exports.branch = branch;
exports.checkout = checkout;
exports.commit = commit;
exports.merge = merge;
