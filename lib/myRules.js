// semver from semver.js
exports.semverRules = {
    major: 1,
    minor: 2,
    patch: 3,
    preRelease: 'pre',
    buildNumber: '20181214'
}

// The default commit message checking rules
//
// For more readable project history and generate periodically changelog:
// - each commit message consists of a header, a body and a footer
// - header has a special format includes a type, a scope and a subject
// The commit message should be structured as follows:
// <type>[scope]: <subject>
// <ONE-BLANK-LINE>
// [body]
// <ONE-BLANK-LINE>
// [footer]
exports.commitRules = {
    failOnAutoFix: true, // fail if auto fix
    header: {
        maxLength: 80, // header message max length
        // CHANGELOG will automatically generated based on those tags
        type: [
            ////////////////////////////////////////////////////////////////////
            // Bump MAJOR when make incompatible changes
            // - footer [BREAKING CHANGES] result in MAJOR bumping
            { skip: false, isFilter: 'Incompatible', name: 'major' },
            { skip: false, isFilter: 'Incompatible', name: 'break' },
            { skip: false, isFilter: 'Incompatible', name: 'breaking' },
            { skip: false, isFilter: 'Security', name: 'security' },
            { skip: false, isFilter: 'Deprecated', name: 'deprecated' },
            ////////////////////////////////////////////////////////////////////
            // Bump MINOR when add new feature in backwards-compatible manner
            { skip: false, isFilter: 'Features', name: 'minor' },
            { skip: false, isFilter: 'Features', name: 'feat' },
            { skip: false, isFilter: 'Features', name: 'feature' },
            ////////////////////////////////////////////////////////////////////
            // Bump PATCH when make backwards-compatible bug fixes
            { skip: false, isFilter: 'Fixed', name: 'patch' },
            { skip: false, isFilter: 'Fixed', name: 'fix' },
            { skip: false, isFilter: 'Fixed', name: 'bugfix' },
            //------------------------------------------------------------------
            // Changes that improves the performance
            { skip: false, isFilter: 'Changed', name: 'perf' },
            // Reverts to the previous commit
            { skip: false, isFilter: 'Changed', name: 'revert' },
            // A code change that neither fixes a bug nor adds a feature
            { skip: false, isFilter: 'Changed', name: 'refactor' },
            //------------------------------------------------------------------
            // Changes that affect the build system
            { skip: false, isFilter: 'Dependencies', name: 'build' },
            // Changes that affect any external dependencies
            { skip: false, isFilter: 'Dependencies', name: 'deps' },
            //------------------------------------------------------------------
            // Skip commit checking for Work In Process(WIP)
            { skip: true,  isFilter: 'Preview', name: 'wip' },
            { skip: true,  isFilter: 'Preview', name: 'preview' },
            //------------------------------------------------------------------
            // Changes of CI configuration files/scripts
            { skip: false, isFilter: false, name: 'ci' },
            // Documentation changes only, such as user manual
            { skip: false, isFilter: false, name: 'docs' },
            // Adding missing tests or correcting existing tests
            { skip: false, isFilter: false, name: 'test' },
            // Changes that do not affect the meaning of the code
            { skip: false, isFilter: false, name: 'style' },
            // Changes that do not modify source or test files
            { skip: false, isFilter: false, name: 'chore' },
        ],
        // Default: lowercase, one word, can be empty
        scope: function(scopeMsg) {
            return { ok: false };
            return { ok: true };
            return { ok: true, autofix: 'new scope msg' };
        },
        // Default: lower-case-started, no empty, no ending with dot(.)
        subject: function(subjectMsg) {
            return { ok: false };
            return { ok: true };
            return { ok: true, autofix: 'new subject msg' };
        }
    },
    // Default: can be anything, including empty
    body: function(bodyMsg) {
        return { ok: false };
        return { ok: true };
        return { ok: true, autofix: 'new body msg' };
    },
    // default: if not empty, should be one of
    // [CLOSE] ... or [CLOSE#XXX] ...
    // [KNOWN ISSUE] ... or [KNOWN ISSUE#XXX] ...
    // [BREAKING CHANGES] ... or [BREAKING CHANGES#XXX] ...
    footer: function(footerMsg) {
        return { ok: false };
        return { ok: true };
        return { ok: true, autofix: 'new footer msg' };
    }
}
