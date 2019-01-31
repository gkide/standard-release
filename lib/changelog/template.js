'use strict';

// Native
const fs = require('fs');
const path = require('path');

// Packages
//const nodefetch = require('node-fetch');
const handlebars = require('handlebars');

// Utilities

function gihubUrls(httpsUrl) {
    let urls = {
        commit: null,
        issues: null,
        release: null,
    };

    if(httpsUrl) {
        if(httpsUrl.slice(-4) == '.git') {
            httpsUrl = httpsUrl.slice(0, -4);
        }
        urls.commit = httpsUrl + '/commit';
        urls.issues = httpsUrl + '/issues';
        urls.release = httpsUrl + '/releases/tag';
    }

    return urls;
}

function compileTemplate(helper, repoUrl, newVer, oldVer, changelog) {
    const urls = gihubUrls(repoUrl);
    const changelogSwap = changelog + '.swap'; // changelog swap file
    helper.debugMsg("repo remote urls", urls);

    return false;
}

exports.compile = compileTemplate;
